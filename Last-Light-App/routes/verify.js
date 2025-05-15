// routes/verify.js

const express = require('express');
const router = express.Router();
const sql = require('mssql');

// GET /verify?token=xyz
router.get('/', async (req, res) => {
  const token = req.query.token;
  console.log('\n[GET /verify] token:', token);

  if (!token) {
    return res.status(400).send('Missing verification token.');
  }

  try {
    // 1. Look up the user by the EmailVerifyToken
    const { recordset } = await sql.query`
      SELECT UserID, EmailVerified
      FROM Users
      WHERE EmailVerifyToken = ${token}
    `;

    if (recordset.length === 0) {
      console.log('[GET /verify] No user found for token:', token);
      return res.status(400).send('Invalid or expired verification token.');
    }

    // 2. If we find a user, mark EmailVerified as 1 (true)
    const user = recordset[0];
    if (user.EmailVerified === 1) {
      // Optionally handle the case if they are already verified
      return res.status(200).send('This email has already been verified.');
    }

    await sql.query`
      UPDATE Users
      SET EmailVerified = 1,
          EmailVerifyToken = NULL -- optionally clear the token
      WHERE UserID = ${user.UserID}
    `;

    // 3. Provide a response or render a template
    // For example, a simple success message:
    return res.send('Email successfully verified. You may now log in.');
  } catch (err) {
    console.error('[GET /verify] Error:', err);
    return res.status(500).send('Server error.');
  }
});

module.exports = router;
