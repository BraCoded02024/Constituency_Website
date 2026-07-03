const express = require('express');
const router = express.Router();
const { uuidv4 } = require('../lib/uuid');
const { getDb } = require('../data/db');
const { authenticateToken } = require('../middleware/auth');

function parseRow(row) {
  if (!row) return row;
  return { ...row, requirements: JSON.parse(row.requirements || '[]') };
}

router.get('/', async (req, res) => {
  const db = getDb();
  const { type } = req.query;
  let result;
  if (type) {
    result = await db.query('SELECT * FROM opportunities WHERE LOWER(type) = LOWER($1)', [type]);
  } else {
    result = await db.query('SELECT * FROM opportunities');
  }
  res.json(result.rows.map(parseRow));
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(parseRow(rows[0]));
});

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { title, description, type, deadline, requirements, slots } = req.body;
  const { rows } = await db.query(
    'INSERT INTO opportunities (id,title,description,type,deadline,requirements,slots,applied) VALUES ($1,$2,$3,$4,$5,$6,$7,0) RETURNING *',
    [id, title, description, type, deadline, JSON.stringify(requirements || []), slots || 0]
  );
  res.status(201).json(parseRow(rows[0]));
});

router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  const old = existing[0];
  const { title, description, type, deadline, requirements, slots, applied } = req.body;
  const { rows } = await db.query(
    'UPDATE opportunities SET title=$1,description=$2,type=$3,deadline=$4,requirements=$5,slots=$6,applied=$7 WHERE id=$8 RETURNING *',
    [title ?? old.title, description ?? old.description, type ?? old.type, deadline ?? old.deadline,
     requirements ? JSON.stringify(requirements) : old.requirements, slots ?? old.slots,
     applied ?? old.applied, req.params.id]
  );
  res.json(parseRow(rows[0]));
});

router.post('/:id/apply', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  if (rows[0].applied >= rows[0].slots) return res.status(400).json({ error: 'No slots available' });

  const result = await db.query('UPDATE opportunities SET applied = applied + 1 WHERE id = $1 RETURNING *', [req.params.id]);
  res.json(parseRow(result.rows[0]));
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
