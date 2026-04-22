const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../data/database');
const { authenticateToken } = require('../middleware/auth');
const { project: projectOut } = require('../data/serialize');

router.get('/', async (req, res) => {
  const db = getDb();
  const { status, category } = req.query;
  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params = [];
  let i = 1;
  if (status) { sql += ` AND LOWER(status) = LOWER($${i++})`; params.push(status); }
  if (category) { sql += ` AND LOWER(category) = LOWER($${i++})`; params.push(category); }
  const { rows } = await db.query(sql, params);
  res.json(rows.map(projectOut));
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(projectOut(rows[0]));
});

router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { title, description, status, progress, budget, start_date, end_date, contractor, category, startDate, endDate, image } = req.body;
  const { rows } = await db.query(
    `INSERT INTO projects (id,title,description,status,progress,budget,start_date,end_date,contractor,category,image)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [id, title, description, status || 'Planning', progress || 0, budget,
     start_date || startDate, end_date || endDate, contractor, category, image || null]
  );
  res.status(201).json(projectOut(rows[0]));
});

router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows: existing } = await db.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  const old = existing[0];
  const { title, description, status, progress, budget, start_date, end_date, contractor, category, startDate, endDate, image } = req.body;
  const { rows } = await db.query(
    `UPDATE projects SET title=$1,description=$2,status=$3,progress=$4,budget=$5,
     start_date=$6,end_date=$7,contractor=$8,category=$9,image=$10 WHERE id=$11 RETURNING *`,
    [title ?? old.title, description ?? old.description, status ?? old.status, progress ?? old.progress,
     budget ?? old.budget, start_date || startDate || old.start_date, end_date || endDate || old.end_date,
     contractor ?? old.contractor, category ?? old.category,
     image !== undefined ? image : old.image, req.params.id]
  );
  res.json(projectOut(rows[0]));
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
