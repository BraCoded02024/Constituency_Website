const express = require('express');
const router = express.Router();
const { uuidv4 } = require('../lib/uuid');
const { getDb } = require('../data/db');
const { authenticateToken } = require('../middleware/auth');
const { concern } = require('../data/serialize');

async function withResponses(row) {
  if (!row) return row;
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM concern_responses WHERE concern_id = $1 ORDER BY responded_at ASC', [row.id]);
  return concern(row, rows);
}

router.get('/', async (req, res) => {
  const db = getDb();
  const { status, category } = req.query;
  let sql = 'SELECT * FROM concerns WHERE 1=1';
  const params = [];
  let i = 1;
  if (status) { sql += ` AND LOWER(status) LIKE $${i++}`; params.push(`%${status.toLowerCase()}%`); }
  if (category) { sql += ` AND LOWER(category) = LOWER($${i++})`; params.push(category); }
  sql += ' ORDER BY submitted_at DESC';
  const { rows } = await db.query(sql, params);
  const results = await Promise.all(rows.map(withResponses));
  res.json(results);
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM concerns WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(await withResponses(rows[0]));
});

router.post('/', async (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { name, phone, community, category, subject, description, priority } = req.body;
  const { rows } = await db.query(
    'INSERT INTO concerns (id,name,phone,community,category,subject,description,status,submitted_at,priority) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
    [id, name, phone, community, category, subject, description, 'Pending', new Date().toISOString().split('T')[0], priority || 'Medium']
  );
  res.status(201).json(concern(rows[0], []));
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT * FROM concerns WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  const { status, priority } = req.body;
  if (status) await db.query('UPDATE concerns SET status = $1 WHERE id = $2', [status, req.params.id]);
  if (priority) await db.query('UPDATE concerns SET priority = $1 WHERE id = $2', [priority, req.params.id]);

  const { rows } = await db.query('SELECT * FROM concerns WHERE id = $1', [req.params.id]);
  res.json(await withResponses(rows[0]));
});

router.post('/:id/respond', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT * FROM concerns WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  await db.query(
    'INSERT INTO concern_responses (id,concern_id,message,responded_by,responded_at) VALUES ($1,$2,$3,$4,$5)',
    [uuidv4(), req.params.id, req.body.message, req.user.name, new Date().toISOString()]
  );

  if (req.body.status) {
    await db.query('UPDATE concerns SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
  }

  const { rows } = await db.query('SELECT * FROM concerns WHERE id = $1', [req.params.id]);
  res.json(await withResponses(rows[0]));
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM concerns WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
