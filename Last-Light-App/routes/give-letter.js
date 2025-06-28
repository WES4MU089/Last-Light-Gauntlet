/**************************************************************************
 * routes/give-letter.js   –  Letter hand-off (matches live column names)
 * -----------------------------------------------------------------------
 * POST /letters/give   body:
 *   { letterId, from, to }           // from / to = UserID OR SL-UUID
 *
 * Resolves each user’s ActiveCharacterID and moves the letter.
 **************************************************************************/

"use strict";

const express = require("express");
const sql     = require("mssql");
const router  = express.Router();

/* ------------------------------------------------ helpers ------------ */
async function pool(){ return sql.connected ? sql : sql.connect(); }

async function lookupUser(anyId){
  const p   = await pool();
  const num = Number(anyId);
  if(!Number.isNaN(num)){
    const r = await p.request()
      .input("uid", sql.Int, num)
      .query("SELECT UserID,ActiveCharacterID FROM Users WHERE UserID=@uid");
    return r.recordset[0] || null;
  }
  const r = await p.request()
    .input("uuid", sql.VarChar(64), String(anyId))
    .query("SELECT UserID,ActiveCharacterID FROM Users WHERE SL_UUID=@uuid");
  return r.recordset[0] || null;
}

/* ------------------------------------------------ route -------------- */
router.post("/give", async (req,res)=>{
  try{
    const { letterId, from, to } = req.body||{};
    if(!letterId||!from||!to)
      return res.status(400).json({ error:"letterId, from, to required." });

    /* 1) resolve both Users & active chars */
    const uFrom = await lookupUser(from);
    const uTo   = await lookupUser(to);
    if(!uFrom||!uTo)
      return res.status(404).json({ error:"One SL_UUID / UserID not found." });

    const fromChar = uFrom.ActiveCharacterID||0;
    const toChar   = uTo.ActiveCharacterID  ||0;
    if(!fromChar||!toChar)
      return res.status(400).json({ error:"One user has no active char." });

    /* 2) transactional transfer */
    const p  = await pool();
    const tx = new sql.Transaction(p);
    await tx.begin();

    /* verify ownership */
    const own = await tx.request()
      .input("lid", sql.Int, letterId)
      .input("cid", sql.Int, fromChar)
      .query("SELECT 1 FROM Letters WHERE LetterId=@lid AND CurrentOwnerCharId=@cid");
    if(!own.recordset.length){
      await tx.rollback();
      return res.status(403).json({ error:"You don't own this letter." });
    }

    /* update owner */
    await tx.request()
      .input("lid", sql.Int, letterId)
      .input("cid", sql.Int, toChar)
      .query("UPDATE Letters SET CurrentOwnerCharId=@cid WHERE LetterId=@lid");

    /* log transfer  (column names fixed here) */
    await tx.request()
      .input("lid",   sql.Int, letterId)
      .input("fromC", sql.Int, fromChar)
      .input("toC",   sql.Int, toChar)
      .query(`
        INSERT INTO LetterTransfers (LetterId,FromCharId,ToCharId)
        VALUES (@lid,@fromC,@toC)
      `);

    await tx.commit();
    res.json({ ok:true, fromCharId:fromChar, toCharId:toChar });
  }
  catch(err){
    console.error("[POST /letters/give] ERROR:", err);
    res.status(500).json({ error:"Server error." });
  }
});

module.exports = router;
