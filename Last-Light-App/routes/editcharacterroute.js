/**************************************************************************
 * routes/editcharacterroute.js  (mounted at /edit-character)
 *
 *  GET  /edit-character/:id   – show pre-populated form
 *  POST /edit-character/:id   – save updates
 **************************************************************************/

const express  = require("express");
const router   = express.Router();
const sql      = require("mssql");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const { body, validationResult } = require("express-validator");

/* ─── CONSTANTS ──────────────────────────────────────────────────── */
const ATTR_MIN = 1, ATTR_MAX = 5;
const SKILL_MIN = 0, SKILL_MAX = 5;

/* ─── MULTER (avatar upload) ────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const { recordset } = await sql.query`
        SELECT SL_UUID FROM Users WHERE UserID = ${req.session.userId}`;
      if (!recordset.length) return cb(new Error("User not found"));
      const dir = path.join(__dirname, "..", "public", "images", "user",
                            recordset[0].SL_UUID);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (e) { cb(e); }
  },
  filename: (_req, file, cb) =>
    cb(
      null,
      `${Date.now()}_${file.originalname.toLowerCase().replace(/\s+/g, "_")}`
    )
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) =>
    [".jpg", ".jpeg", ".png"].includes(
        path.extname(file.originalname).toLowerCase()
    ) ? cb(null, true)
      : cb(new Error("Only .jpg / .png files allowed"), false)
});

/* ─── HELPERS ───────────────────────────────────────────────────── */
async function fetchLists() {
  const [attributes, skills, regions, houses] = await Promise.all([
    sql.query`
      SELECT CoreAttributeID AS [key], Name AS [label], Description
      FROM CoreAttributes ORDER BY CoreAttributeID`,
    sql.query`
      SELECT SkillID AS [id], Name AS [label], Description,
             CoreAttributeID AS [attrId]
      FROM Skills ORDER BY CoreAttributeID, Name`,
    sql.query`
      SELECT RegionID, RegionName FROM Regions ORDER BY RegionName`,
    sql.query`
      SELECT HouseID, HouseName, Region
      FROM Houses ORDER BY Region, HouseName`
  ]);

  /* map houses → region for JS cascade */
  const housesByRegion = {};
  houses.recordset.forEach(h => {
    (housesByRegion[h.Region] ||= []).push({ id: h.HouseID, name: h.HouseName });
  });

  return {
    attributes : attributes.recordset,
    skills     : skills.recordset,
    regions    : regions.recordset,
    housesByRegion
  };
}

async function loadCharacterFull(charId, userId) {
  const char = (await sql.query`
      SELECT * FROM Characters
      WHERE CharacterID = ${charId} AND UserID = ${userId}`
  ).recordset[0];
  if (!char) return null;

  const attrMap  = {};
  const skillMap = {};
  (await sql.query`
      SELECT CoreAttributeID, Value
      FROM CharacterAttributes WHERE CharacterID = ${charId}`
  ).recordset.forEach(r => attrMap [r.CoreAttributeID] = r.Value);
  (await sql.query`
      SELECT SkillID, Value
      FROM CharacterSkills WHERE CharacterID = ${charId}`
  ).recordset.forEach(r => skillMap[r.SkillID]        = r.Value);

  return { ...char, attributes: attrMap, skills: skillMap };
}

/* ─── GET /edit-character/:id ───────────────────────────────────── */
router.get("/:id", async (req, res, next) => {
  try {
    const cid = +req.params.id;
    if (isNaN(cid)) return res.status(400).send("Bad id.");

    const [character, lists] = await Promise.all([
      loadCharacterFull(cid, req.session.userId),
      fetchLists()
    ]);
    if (!character) return res.status(404).send("Character not found.");

    res.render("edit-character", {
      character,
      ...lists,
      ATTR_MIN,
      ATTR_MAX,
      SKILL_MIN,
      SKILL_MAX
    });
  } catch (err) { next(err); }
});

/* ─── POST /edit-character/:id ──────────────────────────────────── */
router.post("/:id",
  upload.single("avatar"),
  body("Name").trim().isLength({ min: 2, max: 40 }).escape(),
  body("Age").isInt({ min: 1, max: 120 }).toInt(),
  body("Region").isInt().toInt(),
  body("House").isInt().toInt(),
  async (req, res, next) => {
    try {
      const cid = +req.params.id;
      if (isNaN(cid)) return res.status(400).send("Bad id.");

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const lists = await fetchLists();
        return res.render("edit-character", {
          character: { CharacterID: cid, ...req.body },
          ...lists,
          errors: errors.array(),
          ATTR_MIN, ATTR_MAX, SKILL_MIN, SKILL_MAX
        });
      }

      const imgPath = req.file
        ? req.file.path.replace(/.*?public/, "").replace(/\\/g, "/")
        : null;

      let sqlText = `
        UPDATE Characters SET
          Name        = @Name,
          Age         = @Age,
          Sex         = @Sex,
          RegionID    = @Region,
          HouseID     = @House,
          Description = @Desc,
          History     = @Hist,
          ModifiedBy  = @Uid`;
      if (imgPath) sqlText += ", ImagePath = @Img";
      sqlText += " WHERE CharacterID = @Cid AND UserID = @Uid";

      const rq = new sql.Request()
        .input("Cid",    sql.Int,  cid)
        .input("Uid",    sql.Int,  req.session.userId)
        .input("Name",   sql.NVarChar(100), req.body.Name)
        .input("Age",    sql.Int, req.body.Age)
        .input("Sex",    sql.VarChar(10), req.body.Sex)
        .input("Region", sql.Int, req.body.Region)
        .input("House",  sql.Int, req.body.House)
        .input("Desc",   sql.NVarChar(sql.MAX), req.body.Description || null)
        .input("Hist",   sql.NVarChar(sql.MAX), req.body.History     || null);
      if (imgPath) rq.input("Img", sql.NVarChar(255), imgPath);

      await rq.query(sqlText);

      res.redirect("/account");
    } catch (err) {
      console.error("[POST /edit-character] error:", err);
      next(err);
    }
  });

module.exports = router;
