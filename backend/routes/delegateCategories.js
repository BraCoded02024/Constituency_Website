'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken, requireActiveAdmin } = require('../middleware/auth');
const { authorizePrivilege } = require('../middleware/authorize');
const { uuidv4 } = require('../lib/uuid');
const { logActivity } = require('../lib/activityLog');
const { delegateCategory } = require('../data/serialize');

router.use(authenticateToken);
router.use(requireActiveAdmin);
router.use(authorizePrivilege('delegates'));

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const activeOnly = req.query.active === 'true';
    const { rows } = await db.query(
      `SELECT dc.*,
              (SELECT COUNT(*)::int FROM delegates d WHERE d.category_id = dc.id) AS delegate_count
       FROM delegate_categories dc
       ${activeOnly ? 'WHERE dc.is_active = true' : ''}
       ORDER BY dc.name ASC`,
    );
    res.json(rows.map(delegateCategory));
  } catch (err) {
    console.error('List delegate categories:', err.message);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { rows } = await db.query(
      `SELECT dc.*,
              (SELECT COUNT(*)::int FROM delegates d WHERE d.category_id = dc.id) AS delegate_count
       FROM delegate_categories dc WHERE dc.id = $1`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Category not found' });
    res.json(delegateCategory(rows[0]));
  } catch (err) {
    console.error('Get category:', err.message);
    res.status(500).json({ error: 'Failed to load category' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, isActive = true } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO delegate_categories (id, name, description, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$5)`,
      [id, String(name).trim(), description || null, isActive !== false, now],
    );
    await logActivity(db, {
      actor: req.user,
      action: 'category_created',
      entity: 'delegate_category',
      entityId: id,
      metadata: { name: String(name).trim() },
    });
    const { rows } = await db.query('SELECT *, 0::int AS delegate_count FROM delegate_categories WHERE id = $1', [id]);
    res.status(201).json(delegateCategory(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Category name already exists' });
    console.error('Create category:', err.message);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const db = getDb();
    const { rows: existing } = await db.query('SELECT * FROM delegate_categories WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Category not found' });
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const next = {
      name: name !== undefined ? String(name).trim() : existing[0].name,
      description: description !== undefined ? description || null : existing[0].description,
      is_active: isActive !== undefined ? isActive !== false : existing[0].is_active,
    };

    await db.query(
      `UPDATE delegate_categories SET name=$1, description=$2, is_active=$3, updated_at=$4 WHERE id=$5`,
      [next.name, next.description, next.is_active, new Date().toISOString(), req.params.id],
    );
    await logActivity(db, {
      actor: req.user,
      action: 'category_updated',
      entity: 'delegate_category',
      entityId: req.params.id,
      metadata: { name: next.name, isActive: next.is_active },
    });
    const { rows } = await db.query(
      `SELECT dc.*,
              (SELECT COUNT(*)::int FROM delegates d WHERE d.category_id = dc.id) AS delegate_count
       FROM delegate_categories dc WHERE dc.id = $1`,
      [req.params.id],
    );
    res.json(delegateCategory(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Category name already exists' });
    console.error('Update category:', err.message);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

module.exports = router;
