/*************************************************************************
 * routes/adminroute.js
 *
 * Handles:
 *   - GET /admin => Admin portal (3 columns: Pending, Approved, Denied)
 *       * pending => oldest → newest
 *       * approved => newest → oldest
 *       * denied => newest → oldest
 *   - GET /admin/character/:charId => JSON for "View" modal
 *   - POST /admin/character/:charId/approve => sets appStatus='Approved',
 *       also sets ModifiedBy to the admin's username
 *   - POST /admin/character/:charId/deny => sets appStatus='Denied',
 *       also sets ModifiedBy to the admin's username
 *************************************************************************/

const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Middleware => confirm user is admin
function adminCheck(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).send(`
      <h2>Unauthorized</h2>
      <p>No direct web login. Please use your in-world LSL script to obtain a token.</p>
    `);
  }
  if (!req.session.isAdmin) {
    return res.status(403).send('Access denied: not an admin.');
  }
  next();
}

/************************************************************
 * 1) GET /admin => Renders adminportal.ejs
 ************************************************************/
router.get('/', adminCheck, async (req, res) => {
  try {
    // Query: fetch all chars + user data. Ascending so pending is basically correct initially
    const result = await sql.query`
      SELECT
        c.CharacterID,
        c.Name,
        c.Description,
        c.Age,
        c.House,
        c.Favor,
        c.Created_At,
        c.Sex,
        c.ImagePath,
        c.appStatus,
        c.ModifiedBy,
        u.SL_Username
      FROM Characters c
      JOIN Users u ON c.UserID = u.UserID
      ORDER BY c.Created_At ASC
    `;

    // Distribute => pending/approved/denied
    const pendingChars = [];
    const approvedChars = [];
    const deniedChars = [];

    for (const row of result.recordset) {
      const lowerStatus = (row.appStatus || '').toLowerCase();
      if (lowerStatus === 'approved') {
        approvedChars.push(row);
      } else if (lowerStatus === 'denied') {
        deniedChars.push(row);
      } else {
        // default => pending
        pendingChars.push(row);
      }
    }

    // Sort each subset
    // (pending => ascending => oldest → newest)
    pendingChars.sort((a, b) => new Date(a.Created_At) - new Date(b.Created_At));

    // (approved => descending => newest → oldest)
    approvedChars.sort((a, b) => new Date(b.Created_At) - new Date(a.Created_At));

    // (denied => descending => newest → oldest)
    deniedChars.sort((a, b) => new Date(b.Created_At) - new Date(a.Created_At));

    // Render EJS, passing sorted arrays
    res.render('adminportal', {
      pendingChars,
      approvedChars,
      deniedChars
    });
  } catch (err) {
    console.error('[GET /admin] Error:', err);
    return res.status(500).send('Server error loading admin portal.');
  }
});

/************************************************************
 * 2) GET /admin/character/:charId => JSON data for "View" modal
 ************************************************************/
router.get('/character/:charId', adminCheck, async (req, res) => {
  const charId = parseInt(req.params.charId, 10);
  if (isNaN(charId)) {
    return res.status(400).json({ error: 'Invalid charId' });
  }

  try {
    // 1) Character row
    const charResult = await sql.query`
      SELECT
        CharacterID,
        Name,
        Age,
        House,
        Description,
        Created_At,
        Favor,
        Sex,
        ImagePath,
        History,
        appStatus,
        ModifiedBy
      FROM Characters
      WHERE CharacterID = ${charId}
    `;
    if (!charResult.recordset.length) {
      return res.status(404).json({ error: 'Character not found' });
    }
    const character = charResult.recordset[0];

    // 2) Attributes
    const attrResult = await sql.query`
      SELECT
        CA.CoreAttributeID,
        CA.Name AS AttributeName,
        CA_Char.Value
      FROM CharacterAttributes CA_Char
      JOIN CoreAttributes CA ON CA_Char.CoreAttributeID = CA.CoreAttributeID
      WHERE CA_Char.CharacterID = ${charId}
      ORDER BY CA.Name
    `;

    // 3) Skills
    const skillResult = await sql.query`
      SELECT
        S.SkillID,
        S.Name AS SkillName,
        S.CoreAttributeID,
        CharSkill.Value
      FROM CharacterSkills CharSkill
      JOIN Skills S ON CharSkill.SkillID = S.SkillID
      WHERE CharSkill.CharacterID = ${charId}
      ORDER BY S.Name
    `;

    return res.json({
      character,
      attributes: attrResult.recordset,
      skills: skillResult.recordset
    });
  } catch (err) {
    console.error('[GET /admin/character/:charId] Error:', err);
    return res.status(500).json({ error: 'Server error fetching character.' });
  }
});

/************************************************************
 * 3) POST /admin/character/:charId/approve => set appStatus='Approved'
 ************************************************************/
router.post('/character/:charId/approve', adminCheck, async (req, res) => {
  const charId = parseInt(req.params.charId, 10);
  if (isNaN(charId)) {
    return res.status(400).json({ error: 'Invalid charId' });
  }

  try {
    // if we store admin's name in session
    const adminName = req.session.adminUsername || 'UnknownAdmin';

    const updateResult = await sql.query`
      UPDATE Characters
      SET appStatus = 'Approved',
          ModifiedBy = ${adminName}
      WHERE CharacterID = ${charId}
    `;
    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[POST /admin/character/:charId/approve] Error:', err);
    return res.status(500).json({ error: 'Server error approving character.' });
  }
});

/************************************************************
 * 4) POST /admin/character/:charId/deny => set appStatus='Denied'
 ************************************************************/
router.post('/character/:charId/deny', adminCheck, async (req, res) => {
  const charId = parseInt(req.params.charId, 10);
  if (isNaN(charId)) {
    return res.status(400).json({ error: 'Invalid charId' });
  }

  try {
    const adminName = req.session.adminUsername || 'UnknownAdmin';

    const updateResult = await sql.query`
      UPDATE Characters
      SET appStatus = 'Denied',
          ModifiedBy = ${adminName}
      WHERE CharacterID = ${charId}
    `;
    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[POST /admin/character/:charId/deny] Error:', err);
    return res.status(500).json({ error: 'Server error denying character.' });
  }
});

module.exports = router;
