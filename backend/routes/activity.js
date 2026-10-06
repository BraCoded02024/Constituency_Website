'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken, requireActiveAdmin } = require('../middleware/auth');
const { authorizePrivilege } = require('../middleware/authorize');
const { activityLog } = require('../data/serialize');

router.use(authenticateToken);
router.use(requireActiveAdmin);
router.use(authorizePrivilege('delegates'));

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const params = [];
    const clauses = [];

    if (req.query.entity) {
      params.push(req.query.entity);
      clauses.push(`entity = $${params.length}`);
    }
    if (req.query.entityId) {
      params.push(req.query.entityId);
      clauses.push(`entity_id = $${params.length}`);
    }
    if (req.query.action) {
      params.push(req.query.action);
      clauses.push(`action = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT * FROM activity_logs
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    res.json(rows.map(activityLog));
  } catch (err) {
    console.error('List activity:', err.message);
    res.status(500).json({ error: 'Failed to load activity logs' });
  }
});

module.exports = router;
