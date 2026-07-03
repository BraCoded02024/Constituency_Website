const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const permissions = require('../lib/permissions');
const serializeUser = permissions.serializeUser || permissions.default?.serializeUser;

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const { rows } = await db.query('SELECT * FROM admins WHERE email = $1', [email.trim().toLowerCase()]);
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: 'Invalid email or password' });

    if (admin.is_active === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact a super admin.' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const user = serializeUser(admin);
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, privileges: user.privileges },
      JWT_SECRET,
      { expiresIn: '24h' },
    );

    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed — database or server error' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { rows } = await db.query(
      'SELECT id, name, email, role, privileges, is_active, created_at FROM admins WHERE id = $1',
      [req.user.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    if (rows[0].is_active === false) return res.status(403).json({ error: 'Account deactivated' });
    res.json(serializeUser(rows[0]));
  } catch (err) {
    console.error('Auth me error:', err.message);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { rows } = await db.query('SELECT * FROM admins WHERE id = $1', [req.user.id]);
    const admin = rows[0];
    if (!admin) return res.status(404).json({ error: 'User not found' });

    const { name, email, currentPassword, newPassword } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.trim().toLowerCase();

    if (currentPassword && newPassword) {
      const valid = await bcrypt.compare(currentPassword, admin.password);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length > 0) {
      const keys = Object.keys(updates);
      const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = keys.map((k) => updates[k]);
      values.push(req.user.id);
      await db.query(`UPDATE admins SET ${setClauses} WHERE id = $${values.length}`, values);
    }

    const result = await db.query(
      'SELECT id, name, email, role, privileges, is_active, created_at FROM admins WHERE id = $1',
      [req.user.id],
    );
    res.json(serializeUser(result.rows[0]));
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
