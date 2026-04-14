const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Kein Zugriffstoken.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token abgelaufen.' : 'Ungltiger Token.';
    return res.status(403).json({ error: msg });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Nicht eingeloggt.' });
    if (!roles.includes(req.user.role)) {
      logger.warn('Unauth access: user=' + req.user.id + ' role=' + req.user.role);
      return res.status(403).json({ error: 'Keine Berechtigung.' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
