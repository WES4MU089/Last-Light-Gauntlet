// routes/adminTokenLogin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
// We'll use the pool from req.app.get('dbpool') rather than "sql.query"

router.get('/', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send('Missing token parameter.');
  }

  try {
    // Verify the JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const slUuid = payload.slUuid;

    // Retrieve the already-connected pool from server.js
    const pool = req.app.get('dbpool');
    if (!pool) {
      console.error('No dbpool found on req.app!');
      return res.status(500).send('No DB pool available');
    }

    // Create a request from the pool
    const request = pool.request();

    // Do the DB query to re-check the user
    const userRes = await request.query(`
      SELECT UserID, IsAdmin, SL_Username
      FROM Users
      WHERE SL_UUID='${slUuid}'
    `);

    if (!userRes.recordset.length) {
      return res.status(404).send('No user found for that SL UUID.');
    }
    const user = userRes.recordset[0];
    if (!user.IsAdmin) {
      return res.status(403).send('Not an admin user.');
    }

    // If admin => store info in session
    req.session.userId = user.UserID;
    req.session.isAdmin = true;
    req.session.adminUsername = user.SL_Username;

    // redirect to /admin
    return res.redirect('/admin');
  } catch (err) {
    console.error('adminTokenLogin error:', err);
    return res.status(401).send('Invalid or expired token.');
  }
});

module.exports = router;
