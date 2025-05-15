// routes/slAuthRoute.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const jwt = require('jsonwebtoken');

// Use an environment variable or config for your secret
const JWT_SECRET = process.env.JWT_SECRET || 'some-very-secret-key';

// Utility: create short-lifetime token (e.g., 5 minutes)
function createShortToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '5m' });
}

// POST /sl-auth
// The SL object sends: { SL_UUID: '...', SL_Name: '...', ... }
router.post('/', async (req, res) => {
  const { SL_UUID, SL_Name } = req.body;
  if (!SL_UUID) {
    return res.status(400).json({ error: 'Missing SL_UUID' });
  }

  try {
    // 1) Check if user with that SL_UUID exists
    const userCheck = await sql.query`
      SELECT UserID, SL_UUID 
      FROM Users
      WHERE SL_UUID = ${SL_UUID}
    `;

    let userID;

    if (userCheck.recordset.length === 0) {
      // 2) Create new user row
      //    We ignore email or password since it's not used.
      //    You may keep or remove the columns from your DB if you like.
      const insertResult = await sql.query`
        INSERT INTO Users (SL_UUID, SL_Username, Created_At)
        OUTPUT INSERTED.UserID
        VALUES (${SL_UUID}, ${SL_Name || 'SL User'}, GETDATE())
      `;
      userID = insertResult.recordset[0].UserID;
    } else {
      userID = userCheck.recordset[0].UserID;
      // Optionally update the SL_Username if needed
      if (SL_Name) {
        await sql.query`
          UPDATE Users
          SET SL_Username = ${SL_Name}
          WHERE UserID = ${userID}
        `;
      }
    }

    // 3) Create short token
    const token = createShortToken({ userId: userID, SL_UUID });

    // 4) Respond with token
    return res.json({ token });
  } catch (err) {
    console.error('SL Auth Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
