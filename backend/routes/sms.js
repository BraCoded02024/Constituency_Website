'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken, requireActiveAdmin } = require('../middleware/auth');
const { authorizePrivilege } = require('../middleware/authorize');
const { uuidv4 } = require('../lib/uuid');
const { logActivity } = require('../lib/activityLog');
const { isConfigured, toArkeselNumber, sendSms } = require('../lib/arkesel');

router.use(authenticateToken);
router.use(requireActiveAdmin);
router.use(authorizePrivilege('delegates'));

function mapMessage(row) {
  return {
    id: row.id,
    delegateId: row.delegate_id,
    delegateName: row.delegate_name || null,
    phone: row.phone,
    message: row.message,
    status: row.status,
    error: row.error,
    createdAt: row.created_at,
  };
}

const MAX_RECIPIENTS = 2000;
const BATCH_SIZE = 100;
const PERSONALIZED_LIMIT = 100;

const PHONE_OK = `(
  regexp_replace(COALESCE(d.phone, ''), '\\D', '', 'g') ~ '^0[0-9]{9}$'
  OR regexp_replace(COALESCE(d.phone, ''), '\\D', '', 'g') ~ '^233[0-9]{9}$'
  OR regexp_replace(COALESCE(d.phone, ''), '\\D', '', 'g') ~ '^[0-9]{9}$'
)`;

function audienceWhere(query) {
  const params = [];
  const clauses = [];
  const search = query.search ? String(query.search).trim() : '';
  if (search) {
    params.push(`%${search}%`);
    const p = `$${params.length}`;
    clauses.push(`(
      d.delegate_code ILIKE ${p}
      OR d.full_name ILIKE ${p}
      OR d.phone ILIKE ${p}
      OR d.position ILIKE ${p}
      OR ea.name ILIKE ${p}
      OR ps.name ILIKE ${p}
      OR dc.name ILIKE ${p}
    )`);
  }
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
  if (query.gender) {
    params.push(String(query.gender));
    clauses.push(`d.gender = $${params.length}`);
  }
  if (query.level) {
    params.push(String(query.level));
    clauses.push(`d.level = $${params.length}`);
  }
  if (query.currentStatus) {
    if (query.currentStatus === 'Unsurveyed') clauses.push('d.current_status IS NULL');
    else {
      params.push(String(query.currentStatus));
      clauses.push(`d.current_status = $${params.length}`);
    }
  }
  if (query.flagged === 'yes') clauses.push('d.is_flagged = true');
  if (query.flagged === 'no') clauses.push('COALESCE(d.is_flagged, false) = false');
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { params, where };
}

const AUDIENCE_FROM = `
  FROM delegates d
  LEFT JOIN electoral_areas ea ON ea.id = d.electoral_area_id
  LEFT JOIN polling_stations ps ON ps.id = d.polling_station_id
  LEFT JOIN delegate_categories dc ON dc.id = d.category_id
`;

function firstName(fullName) {
  const first = String(fullName || '').trim().split(/\s+/)[0];
  return first || 'there';
}

function mapAudience(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    delegateCode: row.delegate_code,
    phone: row.phone,
    position: row.position,
    level: row.level,
    categoryName: row.category_name,
    electoralAreaName: row.electoral_area_name,
    pollingStationLabel: row.polling_station_label,
    currentStatus: row.current_status,
    reachable: Boolean(toArkeselNumber(row.phone)),
  };
}

router.get('/status', (req, res) => {
  res.json({ configured: isConfigured() });
});

