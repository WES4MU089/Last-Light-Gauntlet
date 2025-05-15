// routes/adminDevBypass.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).send('Not allowed in non-dev environment.');
  }
  req.session.isAdmin = true;
  req.session.userId = 999;
  req.session.adminUsername = 'DevTester';
  console.log('Dev bypass: Admin session set.');
  res.redirect('/admin');
});

module.exports = router;
