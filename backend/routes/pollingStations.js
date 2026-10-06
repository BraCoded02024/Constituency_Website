'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken, requireActiveAdmin } = require('../middleware/auth');
const { authorizePrivilege } = require('../middleware/authorize');
const { uuidv4 } = require('../lib/uuid');
const { logActivity } = require('../lib/activityLog');
const { pollingStation } = require('../data/serialize');

router.use(authenticateToken);
router.use(requireActiveAdmin);
router.use(authorizePrivilege('delegates'));

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const params = [];
    const clauses = [];
    if (req.query.electoralAreaId) {
      params.push(req.query.electoralAreaId);
      clauses.push(`ps.electoral_area_id = $${params.length}`);
    }
    if (req.query.active === 'true') {
      clauses.push('ps.is_active = true');
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT ps.*, ea.name AS electoral_area_name,
              (SELECT COUNT(*)::int FROM delegates d WHERE d.polling_station_id = ps.id) AS delegate_count
       FROM polling_stations ps
       LEFT JOIN electoral_areas ea ON ea.id = ps.electoral_area_id
       ${where}
       ORDER BY ea.name ASC NULLS LAST, ps.name ASC`,
      params,
    );
    res.json(rows.map(pollingStation));
  } catch (err) {
    console.error('List polling stations:', err.message);
    res.status(500).json({ error: 'Failed to load polling stations' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { rows } = await db.query(
      `SELECT ps.*, ea.name AS electoral_area_name,
              (SELECT COUNT(*)::int FROM delegates d WHERE d.polling_station_id = ps.id) AS delegate_count
       FROM polling_stations ps
       LEFT JOIN electoral_areas ea ON ea.id = ps.electoral_area_id
       WHERE ps.id = $1`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Polling station not found' });
    res.json(pollingStation(rows[0]));
  } catch (err) {
    console.error('Get polling station:', err.message);
    res.status(500).json({ error: 'Failed to load polling station' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, code, description, electoralAreaId, isActive = true } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
    if (!electoralAreaId) return res.status(400).json({ error: 'Electoral area is required' });

    const db = getDb();
    const area = await db.query('SELECT id FROM electoral_areas WHERE id = $1', [electoralAreaId]);
    if (!area.rows[0]) return res.status(400).json({ error: 'Invalid electoral area' });

    const id = uuidv4();
    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO polling_stations (id, electoral_area_id, name, code, description, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
      [id, electoralAreaId, String(name).trim(), code || null, description || null, isActive !== false, now],
    );
    await logActivity(db, {
      actor: req.user,
      action: 'polling_station_created',
      entity: 'polling_station',
      entityId: id,
      metadata: { name: String(name).trim(), electoralAreaId },
    });
    const { rows } = await db.query(
      `SELECT ps.*, ea.name AS electoral_area_name, 0::int AS delegate_count
       FROM polling_stations ps
       LEFT JOIN electoral_areas ea ON ea.id = ps.electoral_area_id
       WHERE ps.id = $1`,
      [id],
    );
    res.status(201).json(pollingStation(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Polling station name or code already exists' });
    console.error('Create polling station:', err.message);
    res.status(500).json({ error: 'Failed to create polling station' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, code, description, electoralAreaId, isActive } = req.body;
    const db = getDb();
    const { rows: existing } = await db.query('SELECT * FROM polling_stations WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Polling station not found' });

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const nextAreaId = electoralAreaId !== undefined ? electoralAreaId : existing[0].electoral_area_id;
    if (!nextAreaId) return res.status(400).json({ error: 'Electoral area is required' });
    const area = await db.query('SELECT id FROM electoral_areas WHERE id = $1', [nextAreaId]);
    if (!area.rows[0]) return res.status(400).json({ error: 'Invalid electoral area' });

    const next = {
      name: name !== undefined ? String(name).trim() : existing[0].name,
      code: code !== undefined ? code || null : existing[0].code,
      description: description !== undefined ? description || null : existing[0].description,
      electoral_area_id: nextAreaId,
      is_active: isActive !== undefined ? isActive !== false : existing[0].is_active,
    };

    await db.query(
      `UPDATE polling_stations
       SET electoral_area_id=$1, name=$2, code=$3, description=$4, is_active=$5, updated_at=$6
       WHERE id=$7`,
      [next.electoral_area_id, next.name, next.code, next.description, next.is_active, new Date().toISOString(), req.params.id],
    );
    await logActivity(db, {
      actor: req.user,
      action: 'polling_station_updated',
      entity: 'polling_station',
      entityId: req.params.id,
      metadata: { name: next.name, electoralAreaId: next.electoral_area_id, isActive: next.is_active },
    });
    const { rows } = await db.query(
      `SELECT ps.*, ea.name AS electoral_area_name,
              (SELECT COUNT(*)::int FROM delegates d WHERE d.polling_station_id = ps.id) AS delegate_count
       FROM polling_stations ps
       LEFT JOIN electoral_areas ea ON ea.id = ps.electoral_area_id
       WHERE ps.id = $1`,
      [req.params.id],
    );
    res.json(pollingStation(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Polling station name or code already exists' });
    console.error('Update polling station:', err.message);
    res.status(500).json({ error: 'Failed to update polling station' });
  }
});

module.exports = router;
