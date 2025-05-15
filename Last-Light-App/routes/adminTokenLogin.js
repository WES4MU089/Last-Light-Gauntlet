// routes/adminTokenLogin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sql = require('mssql');

// GET /admin-token-login?token=XYZ
router.get('/', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send('Missing token parameter.');
  }

  try {
    console.log('[GET /admin-token-login] Using JWT_SECRET:', process.env.JWT_SECRET);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    console.log('[GET /admin-token-login] Token verification succeeded. Payload:', payload);

    const slUuid = payload.slUuid;

    // Re-check DB => fetch SL_Username as well
    const userRes = await sql.query`
      SELECT UserID, IsAdmin, SL_Username
      FROM Users
      WHERE SL_UUID = ${slUuid}
    `;
    if (!userRes.recordset.length) {
      return res.status(404).send('No user found for that SL UUID.');
    }
    const user = userRes.recordset[0];
    if (!user.IsAdmin) {
      return res.status(403).send('Not an admin user.');
    }

    // 6) If admin, store fields in session:
    req.session.userId = user.UserID;
    req.session.isAdmin = true;
    // The key fix => store the admin's SL_Username so we can show "Modified by..."
    req.session.adminUsername = user.SL_Username;

    // 7) Redirect to /admin
    return res.redirect('/admin');
  } catch (err) {
    console.error('[GET /admin-token-login] Token verify error:', err);
    return res.status(401).send('Invalid or expired token.');
  }
});

module.exports = router;
