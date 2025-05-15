// routes/slAdminAuth.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sql = require('mssql');

// POST /sl-admin-auth
// Expects JSON: { "SL_UUID": "<avatarKey>", "SL_Name": "<avatarName>" }
router.post('/', async (req, res) => {
  try {
    const { SL_UUID, SL_Name } = req.body;
    if (!SL_UUID || !SL_Name) {
      return res.status(400).json({ error: 'Missing SL_UUID or SL_Name' });
    }

    // Retrieve the already-connected pool from server.js
    const pool = req.app.get('dbpool');
    const request = pool.request();

    // Query the DB: find the user row by SL_UUID
    // (Adjust table/column names if needed)
    const result = await request.query(`
      SELECT UserID, IsAdmin
      FROM Users
      WHERE SL_UUID='${SL_UUID}'
    `);

    if (!result.recordset.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.recordset[0];
    if (!user.IsAdmin) {
      return res.status(403).json({ error: 'Not an admin user.' });
    }

    // Create a JWT token containing only the user's SL_UUID
    const token = jwt.sign(
      { slUuid: SL_UUID },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return the token JSON
    return res.json({ token });

  } catch (err) {
    console.error('sladminauth error:', err);
    return res.status(500).json({ error: 'Server error generating token.' });
  }
});

module.exports = router;
