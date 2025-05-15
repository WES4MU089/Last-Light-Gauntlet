/**
 * middleware/auth.js
 * Simple authentication helpers used by give-letter and other routes
 */

const jwt = require('jsonwebtoken');

/* --------------------------------------------------------------
 * requireAuth
 *  – Works with either:
 *      • existing Express-session  (req.session.userId)
 *      • Bearer token  (Authorization: Bearer <jwt>)
 *      • ?token=<jwt>  query param (useful for media surfaces)
 * -------------------------------------------------------------- */
function requireAuth (req, res, next) {
  /* 1) session already set? */
  if (req.session?.userId) return next();

  /* 2) JWT in header or query */
  const raw =
        req.headers.authorization?.split(' ')[1] ||
        req.query.token;

  if (!raw) return res.status(401).json({ error: 'Auth required.' });

  try {
    const payload = jwt.verify(raw, process.env.JWT_SECRET);
    req.session.userId = payload.userId;
    next();
  } catch (e) {
    console.error('[auth] bad JWT:', e);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth };
