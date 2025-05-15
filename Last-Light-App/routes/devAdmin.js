/**************************************************************************
 * routes/devAdmin.js  (development ONLY)
 **************************************************************************/

'use strict';
const express = require('express');
const router  = express.Router();
const sql     = require('mssql');

/* GET /dev-admin
 * ?uuid=<optional admin SL_UUID>
 * Impersonates that admin (or the first admin it finds) and redirects to /admin.
 */
router.get('/', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.sendStatus(404);

  try {
    const uuid = req.query.uuid || null;

    /* Build the query without nesting template tags */
    const adminQuery = uuid
      ? sql.query`
          SELECT TOP 1 UserID, SL_Username
          FROM   Users
          WHERE  IsAdmin = 1 AND SL_UUID = ${uuid}
          ORDER  BY UserID`
      : sql.query`
          SELECT TOP 1 UserID, SL_Username
          FROM   Users
          WHERE  IsAdmin = 1
          ORDER  BY UserID`;

    const { recordset } = await adminQuery;

    if (!recordset.length) {
      return res.status(404).send('No admin users exist.');
    }
    const admin = recordset[0];

    /* Regenerate session and act as that admin */
    req.session.regenerate(err => {
      if (err) {
        console.error('[dev-admin] session.regenerate', err);
        return res.status(500).send('Session error');
      }
      req.session.userId        = admin.UserID;
      req.session.isAdmin       = true;
      req.session.adminUsername = admin.SL_Username;
      res.redirect('/admin');
    });
  } catch (err) {
    console.error('[dev-admin] DB error:', err);
    res.status(500).send('Database error');
  }
});

module.exports = router;
