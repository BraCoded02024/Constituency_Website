const express = require('express');
const bcrypt = require('bcryptjs');
const { uuidv4 } = require('../lib/uuid');
const { getDb } = require('../data/db');
const { authenticateToken } = require('../middleware/auth');
const { authorizePrivilege } = require('../middleware/authorize');
const {
  ALL_PRIVILEGES,
  PRIVILEGE_LABELS,
  parsePrivileges,
  isSuperAdmin,
  serializeUser,
} = require('../lib/permissions');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizePrivilege('staff'));

router.get('/meta', (req, res) => {
  res.json({ privileges: ALL_PRIVILEGES, labels: PRIVILEGE_LABELS });
});

router.get('/', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query(
    'SELECT id, name, email, role, privileges, is_active, created_at FROM admins ORDER BY created_at ASC',
  );
  res.json(rows.map(serializeUser));
});

router.post('/', async (req, res) => {
  const { name, email, password, role = 'staff', privileges = [] } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const safeRole = role === 'super_admin' && !isSuperAdmin(req.user.role)
    ? 'staff'
    : role === 'super_admin'
      ? 'super_admin'
      : 'staff';

  const safePrivileges =
    safeRole === 'super_admin' ? ALL_PRIVILEGES : parsePrivileges(privileges);

  const db = getDb();
  try {
    const { rows } = await db.query(
      `INSERT INTO admins (id, name, email, password, role, privileges, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       RETURNING id, name, email, role, privileges, is_active, created_at`,
      [
        uuidv4(),
        name.trim(),
        email.trim().toLowerCase(),
        bcrypt.hashSync(password, 10),
        safeRole,
        JSON.stringify(safePrivileges),
        new Date().toISOString().slice(0, 10),
      ],
    );
    res.status(201).json(serializeUser(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const { name, email, password, role, privileges, is_active } = req.body;
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM admins WHERE id = $1', [req.params.id]);
  const existing = rows[0];
  if (!existing) return res.status(404).json({ error: 'Staff member not found' });

  if (existing.role === 'super_admin' && existing.id !== req.user.id && !isSuperAdmin(req.user.role)) {
    return res.status(403).json({ error: 'Cannot modify super admin account' });
  }

  const updates = {};
  if (name) updates.name = name.trim();
  if (email) updates.email = email.trim().toLowerCase();
  if (typeof is_active === 'boolean') updates.is_active = is_active;
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    updates.password = bcrypt.hashSync(password, 10);
  }
  if (role && isSuperAdmin(req.user.role)) {
    updates.role = role === 'super_admin' ? 'super_admin' : 'staff';
  }
  if (privileges !== undefined) {
    const nextRole = updates.role || existing.role;
    updates.privileges = JSON.stringify(
      nextRole === 'super_admin' ? ALL_PRIVILEGES : parsePrivileges(privileges),
    );
  }

  if (Object.keys(updates).length === 0) {
    return res.json(serializeUser(existing));
  }

  const keys = Object.keys(updates);
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map((k) => updates[k]);
  values.push(req.params.id);

  try {
    const result = await db.query(
      `UPDATE admins SET ${setClauses} WHERE id = $${values.length}
       RETURNING id, name, email, role, privileges, is_active, created_at`,
      values,
    );
    res.json(serializeUser(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot remove your own account' });
  }

  const db = getDb();
  const { rows } = await db.query('SELECT * FROM admins WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Staff member not found' });
  if (rows[0].role === 'super_admin') {
    return res.status(403).json({ error: 'Super admin accounts cannot be deleted' });
  }

  await db.query('UPDATE admins SET is_active = false WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
