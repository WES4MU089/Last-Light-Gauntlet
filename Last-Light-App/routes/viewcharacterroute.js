/**************************************************************************
 * routes/viewcharacterroute.js  – mounted at /view-character
 *
 * GET /view-character/:id     → read-only character sheet
 **************************************************************************/

const express = require('express');
const router  = express.Router();
const sql     = require('mssql');

/* ─── helper : fetch everything the template needs ─────────────────── */
async function fetchCharacterBundle (cid, uid) {
  /* main row – now joined to Regions & Houses for display names */
  const char = (await sql.query`
      SELECT  c.*,
              r.RegionName,
              h.HouseName
      FROM    Characters c
      LEFT JOIN Regions r ON r.RegionID = c.RegionID
      LEFT JOIN Houses  h ON h.HouseID  = c.HouseID
      WHERE   c.CharacterID = ${cid}
        AND   c.UserID      = ${uid}`
  ).recordset[0];

  if (!char) return null;

  /* maps for value look-ups */
  const attrVals = {};
  (await sql.query`
      SELECT CoreAttributeID, Value
      FROM   CharacterAttributes
      WHERE  CharacterID = ${cid}`
  ).recordset.forEach(r => { attrVals[r.CoreAttributeID] = r.Value; });

  const skillVals = {};
  (await sql.query`
      SELECT SkillID, Value
      FROM   CharacterSkills
      WHERE  CharacterID = ${cid}`
  ).recordset.forEach(r => { skillVals[r.SkillID] = r.Value; });

  /* lists that power the grids */
  const attributes = (await sql.query`
      SELECT CoreAttributeID AS [key], Name AS [label]
      FROM   CoreAttributes
      ORDER BY CoreAttributeID`
  ).recordset;

  const skills = (await sql.query`
      SELECT SkillID AS [id],
             Name    AS [label],
             CoreAttributeID AS [attrId]
      FROM   Skills
      ORDER BY CoreAttributeID, Name`
  ).recordset;

  return { char, attrVals, skillVals, attributes, skills };
}

/* ─── GET /view-character/:id ──────────────────────────────────────── */
router.get('/:id', async (req, res, next) => {
  try {
    const cid = +req.params.id;
    if (isNaN(cid)) return res.status(400).send('Bad id.');

    /* ownership check + bundle */
    const bundle = await fetchCharacterBundle(cid, req.session.userId);
    if (!bundle) return res.status(404).send('Character not found.');

    res.render('view-character', bundle);
  } catch (err) {
    console.error('[GET /view-character] error:', err);
    next(err);
  }
});

module.exports = router;
