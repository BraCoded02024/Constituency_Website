const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../data/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const db = getDb();
  const { category } = req.query;
  let result;
  if (category) {
    result = await db.query('SELECT * FROM gallery WHERE LOWER(category) = LOWER($1) ORDER BY date DESC', [category]);
  } else {
    result = await db.query('SELECT * FROM gallery ORDER BY date DESC');
  }
  res.json(result.rows);
});

router.get('/stories', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM success_stories');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM gallery WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { title, image, category, date } = req.body;
  const { rows } = await db.query(
    'INSERT INTO gallery (id,title,image,category,date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [id, title, image, category, date || new Date().toISOString().split('T')[0]]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT * FROM gallery WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  const old = existing[0];
  const { title, image, category, date } = req.body;
  const { rows } = await db.query(
    'UPDATE gallery SET title=$1,image=$2,category=$3,date=$4 WHERE id=$5 RETURNING *',
    [title ?? old.title, image ?? old.image, category ?? old.category, date ?? old.date, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
