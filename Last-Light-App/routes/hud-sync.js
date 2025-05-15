/**************************************************************************
 * routes/hud-slot-sync.js
 *
 * GET /api/hud-slot-sync/:uuid?slot=1|2
 * – Only returns APPROVED character for that slot
 * – Responds 400 if slot param missing/invalid
 * – Responds 404 if no such approved character
 * – Otherwise sends: "attr1|attr2|...|attr17|skill1|skill2|...|skill58"
 **************************************************************************/

"use strict";
const express = require("express");
const router  = express.Router();
const sql     = require("mssql");

router.get("/hud-slot-sync/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const slot     = parseInt(req.query.slot, 10);

  if (slot !== 1 && slot !== 2)
    return res.status(400).send("Missing or invalid slot param");

  try {
    const pool = await sql.connect();

    /* 1) Pull the user (must exist) */
    const userQ = await pool.request()
                            .input("uuid", sql.VarChar, uuid)
                            .query(`SELECT UserID FROM Users WHERE SL_UUID=@uuid`);
    if (!userQ.recordset.length)
      return res.status(404).send("USER_NOT_FOUND");

    const userID = userQ.recordset[0].UserID;

    /* 2) Pull the one approved character in that slot */
    const charQ = await pool.request()
                            .input("uid",  sql.Int, userID)
                            .input("slot", sql.Int, slot)
                            .query(`
        SELECT CharacterID
        FROM   Characters
        WHERE  UserID    = @uid
          AND  AssignedSlot = @slot
          AND  appStatus = 'Approved'
    `);
    if (!charQ.recordset.length)
      return res.status(404).send("CHAR_NOT_FOUND");

    const cid = charQ.recordset[0].CharacterID;

    /* 3) Attribute values (IDs 1-17) */
    const attrsQ = await pool.request()
                             .input("cid", sql.Int, cid)
                             .query(`
      SELECT ca.CoreAttributeID, ca.Value
      FROM   CharacterAttributes ca
      ORDER  BY ca.CoreAttributeID
      WHERE  ca.CharacterID = @cid
    `);

    /* 4) Skill values (IDs 1-58) */
    const skillsQ = await pool.request()
                              .input("cid", sql.Int, cid)
                              .query(`
      SELECT cs.SkillID, cs.Value
      FROM   CharacterSkills cs
      ORDER  BY cs.SkillID
      WHERE  cs.CharacterID = @cid
    `);

    /* 5) Build pipe string */
    const values = [];
    attrsQ.recordset.forEach(r  => values.push(r.Value));
    skillsQ.recordset.forEach(r => values.push(r.Value));
    return res.send(values.join("|"));

  } catch (err) {
    console.error("[HUD-SLOT-SYNC]", err);
    return res.status(500).send("SERVER_ERROR");
  }
});

module.exports = router;
