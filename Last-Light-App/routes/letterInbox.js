/**************************************************************************
 * routes/letterInbox.js – character-centric inbox
 **************************************************************************/
"use strict";
const express = require("express");
const sql     = require("mssql");
const jwt     = require("jsonwebtoken");
const router  = express.Router();

async function pool () { return sql.connected ? sql : sql.connect(); }

/* ── simple auth: session or ?token=JWT ───────────────────────────── */
async function requireLogin (req, res, next) {
  if (req.session?.userId) return next();

  const tok = req.query.token;
  if (!tok) return res.status(401).send("Auth required.");

  try {
    const p = jwt.verify(tok, process.env.JWT_SECRET);
    req.session.userId = p.userId;
    next();
  } catch (e) {
    console.error("[letters/inbox] bad JWT:", e);
    res.status(401).send("Invalid / expired token.");
  }
}

/* ── GET /letters/inbox – list letters for ACTIVE character ───────── */
router.get("/inbox", requireLogin, async (req, res) => {
  try {
    const p = await pool();

    /* active character for this wearer */
    const u = await p.request()
      .input("uid", sql.Int, req.session.userId)
      .query("SELECT ActiveCharacterID FROM Users WHERE UserID=@uid");

    const charId = u.recordset[0]?.ActiveCharacterID || 0;

    /* letters the character currently owns */
    const l = await p.request()
      .input("cid", sql.Int, charId)
      .query(`
        SELECT LetterId, ToName, FromName, CreatedAt,
               LEFT(Content,80) AS Snippet
        FROM   Letters
        WHERE  CurrentOwnerCharId = @cid
        ORDER  BY CreatedAt DESC
      `);

    res.render("letters_inbox", { letters: l.recordset });
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

    const u = await p.request()
      .input("uid", sql.Int, req.session.userId)
      .query("SELECT ActiveCharacterID FROM Users WHERE UserID=@uid");

    const charId = u.recordset[0]?.ActiveCharacterID || 0;

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
