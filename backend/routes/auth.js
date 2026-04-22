const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../data/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const db = getDb();
  const { rows } = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
  const admin = rows[0];
  if (!admin) return res.status(401).json({ error: 'Invalid email or password' });

  const validPassword = await bcrypt.compare(password, admin.password);
  if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
});

router.get('/me', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT id, name, email, role, created_at FROM admins WHERE id = $1', [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

router.put('/profile', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM admins WHERE id = $1', [req.user.id]);
  const admin = rows[0];
  if (!admin) return res.status(404).json({ error: 'User not found' });

  const { name, email, currentPassword, newPassword } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;

  if (currentPassword && newPassword) {
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    updates.password = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updates).length > 0) {
    const keys = Object.keys(updates);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(req.user.id);
    await db.query(`UPDATE admins SET ${setClauses} WHERE id = $${values.length}`, values);
  }

  const result = await db.query('SELECT id, name, email, role, created_at FROM admins WHERE id = $1', [req.user.id]);
  res.json(result.rows[0]);
});

module.exports = router;