router.get('/audience', async (req, res) => {
  try {
    const db = getDb();
    const { params, where } = audienceWhere(req.query);
    const counts = await db.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE ${PHONE_OK})::int AS with_phone
       ${AUDIENCE_FROM}
       ${where}`,
      params,
    );
    const total = counts.rows[0].total;
    const withPhone = counts.rows[0].with_phone;

    if (String(req.query.idsOnly || '') === '1') {
      const { rows } = await db.query(
        `SELECT d.id
         ${AUDIENCE_FROM}
         ${where ? `${where} AND ${PHONE_OK}` : `WHERE ${PHONE_OK}`}
         ORDER BY d.full_name ASC
         LIMIT ${MAX_RECIPIENTS}`,
        params,
      );
      return res.json({ total, withPhone, ids: rows.map((row) => row.id) });
    }

    const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '25'), 10) || 25, 1), 100);
    const offset = (page - 1) * limit;
    const { rows } = await db.query(
      `SELECT d.id, d.delegate_code, d.full_name, d.phone, d.position, d.level, d.current_status,
              ea.name AS electoral_area_name, ps.name AS polling_station_label, dc.name AS category_name
       ${AUDIENCE_FROM}
       ${where}
       ORDER BY d.full_name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    res.json({
      total,
      withPhone,
      page,
      pageSize: limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      data: rows.map(mapAudience),
    });
  } catch (err) {
    console.error('SMS audience:', err.message);
    res.status(500).json({ error: 'Failed to load recipients' });
  }
});

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const params = [];
    let where = '';
    if (req.query.delegateId) {
      params.push(String(req.query.delegateId));
      where = 'WHERE s.delegate_id = $1';
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    params.push(limit);
    const { rows } = await db.query(
      `SELECT s.*, d.full_name AS delegate_name
       FROM sms_messages s
       LEFT JOIN delegates d ON d.id = s.delegate_id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${params.length}`,
      params,
    );
    res.json(rows.map(mapMessage));
  } catch (err) {
    console.error('List SMS:', err.message);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/send', async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    const delegateIds = Array.isArray(req.body.delegateIds) ? [...new Set(req.body.delegateIds.map(String))] : [];
    if (!message) return res.status(400).json({ error: 'Message is required' });
    if (message.length > 480) return res.status(400).json({ error: 'Message must be 480 characters or fewer' });
    if (delegateIds.length === 0) return res.status(400).json({ error: 'Choose at least one delegate' });
    if (delegateIds.length > MAX_RECIPIENTS) {
      return res.status(400).json({ error: `Send to at most ${MAX_RECIPIENTS} delegates at a time` });
    }
    const personalized = message.includes('{name}');
    if (personalized && delegateIds.length > PERSONALIZED_LIMIT) {
      return res.status(400).json({
        error: `Using {name} is limited to ${PERSONALIZED_LIMIT} people. Remove {name} to send the same text to a larger group.`,
      });
    }
    if (!isConfigured()) {
      return res.status(503).json({ error: 'Add ARKESEL_API_KEY and ARKESEL_SENDER_ID to backend/.env, then restart the API' });
    }

    const db = getDb();
    const { rows } = await db.query(
      `SELECT id, full_name, phone FROM delegates WHERE id = ANY($1::text[])`,
      [delegateIds],
    );
    const byId = new Map(rows.map((row) => [row.id, row]));
    const ready = [];
    const rejected = [];

    for (const id of delegateIds) {
      const delegate = byId.get(id);
      if (!delegate) {
        rejected.push({ delegateId: id, reason: 'Delegate not found' });
        continue;
      }
      const phone = toArkeselNumber(delegate.phone);
      if (!phone) {
        rejected.push({ delegateId: id, name: delegate.full_name, reason: 'No valid Ghana phone number' });
        continue;
      }
      ready.push({ delegate, phone });
    }

    if (ready.length === 0) {
      return res.status(400).json({ error: 'None of the selected delegates have a valid phone number', rejected });
    }

    const now = new Date().toISOString();
    const saved = [];
    const groups = [];
    if (personalized) {
      for (const item of ready) {
        groups.push({
          text: message.replaceAll('{name}', firstName(item.delegate.full_name)),
          items: [item],
        });
      }
    } else {
      for (let i = 0; i < ready.length; i += BATCH_SIZE) {
        groups.push({ text: message, items: ready.slice(i, i + BATCH_SIZE) });
      }
    }

    let failedCount = 0;
    for (const group of groups) {
      const recipients = [];
      const seen = new Set();
      for (const item of group.items) {
        if (!seen.has(item.phone)) {
          seen.add(item.phone);
          recipients.push(item.phone);
        }
      }
      let providerId = null;
      let status = 'sent';
      let errorText = null;
      try {
        const result = await sendSms({ recipients, message: group.text });
        providerId = result.providerId;
      } catch (err) {
        status = 'failed';
        errorText = err.message;
        failedCount += group.items.length;
      }
      for (const item of group.items) {
        const id = uuidv4();
        await db.query(
          `INSERT INTO sms_messages (id, delegate_id, phone, message, status, provider_id, error, sent_by, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [id, item.delegate.id, item.phone, group.text, status, providerId, errorText, req.user?.id || null, now],
        );
        saved.push({
          id,
          delegateId: item.delegate.id,
          delegateName: item.delegate.full_name,
          phone: item.phone,
          message: group.text,
          status,
          error: errorText,
          createdAt: now,
        });
      }
    }

    const sentCount = saved.length - failedCount;
    await logActivity(db, {
      actor: req.user,
      action: failedCount === saved.length ? 'sms_failed' : 'sms_sent',
      entity: 'sms',
      metadata: { recipients: saved.length, sent: sentCount, failed: failedCount },
    });

    if (failedCount === saved.length) {
      return res.status(502).json({ error: saved[0]?.error || 'Arkesel rejected the message', sent: saved, rejected, sentCount, failedCount });
    }
    res.json({ sent: saved, rejected, sentCount, failedCount });
  } catch (err) {
    console.error('Send SMS:', err.message);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

module.exports = router;
