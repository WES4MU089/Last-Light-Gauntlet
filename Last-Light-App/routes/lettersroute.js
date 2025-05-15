/**************************************************************************
 * routes/lettersroute.js   –  secured viewer
 * -----------------------------------------------------------------------
 * End-points
 *   GET  /letters/ping
 *   GET  /letters/compose
 *   POST /letters          (create)
 *   POST /letters/:id/transfer
 *   GET  /letters/:id      (viewer – auth & owner check!)
 **************************************************************************/

"use strict";

const express = require("express");
const sql     = require("mssql");
const jwt     = require("jsonwebtoken");
const { formatLetterTimestamp } = require("../utils/westeros-time");

const router  = express.Router();

/* helper: reuse pool */
async function pool () { return sql.connected ? sql : sql.connect(); }

/* ------------------------------------------------------------------ */
/* Tiny util – get logged-in user (session or ?token)                 */
/* Returns numeric userId or null. Also populates req.session.        */
/* ------------------------------------------------------------------ */
function getUserId (req)
{
  /* already in session                                         */
  if (req.session?.userId) return req.session.userId;

  /* token path                                                 */
  const tok = req.query.token;
  if (!tok) return null;

  try {
    const payload = jwt.verify(tok, process.env.JWT_SECRET);
    req.session.userId = payload.userId;    // persist for same browser
    return payload.userId;
  } catch (_e) { return null; }
}

/* ------------------------------------------------------------------ */
/* 1) Ping & 2) Compose  (unchanged)                                  */
/* ------------------------------------------------------------------ */
router.get("/ping", (_q, r) => r.json({ ok:true, ts:Date.now() }));
router.get("/compose", (_q, r) => r.render("letter_compose"));

/* ------------------------------------------------------------------ */
/* 3)  POST /letters        (create) – unchanged                      */
/* 4)  POST /letters/:id/transfer – unchanged                         */
/* ------------------------------------------------------------------ */
/*   …  keep your existing implementation here …                      */

/* ------------------------------------------------------------------ */
/* 5)  Viewer – now secured                                           */
/* ------------------------------------------------------------------ */
router.get("/:id", async (req, res) =>
{
  /* ── 1) authenticate ─────────────────────────────────────── */
  const uid = getUserId(req);
  if (!uid) return res.status(401).send("Unauthorized.");

  /* ── 2) fetch viewer’s active character ───────────────────── */
  const p = await pool();
  const uRS = await p.request()
    .input("uid", sql.Int, uid)
    .query("SELECT ActiveCharacterID FROM Users WHERE UserID=@uid");
  const activeChar = uRS.recordset[0]?.ActiveCharacterID || 0;

  /* ── 3) load letter & verify ownership ────────────────────── */
  const lRS = await p.request()
    .input("lid", sql.Int, Number(req.params.id))
    .query("SELECT * FROM Letters WHERE LetterId=@lid");

  if (!lRS.recordset.length)
    return res.status(404).send("Letter not found.");

  const letter = lRS.recordset[0];

  /* CurrentOwnerCharId *must* match viewer’s active character  */
  if (letter.CurrentOwnerCharId !== activeChar)
    return res.status(403).send("Forbidden – not your letter.");

  /* ── 4) render ────────────────────────────────────────────── */
  const ts = formatLetterTimestamp(letter.CreatedAt);
  res.render("letter_viewer", { letter, ts });
});

module.exports = router;
