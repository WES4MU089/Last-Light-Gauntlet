const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sql = require('mssql');
const crypto = require('crypto');
const { transporter, aliasStore, createAlias } = require('../services/services');

// GET /register
router.get('/register', async (req, res) => {
  const token = req.query.token;
  console.log('\n[GET /register] token:', token);

  if (!token) {
    return res.status(400).send('Missing token.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const alias = decoded.a;
    console.log('[GET /register] Decoded alias:', alias);

    const storedData = aliasStore[alias];
    if (!storedData) {
      console.log('[GET /register] Alias not found. Invalid or expired.');
      return res.status(401).send('Invalid or expired token.');
    }

    const { sl_uuid, sl_username } = storedData;
    console.log('[GET /register] Found data:', { sl_uuid, sl_username });

    return res.render('register', { sl_uuid, sl_username, token, errors: [] });
  } catch (err) {
    console.error('[GET /register] Token verification failed:', err);
    return res.status(401).send('Invalid or expired token.');
  }
});

// POST /generate-token
router.post(
  '/generate-token',
  [
    body('sl_uuid').notEmpty().withMessage('SL UUID is required.'),
    body('sl_username').notEmpty().withMessage('SL Username is required.'),
  ],
  async (req, res) => {
    console.log('\n[POST /generate-token] Body:', req.body);

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[POST /generate-token] Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { sl_uuid, sl_username } = req.body;
      console.log(`[POST /generate-token] sl_uuid=${sl_uuid}, sl_username=${sl_username}`);

      // Generate alias
      const alias = createAlias();
      aliasStore[alias] = { sl_uuid, sl_username };
      console.log(`[POST /generate-token] alias=${alias}, aliasStore:`, aliasStore[alias]);

      // Sign minimal JWT { a: alias }
      const token = jwt.sign({ a: alias }, process.env.JWT_SECRET, { expiresIn: '15m' });
      console.log('[POST /generate-token] Generated token:', token);

      return res.json({ token });
    } catch (err) {
      console.error('Error in /generate-token route:', err);
      return res.status(500).send('Server error.');
    }
  }
);

// POST /register
router.post(
  '/register',
  [
    body('sl_uuid').notEmpty(),
    body('sl_username').notEmpty(),
    body('email').isEmail().withMessage('Invalid email address.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.'),
    body('confirm_password')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match.');
        }
        return true;
      }),
  ],
  async (req, res) => {
    console.log('\n[POST /register] Body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[POST /register] Validation errors:', errors.array());
      return res.status(400).render('register', {
        sl_uuid: req.body.sl_uuid,
        sl_username: req.body.sl_username,
        token: req.body.token,
        errors: errors.array(),
      });
    }

    const { sl_uuid, sl_username, email, password, token } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const alias = decoded.a;

      const storedData = aliasStore[alias];
      if (!storedData || storedData.sl_uuid !== sl_uuid || storedData.sl_username !== sl_username) {
        console.log('[POST /register] Alias mismatch or not found.');
        return res.status(401).send('Invalid or expired token.');
      }

      const userCheck = await sql.query`
        SELECT * FROM Users 
        WHERE SL_UUID = ${sl_uuid} OR Email_Address = ${email}
      `;
      if (userCheck.recordset.length > 0) {
        console.log('[POST /register] User exists.');
        return res.status(400).render('register', {
          sl_uuid,
          sl_username,
          token,
          errors: [{ msg: 'User already exists with this SL UUID or Email.' }],
        });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const emailVerifyToken = crypto.randomBytes(16).toString('hex');

      const insertResult = await sql.query`
        INSERT INTO Users (
          SL_UUID, SL_Username, Email_Address, Password_Hash, 
          EmailVerified, EmailVerifyToken, Created_At
        )
        OUTPUT inserted.UserID
        VALUES (
          ${sl_uuid}, ${sl_username}, ${email}, ${passwordHash}, 
          0, ${emailVerifyToken}, GETDATE()
        )
      `;

      const newUserID = insertResult.recordset[0].UserID;

      const verifyLink = `${process.env.BASE_URL || 'https://vagrant.ngrok.io'}/verify?token=${emailVerifyToken}`;
      transporter.sendMail({
        from: '"Blackfyre" <no-reply@blackfyre.com>',
        to: email,
        subject: 'Blackfyre Email Verification',
        html: `
          <h2>Welcome to Blackfyre!</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${verifyLink}">${verifyLink}</a>
        `,
      });

      // Optionally, remove the alias after successful registration
      delete aliasStore[alias];

      return res.send('Registration successful. Please check your email to verify your address.');
    } catch (err) {
      console.error('[POST /register] Error:', err);
      return res.status(500).send('Server error.');
    }
  }
);

module.exports = router;
