/**************************************************************************
 * routes/slot-select.js   POST /api/slot-select
 * Body: { uuid : SL-UUID , slot : 1 | 2 }
 * Sets Users.ActiveSlot   + Users.ActiveCharacterID
 * Returns { ok:true , slot , charId }
 **************************************************************************/
"use strict";
const express = require("express");
const sql     = require("mssql");
const router  = express.Router();

async function pool(){ return sql.connected ? sql : sql.connect(); }

router.post("/slot-select", async (req,res)=>{
  const uuid = (req.body.uuid || "").trim().toUpperCase();
  const slot = Number(req.body.slot || 0);

  if(!uuid || (slot!==1 && slot!==2))
    return res.status(400).json({ error:"uuid & slot required." });

  try{
    const p = await pool();

    /* grab user + character in that slot */
    const rs = await p.request()
      .input("u", sql.NVarChar(64), uuid)
      .input("s", sql.Int, slot)
      .query(`
        SELECT  u.UserID,
                c.CharacterID
        FROM    Users u
        JOIN    Characters c ON c.UserID = u.UserID
        WHERE   u.SL_UUID      = @u
          AND   c.AssignedSlot = @s
          AND   c.appStatus   = 'Approved'
      `);

    if(!rs.recordset.length)
      return res.status(404).json({ error:"No approved char in that slot." });

    const userId = rs.recordset[0].UserID;
    const charId = rs.recordset[0].CharacterID;

    /* update Users table */
    await p.request()
      .input("c", sql.Int, charId)
      .input("s", sql.Int, slot)
      .input("u", sql.Int, userId)
      .query(`
        UPDATE Users
           SET ActiveCharacterID = @c,
               ActiveSlot        = @s
         WHERE UserID = @u
      `);

    res.json({ ok:true, slot, charId });
  }catch(e){
    console.error("[slot-select]",e);
    res.status(500).json({ error:"DB error." });
  }
});

module.exports = router;
