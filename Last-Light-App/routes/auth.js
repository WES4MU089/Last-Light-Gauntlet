const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const sql = require('mssql');
const bcrypt = require('bcrypt');

// GET /login
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/account');
  res.render('login', { errors: [] });
});

// POST /login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).render('login', { errors: errors.array() });

    const { email, password } = req.body;

    try {
      const userCheck = await sql.query`
        SELECT UserID, Password_Hash, EmailVerified
        FROM Users
        WHERE Email_Address = ${email}
      `;
      if (
        userCheck.recordset.length === 0 ||
        !userCheck.recordset[0].EmailVerified
      ) {
        return res.status(400).render('login', {
          errors: [{ msg: 'Invalid credentials or unverified email.' }],
        });
      }

      const user = userCheck.recordset[0];
      if (!(await bcrypt.compare(password, user.Password_Hash))) {
        return res
          .status(400)
          .render('login', { errors: [{ msg: 'Invalid credentials.' }] });
      }

      req.session.userId = user.UserID;
      res.redirect('/account');
    } catch (err) {
      console.error('[POST /login] Error:', err);
      res.status(500).send('Server error.');
    }
  }
);

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send('Error logging out.');
    res.clearCookie('connect.sid').redirect('/login');
  });
});

module.exports = router;
