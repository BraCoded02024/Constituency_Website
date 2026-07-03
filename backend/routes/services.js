const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../data/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM services');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { title, description, icon, category } = req.body;
  const { rows } = await db.query(
    'INSERT INTO services (id,title,description,icon,category) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [id, title, description, icon, category]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  const old = existing[0];
  const { title, description, icon, category } = req.body;
  const { rows } = await db.query(
    'UPDATE services SET title=$1,description=$2,icon=$3,category=$4 WHERE id=$5 RETURNING *',
    [title ?? old.title, description ?? old.description, icon ?? old.icon, category ?? old.category, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM services WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
