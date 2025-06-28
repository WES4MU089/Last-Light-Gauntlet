/**************************************************************************
 * routes/lettersroute.js  –  viewer + compose + API (JWT/stateless)
 **************************************************************************/

"use strict";

const express = require("express");
const sql     = require("mssql");
const jwt     = require("jsonwebtoken");
const { formatLetterTimestamp } = require("../utils/westeros-time");

const router  = express.Router();

async function pool () { return sql.connected ? sql : sql.connect(); }

/* Stateless util – get logged-in userId from JWT (?token=...) */
function getUserId(req) {
  const tok = req.query.token;
  if (!tok) return null;
  try {
    const payload = jwt.verify(tok, process.env.JWT_SECRET);
    return payload.userId;
  } catch (_e) { return null; }
}

/* 1) Ping & 2) Compose */
router.get("/ping", (_q, r) => r.json({ ok:true, ts:Date.now() }));
router.get("/compose", (_q, r) => r.render("letter_compose"));

/* 3) CREATE LETTER  (POST /letters) */
router.post('/', async (req, res) => {
  const { toName, fromName = '', content } = req.body || {};

  if (!toName || !content)
    return res.status(400).json({ error: 'Missing toName or content' });

  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Not logged in' });

  try {
    const p = await pool();

    const chrRS = await p.request()
      .input('uid', sql.Int, uid)
      .query('SELECT ActiveCharacterID FROM Users WHERE UserID=@uid');

    const authorChar = chrRS.recordset[0]?.ActiveCharacterID || 0;
    if (!authorChar) return res.status(403).json({ error: "No active character." });

    const result = await p.request()
      .input('to',   sql.NVarChar(255),        toName)
      .input('from', sql.NVarChar(255),        fromName)
      .input('cont', sql.NVarChar(sql.MAX),    content)
      .input('aut',  sql.Int,                  authorChar)
      .query(`
        INSERT INTO Letters
          (ToName, FromName, Content, AuthorCharId, CurrentOwnerCharId)
        OUTPUT INSERTED.LetterId AS id
        VALUES
          (@to, @from, @cont, @aut, @aut)
      `);

    return res.json({ ok: true, id: result.recordset[0].id });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
});

/* 4) TRANSFER  (placeholder) */
router.post("/:id/transfer", (_q, r) => r.status(501).json({ error:"Not implemented" }));

/* 5) VIEWER – secured */
router.get("/:id", async (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).send("Unauthorized.");

  const p = await pool();
  const uRS = await p.request()
    .input("uid", sql.Int, uid)
    .query("SELECT ActiveCharacterID FROM Users WHERE UserID=@uid");
  const activeChar = uRS.recordset[0]?.ActiveCharacterID || 0;
  if (!activeChar) return res.status(403).send("No active character.");

  const lRS = await p.request()
    .input("lid", sql.Int, Number(req.params.id))
    .query("SELECT * FROM Letters WHERE LetterId=@lid");

  if (!lRS.recordset.length) return res.status(404).send("Letter not found.");
  const letter = lRS.recordset[0];

  // DEBUG: show IDs
  console.log(
    "[VIEW LETTER] letter.CurrentOwnerCharId =",
    letter.CurrentOwnerCharId,
    "activeChar =",
    activeChar
  );

  if (letter.CurrentOwnerCharId !== activeChar)
    return res.status(403).send("Forbidden – not your letter.");

  const ts = formatLetterTimestamp(letter.CreatedAt);

  // Always pass the token to the template
  res.render("letter_viewer", {
    letter,
    ts,
    token: req.query.token
  });
});

module.exports = router;
