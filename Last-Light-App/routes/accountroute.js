/**************************************************************************
 * routes/accountroute.js
 *
 * Handles:
 *   GET    /account                     – user dashboard
 *   GET    /account/view/:id            – legacy redirect to /view-character
 *   GET    /account/character/:id       – JSON bundle for detail page
 *   DELETE /account/character/:id       – delete character
 **************************************************************************/

const express = require('express');
const router  = express.Router();
const sql     = require('mssql');

/* --------------------------------------------------------- */
/* 1) GET /account – dashboard                               */
/* --------------------------------------------------------- */
router.get('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  try {
    /* ---- basic user row ---------------------------------- */
    const userRow = await sql.query`
      SELECT UserID, SL_Username, Created_At
      FROM   Users
      WHERE  UserID = ${req.session.userId}
    `;
    if (!userRow.recordset.length)
      return res.status(404).send('User not found.');

    /* ---- characters incl. region & house names ----------- */
    const charsRes = await sql.query`
      SELECT  C.CharacterID,
              C.Name,
              C.Age,
              C.Sex,
              C.ImagePath,
              C.AppStatus,
              C.Created_At,
              C.AssignedSlot,
              H.HouseName,
              R.RegionName
      FROM    Characters   AS C
      LEFT JOIN Houses     AS H ON C.HouseID  = H.HouseID
      LEFT JOIN Regions    AS R ON C.RegionID = R.RegionID
      WHERE   C.UserID = ${req.session.userId}
      ORDER BY C.Created_At
    `;

    res.render('account', {
      user       : userRow.recordset[0],
      characters : charsRes.recordset
    });
  } catch (err) {
    console.error('[GET /account] Error:', err);
    res.status(500).send('Server error loading account.');
  }
});

/* --------------------------------------------------------- */
/* 2) GET /account/view/:id – legacy; forwards to new route  */
/* --------------------------------------------------------- */
router.get('/view/:charId', (req, res) => {
  res.redirect(302, `/view-character/${req.params.charId}`);
});

/* --------------------------------------------------------- */
/* 3) GET /account/character/:id – JSON bundle               */
/* --------------------------------------------------------- */
router.get('/character/:charId', async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: 'Not logged in' });

  const charId = parseInt(req.params.charId, 10);
  if (isNaN(charId))
    return res.status(400).json({ error: 'Invalid id' });

  try {
    /* character with joins */
    const charRes = await sql.query`
      SELECT  C.CharacterID,
              C.Name,
              C.Age,
              C.Sex,
              C.ImagePath,
              C.History,
              C.Created_At,
              C.Favor,
              H.HouseName,
              R.RegionName
      FROM    Characters AS C
      LEFT JOIN Houses   AS H ON C.HouseID  = H.HouseID
      LEFT JOIN Regions  AS R ON C.RegionID = R.RegionID
      WHERE   C.CharacterID = ${charId}
        AND   C.UserID      = ${req.session.userId}
    `;
    if (!charRes.recordset.length)
      return res.status(404).json({ error: 'Not found' });

    /* attributes & skills */
    const [attrRes, skillRes] = await Promise.all([
      sql.query`
        SELECT CA.CoreAttributeID, CA.Name AS AttributeName, CAttr.Value
        FROM   CharacterAttributes CAttr
        JOIN   CoreAttributes     CA ON CAttr.CoreAttributeID = CA.CoreAttributeID
        WHERE  CAttr.CharacterID = ${charId}
      `,
      sql.query`
        SELECT  S.SkillID,
                S.Name            AS SkillName,
                S.CoreAttributeID,
                CS.Value
        FROM    CharacterSkills CS
        JOIN    Skills          S ON CS.SkillID = S.SkillID
        WHERE   CS.CharacterID  = ${charId}
      `
    ]);

    res.json({
      character  : charRes.recordset[0],
      attributes : attrRes.recordset,
      skills     : skillRes.recordset
    });
  } catch (err) {
    console.error('[GET /account/character/:id] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* --------------------------------------------------------- */
/* 4) DELETE /account/character/:id                          */
/* --------------------------------------------------------- */
router.delete('/character/:charId', async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: 'Not logged in' });

  const charId = parseInt(req.params.charId, 10);
  if (isNaN(charId))
    return res.status(400).json({ error: 'Invalid id' });

  try {
    const del = await sql.query`
      DELETE FROM Characters
      WHERE CharacterID = ${charId}
        AND UserID      = ${req.session.userId}
    `;
    if (del.rowsAffected[0] === 0)
      return res.status(404).json({ error: 'Character not found or not yours' });

    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /account/character/:id] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
