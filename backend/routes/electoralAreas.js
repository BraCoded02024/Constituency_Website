'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken, requireActiveAdmin } = require('../middleware/auth');
const { authorizePrivilege } = require('../middleware/authorize');
const { uuidv4 } = require('../lib/uuid');
const { logActivity } = require('../lib/activityLog');
const { electoralArea } = require('../data/serialize');
const { classifyElectoralArea } = require('../lib/surveyConstants');

const AREA_STATS_SQL = `
  SELECT ea.*,
         (SELECT COUNT(*)::int FROM polling_stations ps
           WHERE ps.electoral_area_id = ea.id AND ps.is_active IS DISTINCT FROM false) AS station_count,
         (SELECT COUNT(*)::int FROM delegates d WHERE d.electoral_area_id = ea.id) AS delegate_count,
         (SELECT COUNT(*)::int FROM delegates d WHERE d.electoral_area_id = ea.id AND d.level = 'Electoral Area') AS area_delegate_count,
         (SELECT COUNT(*)::int FROM delegates d WHERE d.electoral_area_id = ea.id AND d.level = 'Polling Station') AS station_delegate_count,
         (SELECT COUNT(*)::int FROM delegates d WHERE d.electoral_area_id = ea.id AND d.current_status IS NOT NULL) AS surveyed,
         (SELECT COUNT(*)::int FROM delegates d WHERE d.electoral_area_id = ea.id AND d.current_status = 'Supporting') AS supporting,
         (SELECT COUNT(*)::int FROM delegates d WHERE d.electoral_area_id = ea.id AND d.current_status = 'Not Supporting') AS not_supporting,
         (SELECT COUNT(*)::int FROM delegates d WHERE d.electoral_area_id = ea.id AND d.current_status = 'Floating') AS floating
  FROM electoral_areas ea
`;

router.use(authenticateToken);
router.use(requireActiveAdmin);
router.use(authorizePrivilege('delegates'));

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const activeOnly = req.query.active === 'true';
    const { rows } = await db.query(
      `${AREA_STATS_SQL}
       ${activeOnly ? 'WHERE ea.is_active = true' : ''}
       ORDER BY ea.name ASC`,
    );
    res.json(rows.map((row) => electoralArea(withClassification(row))));
  } catch (err) {
    console.error('List electoral areas:', err.message);
    res.status(500).json({ error: 'Failed to load electoral areas' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { rows } = await db.query(
      `${AREA_STATS_SQL} WHERE ea.id = $1`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Electoral area not found' });
    res.json(electoralArea(withClassification(rows[0])));
  } catch (err) {
    console.error('Get electoral area:', err.message);
    res.status(500).json({ error: 'Failed to load electoral area' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, code, description, isActive = true } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO electoral_areas (id, name, code, description, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$6)`,
      [id, String(name).trim(), code || null, description || null, isActive !== false, now],
    );
    await logActivity(db, {
      actor: req.user,
      action: 'electoral_area_created',
      entity: 'electoral_area',
      entityId: id,
      metadata: { name: String(name).trim() },
    });
    const { rows } = await db.query('SELECT * FROM electoral_areas WHERE id = $1', [id]);
    res.status(201).json(electoralArea({ ...rows[0], station_count: 0, delegate_count: 0 }));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Electoral area name already exists' });
    console.error('Create electoral area:', err.message);
    res.status(500).json({ error: 'Failed to create electoral area' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    const db = getDb();
    const { rows: existing } = await db.query('SELECT * FROM electoral_areas WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Electoral area not found' });

    const next = {
      name: name !== undefined ? String(name).trim() : existing[0].name,
      code: code !== undefined ? code || null : existing[0].code,
      description: description !== undefined ? description || null : existing[0].description,
      is_active: isActive !== undefined ? isActive !== false : existing[0].is_active,
    };

    await db.query(
      `UPDATE electoral_areas
       SET name=$1, code=$2, description=$3, is_active=$4, updated_at=$5
       WHERE id=$6`,
      [next.name, next.code, next.description, next.is_active, new Date().toISOString(), req.params.id],
    );
    await logActivity(db, {
      actor: req.user,
      action: 'electoral_area_updated',
      entity: 'electoral_area',
      entityId: req.params.id,
      metadata: { name: next.name, isActive: next.is_active },
    });
    const { rows } = await db.query(
      `${AREA_STATS_SQL} WHERE ea.id = $1`,
      [req.params.id],
    );
    res.json(electoralArea(withClassification(rows[0])));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Electoral area name already exists' });
    console.error('Update electoral area:', err.message);
    res.status(500).json({ error: 'Failed to update electoral area' });
  }
});

function withClassification(row) {
  return {
    ...row,
    classifications: classifyElectoralArea({
      surveyed: Number(row.surveyed) || 0,
      supporting: Number(row.supporting) || 0,
      notSupporting: Number(row.not_supporting) || 0,
      floating: Number(row.floating) || 0,
    }),
  };
}

module.exports = router;
