const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../data/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const db = getDb();
  const { category } = req.query;
  let result;
  if (category) {
    result = await db.query('SELECT * FROM announcements WHERE LOWER(category) = LOWER($1) ORDER BY date DESC', [category]);
  } else {
    result = await db.query('SELECT * FROM announcements ORDER BY date DESC');
  }
  res.json(result.rows);
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { title, content, category, date, image, urgent } = req.body;
  const { rows } = await db.query(
    'INSERT INTO announcements (id,title,content,category,date,image,urgent) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [id, title, content, category, date || new Date().toISOString().split('T')[0], image, !!urgent]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  const old = existing[0];
  const { title, content, category, date, image, urgent } = req.body;
  const { rows } = await db.query(
    'UPDATE announcements SET title=$1, content=$2, category=$3, date=$4, image=$5, urgent=$6 WHERE id=$7 RETURNING *',
    [title ?? old.title, content ?? old.content, category ?? old.category, date ?? old.date,
     image ?? old.image, urgent !== undefined ? !!urgent : old.urgent, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
