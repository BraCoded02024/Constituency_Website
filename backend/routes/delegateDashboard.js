'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken, requireActiveAdmin } = require('../middleware/auth');
const { authorizePrivilege } = require('../middleware/authorize');
const { AREA_CLASS_THRESHOLDS, pct } = require('../lib/surveyConstants');

router.use(authenticateToken);
router.use(requireActiveAdmin);
router.use(authorizePrivilege('delegates'));

/** Documented thresholds for descriptive statistical groupings (of surveyed delegates). */
const THRESHOLDS = AREA_CLASS_THRESHOLDS;

function mapBreakdown(row, extra = {}) {
  const total = Number(row.total) || 0;
  const surveyed = Number(row.surveyed) || 0;
  const supporting = Number(row.supporting) || 0;
  const notSupporting = Number(row.not_supporting) || 0;
  const floating = Number(row.floating) || 0;
  const notSurveyed = Number(row.not_surveyed) || Math.max(total - surveyed, 0);
  const base = surveyed > 0 ? surveyed : 0;
  return {
    ...extra,
    id: row.id,
    name: row.name,
    total,
    surveyed,
    notSurveyed,
    supporting,
    notSupporting,
    floating,
    supportingPct: pct(supporting, base),
    notSupportingPct: pct(notSupporting, base),
    floatingPct: pct(floating, base),
    surveyedPct: pct(surveyed, total),
  };
}

function classifyAreas(areas) {
  const strongAreas = [];
  const needsAttention = [];
  const persuasionAreas = [];

  for (const area of areas) {
    if (area.surveyed === 0) continue;
    if (area.supportingPct >= THRESHOLDS.supportingStrong) strongAreas.push(area);
    if (area.notSupportingPct >= THRESHOLDS.notSupportingAttention) needsAttention.push(area);
    if (area.floatingPct >= THRESHOLDS.floatingPersuasion) persuasionAreas.push(area);
  }

  return { strongAreas, needsAttention, persuasionAreas };
}

function localDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function followUpTiming(value, today) {
  const day = String(value || '').slice(0, 10);
  if (!day) return 'upcoming';
  if (day < today) return 'overdue';
  if (day === today) return 'today';
  return 'upcoming';
}

