const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'constituency_admin_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.id) {
      return res.status(403).json({ error: 'Invalid token payload.' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

/** Optional DB check that the admin is still active (use after authenticateToken). */
async function requireActiveAdmin(req, res, next) {
  try {
    const { getDb } = require('../data/db');
    const { rows } = await getDb().query(
      'SELECT id, is_active FROM admins WHERE id = $1',
      [req.user.id],
    );
    if (!rows[0]) {
      return res.status(403).json({ error: 'Account not found.' });
    }
    if (rows[0].is_active === false) {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }
    next();
  } catch (err) {
    console.error('Active admin check failed:', err.message);
    res.status(503).json({ error: 'Unable to verify account status' });
  }
}

module.exports = { authenticateToken, requireActiveAdmin, JWT_SECRET };
