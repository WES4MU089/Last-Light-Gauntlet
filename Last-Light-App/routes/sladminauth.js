// routes/slAdminAuth.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const jwt = require('jsonwebtoken');

// POST /sl-admin-auth
// Expects JSON: { "SL_UUID": "<avatarKey>", "SL_Name": "<avatarName>" }
// If user is admin, returns a token with only SL_UUID in the payload
router.post('/', async (req, res) => {
  console.log('[POST /sl-admin-auth] Incoming body:', req.body);

  try {
    const { SL_UUID, SL_Name } = req.body;
    if (!SL_UUID || !SL_Name) {
      console.log('[POST /sl-admin-auth] Missing SL_UUID or SL_Name');
      return res.status(400).json({ error: 'Missing SL_UUID or SL_Name' });
    }

    // 1) Check if user with this SL_UUID is admin
    console.log(`[POST /sl-admin-auth] Checking DB for SL_UUID=${SL_UUID}`);
    const result = await sql.query`
      SELECT UserID, IsAdmin
      FROM Users
      WHERE SL_UUID = ${SL_UUID}
    `;
    console.log('[POST /sl-admin-auth] DB Query Result:', result.recordset);

    if (!result.recordset.length) {
      console.log('[POST /sl-admin-auth] User not found in DB');
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.recordset[0];
    if (!user.IsAdmin) {
      console.log(`[POST /sl-admin-auth] UserID=${user.UserID} found, but not admin.`);
      return res.status(403).json({ error: 'Not an admin user.' });
    }

    // 2) User is indeed admin => create a token with ONLY SL_UUID
    console.log(`[POST /sl-admin-auth] UserID=${user.UserID} is admin. Generating small token...`);

    const token = jwt.sign(
      { slUuid: SL_UUID }, // only store the SL UUID
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('[POST /sl-admin-auth] Token generated. Returning JSON:', token);
    return res.json({ token });
  } catch (err) {
    console.error('[POST /sl-admin-auth] Error:', err);
    return res.status(500).json({ error: 'Server error generating token.' });
  }
});

module.exports = router;
