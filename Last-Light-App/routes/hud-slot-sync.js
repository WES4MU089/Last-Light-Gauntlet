/**************************************************************************
 * routes/hud-slot-sync.js      DROP-IN
 *
 * GET /api/hud-slot-sync/:uuid?slot=1|2
 *
 * Success payload:
 *   Name|HouseName|RegionName|Age||attr1|…|attr17|skill1|…|skill58
 *
 * Only APPROVED characters are returned.
 **************************************************************************/

"use strict";
const express = require("express");
const router  = express.Router();
const sql     = require("mssql");

router.get("/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const slot     = parseInt(req.query.slot, 10);
  if (slot !== 1 && slot !== 2)
    return res.status(400).send("Missing or invalid ?slot=1|2");

  try {
    const pool = await sql.connect();

    /* 1 ── User lookup ─────────────────────────────────────────────── */
    const userQ = await pool.request()
                            .input("uuid", sql.VarChar, uuid)
                            .query(`SELECT UserID FROM Users WHERE SL_UUID=@uuid`);
    if (!userQ.recordset.length)
      return res.status(404).send("USER_NOT_FOUND");
    const userID = userQ.recordset[0].UserID;

    /* 2 ── Character (join Houses & Regions) ───────────────────────── */
    const charQ = await pool.request()
                            .input("uid",  sql.Int, userID)
                            .input("slot", sql.Int, slot)
                            .query(`
        SELECT  c.CharacterID,
                c.Name,
                ISNULL(h.HouseName,  '')  AS HouseName,
                ISNULL(r.RegionName,'')  AS RegionName,
                c.Age
        FROM    Characters c
          LEFT  JOIN Houses   h ON h.HouseID   = c.HouseID
          LEFT  JOIN Regions  r ON r.RegionID  = c.RegionID
        WHERE   c.UserID = @uid
          AND   c.AssignedSlot = @slot
          AND   c.appStatus    = 'Approved'
    `);
    if (!charQ.recordset.length)
      return res.status(404).send("CHAR_NOT_FOUND");

    const c = charQ.recordset[0];

    /* 3 ── Attribute + Skill values ───────────────────────────────── */
    const [attrQ, skillQ] = await Promise.all([
      pool.request().input("cid", sql.Int, c.CharacterID).query(`
          SELECT Value
          FROM   CharacterAttributes
          WHERE  CharacterID=@cid
          ORDER  BY CoreAttributeID
      `),
      pool.request().input("cid", sql.Int, c.CharacterID).query(`
          SELECT Value
          FROM   CharacterSkills
          WHERE  CharacterID=@cid
          ORDER  BY SkillID
      `)
    ]);

    const nums = [];
    attrQ.recordset.forEach(r  => nums.push(r.Value));
    skillQ.recordset.forEach(r => nums.push(r.Value));

    /* 4 ── Assemble pipe-string ───────────────────────────────────── */
    const basic = [
      c.Name,
      c.HouseName,
      c.RegionName,
      c.Age != null ? c.Age : ""
    ].join("|");

    return res.send(basic + "||" + nums.join("|"));

  } catch (err) {
    console.error("[hud-slot-sync]", err);
    return res.status(500).send("SERVER_ERROR");
  }
});

module.exports = router;
