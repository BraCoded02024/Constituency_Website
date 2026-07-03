const express = require('express');
const router = express.Router();
const { uuidv4 } = require('../lib/uuid');
const { getDb } = require('../data/db');
const { authenticateToken } = require('../middleware/auth');
const { constituent } = require('../data/serialize');

router.get('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM constituents');
  res.json(rows.map(constituent));
});

router.get('/stats', async (req, res) => {
  const db = getDb();
  const total = (await db.query('SELECT COUNT(*) as count FROM constituents')).rows[0].count;
  const communities = (await db.query('SELECT COUNT(DISTINCT community) as count FROM constituents')).rows[0].count;
  const male = (await db.query("SELECT COUNT(*) as count FROM constituents WHERE gender = 'Male'")).rows[0].count;
  const female = (await db.query("SELECT COUNT(*) as count FROM constituents WHERE gender = 'Female'")).rows[0].count;
  res.json({ total: parseInt(total), communities: parseInt(communities), genderBreakdown: { male: parseInt(male), female: parseInt(female) } });
});

router.get('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM constituents WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(constituent(rows[0]));
});

router.post('/', async (req, res) => {
  const db = getDb();
  const { fullName, full_name, phone, email, community, age, gender, occupation } = req.body;
  const name = fullName || full_name;
  if (!name || !phone || !community || !gender) {
    return res.status(400).json({ error: 'Full name, phone, community, and gender are required' });
  }

  const { rows: existing } = await db.query('SELECT id FROM constituents WHERE phone = $1', [phone]);
  if (existing[0]) return res.status(400).json({ error: 'Phone number already registered' });

  const id = uuidv4();
  const { rows } = await db.query(
    'INSERT INTO constituents (id,full_name,phone,email,community,age,gender,occupation,registered_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
    [id, name, phone, email || '', community, age || null, gender, occupation || '', new Date().toISOString().split('T')[0]]
  );
  res.status(201).json(constituent(rows[0]));
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM constituents WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
