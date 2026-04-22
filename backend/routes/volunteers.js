const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../data/database');
const { authenticateToken } = require('../middleware/auth');
const { volunteer } = require('../data/serialize');

router.get('/', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM volunteers');
  res.json(rows.map(volunteer));
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM volunteers WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(volunteer(rows[0]));
});

router.post('/', async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT id FROM volunteers WHERE phone = $1', [req.body.phone]);
  if (existing[0]) return res.status(400).json({ error: 'Already registered as volunteer' });

  const id = uuidv4();
  const { fullName, full_name, phone, email, community, skills, availability } = req.body;
  const name = fullName || full_name;
  const { rows } = await db.query(
    'INSERT INTO volunteers (id,full_name,phone,email,community,skills,availability,registered_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [id, name, phone, email, community, skills, availability, new Date().toISOString().split('T')[0]]
  );
  res.status(201).json(volunteer(rows[0]));
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM volunteers WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
