/**************************************************************************
 * routes/letterInbox.js – character-centric inbox (stateless/JWT)
 **************************************************************************/
"use strict";
const express = require("express");
const sql     = require("mssql");
const jwt     = require("jsonwebtoken");
const router  = express.Router();

async function pool () { return sql.connected ? sql : sql.connect(); }

/* ── stateless JWT auth: always trust the ?token=JWT ───────────────── */
async function requireLogin(req, res, next) {
  const tok = req.query.token;
  if (!tok) return res.status(401).send("Auth required.");

  try {
    const payload = jwt.verify(tok, process.env.JWT_SECRET);
    req.userId = payload.userId;     // Use req.userId in all routes!
    req.SL_UUID = payload.SL_UUID;   // (if you need it)
    next();
  } catch (e) {
    console.error("[letters/inbox] bad JWT:", e);
    return res.status(401).send("Invalid / expired token.");
  }
}

/* ── GET /letters/inbox – list letters for ACTIVE character ───────── */
router.get("/inbox", requireLogin, async (req, res) => {
  try {
    const p = await pool();

    // Always use req.userId, NOT req.session
    const u = await p.request()
      .input("uid", sql.Int, req.userId)
      .query("SELECT ActiveCharacterID FROM Users WHERE UserID=@uid");

    const charId = u.recordset[0]?.ActiveCharacterID;
    console.log(`[INBOX] For user ${req.userId}, active character is:`, charId);
    if (!charId) {
      // Always pass the token to the template!
      return res.render("letters_inbox", { letters: [], token: req.query.token });
    }

    // Only show letters for this character
    const l = await p.request()
      .input("cid", sql.Int, charId)
      .query(`
        SELECT LetterId, ToName, FromName, CreatedAt,
               LEFT(Content,80) AS Snippet
        FROM   Letters
        WHERE  CurrentOwnerCharId = @cid
        ORDER  BY CreatedAt DESC
      `);

    // Always pass the token to the template!
    res.render("letters_inbox", { letters: l.recordset, token: req.query.token });
  } catch (err) {
    console.error("[GET /letters/inbox]", err);
    res.status(500).send("Server error.");
  }
});

/* ── POST /letters/:id/destroy – delete letter you own ────────────── */
router.post("/:id/destroy", requireLogin, async (req, res) => {
  const letterId = Number(req.params.id);

  try {
    const p = await pool();

    // Always use req.userId, NOT req.session
    const u = await p.request()
      .input("uid", sql.Int, req.userId)
      .query("SELECT ActiveCharacterID FROM Users WHERE UserID=@uid");

    const charId = u.recordset[0]?.ActiveCharacterID;
    if (!charId) return res.status(403).json({ error: "No active character." });

    const del = await p.request()
      .input("lid", sql.Int, letterId)
      .input("cid", sql.Int, charId)
      .query(`
        DELETE FROM Letters
        WHERE LetterId           = @lid
          AND CurrentOwnerCharId = @cid
      `);

    if (!del.rowsAffected[0])
      return res.status(403).json({ error: "Not your letter." });

    res.json({ ok: true });
  } catch (err) {
    console.error("[destroy]", err);
    res.status(500).json({ error: "DB error." });
  }
});

module.exports = router;
