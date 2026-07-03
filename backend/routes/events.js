const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../data/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM events ORDER BY date ASC');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { title, description, date, time, location, type, image } = req.body;
  const { rows } = await db.query(
    'INSERT INTO events (id,title,description,date,time,location,type,image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [id, title, description, date, time, location, type, image]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  const old = existing[0];
  const { title, description, date, time, location, type, image } = req.body;
  const { rows } = await db.query(
    'UPDATE events SET title=$1,description=$2,date=$3,time=$4,location=$5,type=$6,image=$7 WHERE id=$8 RETURNING *',
    [title ?? old.title, description ?? old.description, date ?? old.date, time ?? old.time,
     location ?? old.location, type ?? old.type, image ?? old.image, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM events WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