router.get('/follow-ups', async (req, res) => {
  try {
    const db = getDb();
    const today = localDate(0);
    const horizon = localDate(14);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);

    const { rows: counts } = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE substring(next_follow_up_at, 1, 10) < $1)::int AS overdue,
        COUNT(*) FILTER (WHERE substring(next_follow_up_at, 1, 10) = $1)::int AS due_today,
        COUNT(*) FILTER (
          WHERE substring(next_follow_up_at, 1, 10) > $1
            AND substring(next_follow_up_at, 1, 10) <= $2
        )::int AS upcoming
      FROM delegates
      WHERE next_follow_up_at IS NOT NULL
        AND is_active IS DISTINCT FROM false
    `, [today, horizon]);

    const { rows } = await db.query(`
      SELECT d.id, d.full_name, d.delegate_code, d.phone, d.position, d.next_follow_up_at, d.current_status,
             ea.name AS electoral_area_name
      FROM delegates d
      LEFT JOIN electoral_areas ea ON ea.id = d.electoral_area_id
      WHERE d.next_follow_up_at IS NOT NULL
        AND d.is_active IS DISTINCT FROM false
        AND substring(d.next_follow_up_at, 1, 10) <= $1
      ORDER BY substring(d.next_follow_up_at, 1, 10) ASC, d.full_name ASC
      LIMIT $2
    `, [horizon, limit]);

    const summary = counts[0] || { overdue: 0, due_today: 0, upcoming: 0 };
    res.json({
      overdue: summary.overdue,
      dueToday: summary.due_today,
      upcoming: summary.upcoming,
      dueCount: summary.overdue + summary.due_today,
      items: rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        delegateCode: row.delegate_code,
        phone: row.phone,
        position: row.position,
        electoralAreaName: row.electoral_area_name,
        nextFollowUpAt: String(row.next_follow_up_at).slice(0, 10),
        currentStatus: row.current_status,
        timing: followUpTiming(row.next_follow_up_at, today),
      })),
    });
  } catch (err) {
    console.error('Delegate follow-ups:', err.message);
    res.status(500).json({ error: 'Failed to load follow-ups' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const db = getDb();
    const electoralAreaId = req.query.electoralAreaId ? String(req.query.electoralAreaId) : null;

    const { rows: totals } = await db.query(`
      SELECT
        COUNT(*)::int AS total_delegates,
        COUNT(*) FILTER (WHERE current_status IS NOT NULL)::int AS surveyed,
        COUNT(*) FILTER (WHERE current_status IS NULL)::int AS not_surveyed,
        COUNT(*) FILTER (WHERE current_status = 'Supporting')::int AS supporting,
        COUNT(*) FILTER (WHERE current_status = 'Not Supporting')::int AS not_supporting,
        COUNT(*) FILTER (WHERE current_status = 'Floating')::int AS floating
      FROM delegates
      ${electoralAreaId ? 'WHERE electoral_area_id = $1' : ''}
    `, electoralAreaId ? [electoralAreaId] : []);

    const { rows: byArea } = await db.query(`
      SELECT ea.id, ea.name,
             COUNT(d.id)::int AS total,
             COUNT(d.id) FILTER (WHERE d.current_status IS NOT NULL)::int AS surveyed,
             COUNT(d.id) FILTER (WHERE d.current_status IS NULL)::int AS not_surveyed,
             COUNT(d.id) FILTER (WHERE d.current_status = 'Supporting')::int AS supporting,
             COUNT(d.id) FILTER (WHERE d.current_status = 'Not Supporting')::int AS not_supporting,
             COUNT(d.id) FILTER (WHERE d.current_status = 'Floating')::int AS floating
      FROM electoral_areas ea
      LEFT JOIN delegates d ON d.electoral_area_id = ea.id
      WHERE ea.is_active = true
      GROUP BY ea.id, ea.name
      ORDER BY ea.name
    `);

    const stationParams = [];
    let stationWhere = '';
    if (electoralAreaId) {
      stationParams.push(electoralAreaId);
      stationWhere = `WHERE ps.electoral_area_id = $1`;
    }

    const { rows: byStation } = await db.query(`
      SELECT ps.id, ps.name, ps.electoral_area_id, ea.name AS electoral_area_name,
             COUNT(d.id)::int AS total,
             COUNT(d.id) FILTER (WHERE d.current_status IS NOT NULL)::int AS surveyed,
             COUNT(d.id) FILTER (WHERE d.current_status IS NULL)::int AS not_surveyed,
             COUNT(d.id) FILTER (WHERE d.current_status = 'Supporting')::int AS supporting,
             COUNT(d.id) FILTER (WHERE d.current_status = 'Not Supporting')::int AS not_supporting,
             COUNT(d.id) FILTER (WHERE d.current_status = 'Floating')::int AS floating
      FROM polling_stations ps
      LEFT JOIN electoral_areas ea ON ea.id = ps.electoral_area_id
      LEFT JOIN delegates d ON d.polling_station_id = ps.id
      ${stationWhere}
      GROUP BY ps.id, ps.name, ps.electoral_area_id, ea.name
      ORDER BY ea.name NULLS LAST, ps.name
    `, stationParams);

    const { rows: byCategory } = await db.query(`
      SELECT dc.id, dc.name,
             COUNT(d.id)::int AS total,
             COUNT(d.id) FILTER (WHERE d.current_status IS NOT NULL)::int AS surveyed,
             COUNT(d.id) FILTER (WHERE d.current_status IS NULL)::int AS not_surveyed,
             COUNT(d.id) FILTER (WHERE d.current_status = 'Supporting')::int AS supporting,
             COUNT(d.id) FILTER (WHERE d.current_status = 'Not Supporting')::int AS not_supporting,
             COUNT(d.id) FILTER (WHERE d.current_status = 'Floating')::int AS floating
      FROM delegate_categories dc
      LEFT JOIN delegates d ON d.category_id = dc.id
      WHERE dc.is_active = true
      GROUP BY dc.id, dc.name
      ORDER BY dc.name
    `);

    const genderParams = [];
    let genderWhere = '';
    if (electoralAreaId) {
      genderParams.push(electoralAreaId);
      genderWhere = 'WHERE electoral_area_id = $1';
    }
    const { rows: byGender } = await db.query(`
      SELECT COALESCE(NULLIF(TRIM(gender), ''), 'Unspecified') AS name,
             COUNT(*)::int AS total
      FROM delegates
      ${genderWhere}
      GROUP BY 1
      ORDER BY total DESC, name
    `, genderParams);

    const today = new Date().toISOString().slice(0, 10);
    const activityParams = [today];
    let activityWhere = '';
    if (electoralAreaId) {
      activityParams.push(electoralAreaId);
      activityWhere = 'WHERE electoral_area_id = $2';
    }
    const { rows: activity } = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_active IS DISTINCT FROM false)::int AS active,
        COUNT(*) FILTER (WHERE is_active = false)::int AS inactive,
        COUNT(*) FILTER (
          WHERE next_follow_up_at IS NOT NULL
            AND substring(next_follow_up_at, 1, 10) <= $1
        )::int AS follow_ups_due
      FROM delegates
      ${activityWhere}
    `, activityParams);

    const followParams = [];
    let followWhere = 'WHERE d.next_follow_up_at IS NOT NULL';
    if (electoralAreaId) {
      followParams.push(electoralAreaId);
      followWhere += ' AND d.electoral_area_id = $1';
    }
    const { rows: upcomingFollowUps } = await db.query(`
      SELECT d.id, d.full_name, d.delegate_code, d.next_follow_up_at, d.current_status,
             ea.name AS electoral_area_name
      FROM delegates d
      LEFT JOIN electoral_areas ea ON ea.id = d.electoral_area_id
      ${followWhere}
      ORDER BY d.next_follow_up_at ASC
      LIMIT 8
    `, followParams);

    const { rows: byOfficer } = await db.query(`
      SELECT a.id, a.name,
             COUNT(sr.id)::int AS surveys_recorded,
             COUNT(DISTINCT sr.delegate_id)::int AS delegates_surveyed,
             MAX(sr.created_at) AS last_survey_at
      FROM survey_records sr
      LEFT JOIN admins a ON a.id = sr.created_by
      GROUP BY a.id, a.name
      ORDER BY surveys_recorded DESC, a.name ASC NULLS LAST
    `);

    const { rows: recentSurveys } = await db.query(`
      SELECT sr.id, sr.status, sr.confidence, sr.created_at, sr.last_contacted_at,
             d.id AS delegate_id, d.full_name AS delegate_name, d.delegate_code,
             a.name AS officer_name,
             ea.name AS electoral_area_name
      FROM survey_records sr
      JOIN delegates d ON d.id = sr.delegate_id
      LEFT JOIN admins a ON a.id = sr.created_by
      LEFT JOIN electoral_areas ea ON ea.id = d.electoral_area_id
      ORDER BY sr.created_at DESC
      LIMIT 15
    `);

    const areas = byArea.map((r) => mapBreakdown(r));
    const stations = byStation.map((r) =>
      mapBreakdown(r, {
        electoralAreaId: r.electoral_area_id,
        electoralAreaName: r.electoral_area_name,
      }),
    );
    const categories = byCategory.map((r) => mapBreakdown(r));
    const classifications = classifyAreas(areas);

    const t = totals[0];
    const surveyedBase = t.surveyed > 0 ? t.surveyed : 0;

    res.json({
      thresholds: THRESHOLDS,
      totalDelegates: t.total_delegates,
      surveyed: t.surveyed,
      notSurveyed: t.not_surveyed,
      supporting: t.supporting,
      notSupporting: t.not_supporting,
      floating: t.floating,
      supportingPct: pct(t.supporting, surveyedBase),
      notSupportingPct: pct(t.not_supporting, surveyedBase),
      floatingPct: pct(t.floating, surveyedBase),
      surveyedPct: pct(t.surveyed, t.total_delegates),
      activeDelegates: activity[0]?.active ?? 0,
      inactiveDelegates: activity[0]?.inactive ?? 0,
      followUpsDue: activity[0]?.follow_ups_due ?? 0,
      byGender: byGender.map((r) => ({ name: r.name, total: r.total })),
      upcomingFollowUps: upcomingFollowUps.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        delegateCode: r.delegate_code,
        nextFollowUpAt: r.next_follow_up_at,
        currentStatus: r.current_status,
        electoralAreaName: r.electoral_area_name,
      })),
      byElectoralArea: areas,
      byPollingStation: stations,
      byCategory: categories,
      bySurveyOfficer: byOfficer.map((r) => ({
        id: r.id,
        name: r.name || 'Unknown officer',
        surveysRecorded: r.surveys_recorded,
        delegatesSurveyed: r.delegates_surveyed,
        lastSurveyAt: r.last_survey_at,
      })),
      classifications: {
        strongAreas: classifications.strongAreas,
        needsAttention: classifications.needsAttention,
        persuasionAreas: classifications.persuasionAreas,
      },
      recentSurveys: recentSurveys.map((r) => ({
        id: r.id,
        status: r.status,
        confidence: r.confidence,
        createdAt: r.created_at,
        lastContactedAt: r.last_contacted_at,
        delegateId: r.delegate_id,
        delegateName: r.delegate_name,
        delegateCode: r.delegate_code,
        officerName: r.officer_name,
        electoralAreaName: r.electoral_area_name,
      })),
    });
  } catch (err) {
    console.error('Delegate dashboard stats:', err.message);
    res.status(500).json({ error: 'Failed to load delegate stats' });
  }
});

module.exports = router;
