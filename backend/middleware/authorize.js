const { hasPrivilege } = require('../lib/permissions');

function authorizePrivilege(...privileges) {
  return (req, res, next) => {
    const allowed = privileges.some((p) => hasPrivilege(req.user, p));
    if (!allowed) {
      return res.status(403).json({ error: 'You do not have permission to access this resource' });
    }
    next();
  };
}

module.exports = { authorizePrivilege };
