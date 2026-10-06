'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken, requireActiveAdmin } = require('../middleware/auth');
const { authorizePrivilege } = require('../middleware/authorize');
const { logActivity } = require('../lib/activityLog');

router.use(authenticateToken);
router.use(requireActiveAdmin);
router.use(authorizePrivilege('delegates'));

function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function summarizeRows(rows) {
  const total = rows.length;
  let supporting = 0;
  let notSupporting = 0;
  let floating = 0;
  let surveyed = 0;
  for (const r of rows) {
    if (!r.status) continue;
    surveyed += 1;
    if (r.status === 'Supporting') supporting += 1;
    else if (r.status === 'Not Supporting') notSupporting += 1;
    else if (r.status === 'Floating') floating += 1;
  }
  return {
    total,
    surveyed,
    notSurveyed: Math.max(total - surveyed, 0),
    supporting,
    notSupporting,
    floating,
    supportingPct: pct(supporting, surveyed),
    notSupportingPct: pct(notSupporting, surveyed),
    floatingPct: pct(floating, surveyed),
    surveyedPct: pct(surveyed, total),
  };
}

function groupBy(rows, keyFn, nameFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row) || '__none__';
    if (!map.has(key)) {
      map.set(key, { id: key === '__none__' ? null : key, name: nameFn(row) || 'Unassigned', rows: [] });
    }
    map.get(key).rows.push(row);
  }
  return [...map.values()]
    .map((g) => ({
      id: g.id,
      name: g.name,
      ...summarizeRows(g.rows),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildFilters(query) {
  const params = [];
  const clauses = [];

  if (query.electoralAreaId) {
    params.push(String(query.electoralAreaId));
    clauses.push(`d.electoral_area_id = $${params.length}`);
  }
  if (query.pollingStationId) {
    params.push(String(query.pollingStationId));
    clauses.push(`d.polling_station_id = $${params.length}`);
  }
  if (query.categoryId) {
    params.push(String(query.categoryId));
    clauses.push(`d.category_id = $${params.length}`);
  }
  if (query.status) {
    params.push(String(query.status));
    clauses.push(`d.status = $${params.length}`);
  }
  if (query.gender) {
    params.push(String(query.gender));
    clauses.push(`d.gender = $${params.length}`);
  }
  if (query.currentStatus) {
    if (query.currentStatus === 'Unsurveyed') {
      clauses.push('d.current_status IS NULL');
    } else {
      params.push(String(query.currentStatus));
      clauses.push(`d.current_status = $${params.length}`);
    }
  }
  if (query.search) {
    params.push(`%${String(query.search).trim()}%`);
    const p = `$${params.length}`;
    clauses.push(`(
      d.delegate_code ILIKE ${p}
      OR d.full_name ILIKE ${p}
      OR d.phone ILIKE ${p}
      OR d.community ILIKE ${p}
    )`);
  }

  return { params, where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '' };
}

function csvEscape(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Snapshot: current delegate state.
 * Historical: latest survey_record per delegate within [from, to] (inclusive by created_at date).
 */
async function loadReportDataset(db, query) {
  const mode = query.from || query.to ? 'historical' : 'snapshot';
  const filterQuery = { ...query };
  if (mode === 'historical') {
    delete filterQuery.currentStatus;
  }
  const { params, where } = buildFilters(filterQuery);

  if (mode === 'snapshot') {
    const { rows } = await db.query(
      `SELECT d.id, d.delegate_code, d.full_name, d.phone, d.gender, d.community, d.status,
              d.current_status AS status_value, d.current_confidence AS confidence,
              d.last_contacted_at, d.next_follow_up_at,
              d.electoral_area_id, ea.name AS electoral_area_name,
              d.polling_station_id, COALESCE(ps.name, d.polling_station_name) AS polling_station_name,
              d.category_id, dc.name AS category_name,
              d.ghana_card, d.voters_id
       FROM delegates d
       LEFT JOIN electoral_areas ea ON ea.id = d.electoral_area_id
       LEFT JOIN polling_stations ps ON ps.id = d.polling_station_id
       LEFT JOIN delegate_categories dc ON dc.id = d.category_id
       ${where}
       ORDER BY d.full_name ASC`,
      params,
    );

    const dataset = rows.map((r) => ({
      id: r.id,
      delegateCode: r.delegate_code,
      fullName: r.full_name,
      phone: r.phone,
      gender: r.gender,
      community: r.community,
      registryStatus: r.status,
      status: r.status_value,
      confidence: r.confidence,
      lastContactedAt: r.last_contacted_at,
      nextFollowUpAt: r.next_follow_up_at,
      electoralAreaId: r.electoral_area_id,
      electoralAreaName: r.electoral_area_name,
      pollingStationId: r.polling_station_id,
      pollingStationName: r.polling_station_name,
      categoryId: r.category_id,
      categoryName: r.category_name,
      ghanaCard: r.ghana_card,
      votersId: r.voters_id,
      officerId: null,
      officerName: null,
      surveyAt: null,
    }));

    return { mode, dataset };
  }

  const from = query.from ? String(query.from) : null;
  const to = query.to ? String(query.to) : null;
  const histParams = [...params];
  const histClauses = [];

  if (from) {
    histParams.push(from);
    histClauses.push(`sr.created_at::date >= $${histParams.length}::date`);
  }
  if (to) {
    histParams.push(to);
    histClauses.push(`sr.created_at::date <= $${histParams.length}::date`);
  }

  const delegateWhere = where;
  const surveyWhere = histClauses.length ? `AND ${histClauses.join(' AND ')}` : '';

  const { rows } = await db.query(
    `WITH latest AS (
       SELECT DISTINCT ON (sr.delegate_id)
              sr.delegate_id, sr.status, sr.confidence, sr.last_contacted_at, sr.next_follow_up_at,
              sr.created_at, sr.created_by
       FROM survey_records sr
       WHERE 1=1 ${surveyWhere}
       ORDER BY sr.delegate_id, sr.created_at DESC
     )
     SELECT d.id, d.delegate_code, d.full_name, d.phone, d.gender, d.community, d.status,
            l.status AS status_value, l.confidence, l.last_contacted_at, l.next_follow_up_at,
            l.created_at AS survey_at, l.created_by AS officer_id, a.name AS officer_name,
            d.electoral_area_id, ea.name AS electoral_area_name,
            d.polling_station_id, COALESCE(ps.name, d.polling_station_name) AS polling_station_name,
            d.category_id, dc.name AS category_name,
            d.ghana_card, d.voters_id
     FROM delegates d
     INNER JOIN latest l ON l.delegate_id = d.id
     LEFT JOIN admins a ON a.id = l.created_by
     LEFT JOIN electoral_areas ea ON ea.id = d.electoral_area_id
     LEFT JOIN polling_stations ps ON ps.id = d.polling_station_id
     LEFT JOIN delegate_categories dc ON dc.id = d.category_id
     ${delegateWhere}
     ORDER BY d.full_name ASC`,
    histParams,
  );

  const dataset = rows.map((r) => ({
    id: r.id,
    delegateCode: r.delegate_code,
    fullName: r.full_name,
    phone: r.phone,
    gender: r.gender,
    community: r.community,
    registryStatus: r.status,
    status: r.status_value,
    confidence: r.confidence,
    lastContactedAt: r.last_contacted_at,
    nextFollowUpAt: r.next_follow_up_at,
    electoralAreaId: r.electoral_area_id,
    electoralAreaName: r.electoral_area_name,
    pollingStationId: r.polling_station_id,
    pollingStationName: r.polling_station_name,
    categoryId: r.category_id,
    categoryName: r.category_name,
    ghanaCard: r.ghana_card,
    votersId: r.voters_id,
    officerId: r.officer_id,
    officerName: r.officer_name,
    surveyAt: r.survey_at,
  }));

  let filtered = dataset;
  if (query.currentStatus && query.currentStatus !== 'Unsurveyed') {
    filtered = dataset.filter((d) => d.status === String(query.currentStatus));
  }

  return { mode, dataset: filtered, from, to };
}

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { mode, dataset, from, to } = await loadReportDataset(db, req.query);
    const summary = summarizeRows(dataset.map((d) => ({ status: d.status })));

    const filteredByOfficer = req.query.officerId
      ? dataset.filter((d) => d.officerId === String(req.query.officerId))
      : dataset;

    const payloadDataset = (req.query.officerId ? filteredByOfficer : dataset).map((d) => ({
      id: d.id,
      delegateCode: d.delegateCode,
      fullName: d.fullName,
      phone: d.phone,
      gender: d.gender,
      community: d.community,
      registryStatus: d.registryStatus,
      status: d.status,
      confidence: d.confidence,
      lastContactedAt: d.lastContactedAt,
      nextFollowUpAt: d.nextFollowUpAt,
      electoralAreaId: d.electoralAreaId,
      electoralAreaName: d.electoralAreaName,
      pollingStationId: d.pollingStationId,
      pollingStationName: d.pollingStationName,
      categoryId: d.categoryId,
      categoryName: d.categoryName,
      officerId: d.officerId,
      officerName: d.officerName,
      surveyAt: d.surveyAt,
      // Sensitive IDs omitted from JSON report — available in CSV export only
    }));

    const finalSummary = req.query.officerId
      ? summarizeRows(payloadDataset.map((d) => ({ status: d.status })))
      : summary;

    res.json({
      mode,
      from: from || null,
      to: to || null,
      filters: {
        electoralAreaId: req.query.electoralAreaId || null,
        pollingStationId: req.query.pollingStationId || null,
        categoryId: req.query.categoryId || null,
        status: req.query.status || null,
        gender: req.query.gender || null,
        currentStatus: req.query.currentStatus || null,
        officerId: req.query.officerId || null,
        search: req.query.search || null,
      },
      summary: finalSummary,
      byElectoralArea: groupBy(payloadDataset, (r) => r.electoralAreaId, (r) => r.electoralAreaName),
      byPollingStation: groupBy(payloadDataset, (r) => r.pollingStationId, (r) => r.pollingStationName),
      bySurveyOfficer: groupBy(payloadDataset, (r) => r.officerId, (r) => r.officerName || 'Unknown'),
      byCategory: groupBy(payloadDataset, (r) => r.categoryId, (r) => r.categoryName),
      records: payloadDataset,
    });
  } catch (err) {
    console.error('Delegate reports:', err.message);
    res.status(500).json({ error: 'Failed to build report' });
  }
});

router.get('/export.csv', async (req, res) => {
  try {
    const db = getDb();
    const { mode, dataset, from, to } = await loadReportDataset(db, req.query);
    let rows = dataset;
    if (req.query.officerId) {
      rows = rows.filter((d) => d.officerId === String(req.query.officerId));
    }

    const headers = [
      'delegateCode',
      'fullName',
      'phone',
      'gender',
      'community',
      'electoralAreaName',
      'pollingStationName',
      'categoryName',
      'registryStatus',
      'status',
      'confidence',
      'lastContactedAt',
      'nextFollowUpAt',
      'officerName',
      'surveyAt',
      'ghanaCard',
      'votersId',
    ];

    const csv = toCsv(headers, rows);
    await logActivity(db, {
      actor: req.user,
      action: 'delegate_report_exported',
      entity: 'report',
      metadata: {
        mode,
        from: from || null,
        to: to || null,
        rowCount: rows.length,
        format: 'csv',
      },
    });

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="delegate-report-${mode}-${stamp}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Delegate report export:', err.message);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

module.exports = router;
