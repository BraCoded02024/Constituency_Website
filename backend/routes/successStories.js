const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../data/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM success_stories');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM success_stories WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { name, story, image, year } = req.body;
  const { rows } = await db.query(
    'INSERT INTO success_stories (id,name,story,image,year) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [id, name, story, image, year || new Date().getFullYear().toString()]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT * FROM success_stories WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  const old = existing[0];
  const { name, story, image, year } = req.body;
  const { rows } = await db.query(
    'UPDATE success_stories SET name=$1,story=$2,image=$3,year=$4 WHERE id=$5 RETURNING *',
    [name ?? old.name, story ?? old.story, image ?? old.image, year ?? old.year, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM success_stories WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
