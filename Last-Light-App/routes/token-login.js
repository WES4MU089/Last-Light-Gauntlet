// routes/tokenLoginRoute.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'some-very-secret-key';

// GET /token-login?token=XYZ
router.get('/', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('Missing token');
  }

  try {
    // 1) Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    // decoded might be: { userId: 123, SL_UUID: "...", iat:..., exp:... }

    // 2) Create session
    req.session.userId = decoded.userId; 
    // optionally store SL_UUID if you need it:
    req.session.SL_UUID = decoded.SL_UUID;

    // 3) Redirect to /account
    return res.redirect('/account');
  } catch (err) {
    console.error('Token Login Error:', err);
    return res.status(401).send('Invalid or expired token');
  }
});

module.exports = router;
