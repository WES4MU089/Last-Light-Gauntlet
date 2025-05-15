// File: routes/createcharacterroute.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/* ----------------------------------------------------------------------
 * 0) GAME CONSTANTS
 * -------------------------------------------------------------------- */
const ATTR_MIN = 1, ATTR_MAX = 5;
const SKILL_MIN = 0, SKILL_MAX = 5;

/* ----------------------------------------------------------------------
 * 1) Multer – avatar upload
 * -------------------------------------------------------------------- */
const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const r = await sql.query`SELECT SL_UUID FROM Users WHERE UserID = ${req.session.userId}`;
      if (!r.recordset.length) return cb(new Error('User not found'));
      const dir = path.join(__dirname, '..', 'public', 'images', 'user', r.recordset[0].SL_UUID);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) =>
    ['.jpg', '.jpeg', '.png'].includes(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new Error('Only .jpg / .png files allowed'), false)
});

/* ----------------------------------------------------------------------
 * 2) Helper – fetch lists for the form
 * -------------------------------------------------------------------- */
async function fetchLists() {
  // core attributes
  const attrRes = await sql.query`
    SELECT CoreAttributeID, Name AS AttributeName, Description AS AttributeDescription
    FROM CoreAttributes
    ORDER BY CoreAttributeID
  `;

  // skills grouped by attribute
  const skillsRes = await sql.query`
    SELECT S.SkillID, S.Name AS SkillName, S.Description AS SkillDescription,
           S.CoreAttributeID, CA.Name AS CoreAttributeName
    FROM Skills S
    JOIN CoreAttributes CA ON S.CoreAttributeID = CA.CoreAttributeID
    ORDER BY CA.CoreAttributeID, S.Name
  `;
  const grouped = {};
  skillsRes.recordset.forEach(s => {
    if (!grouped[s.CoreAttributeID]) {
      grouped[s.CoreAttributeID] = {
        coreAttributeID:   s.CoreAttributeID,
        coreAttributeName: s.CoreAttributeName,
        skills:            []
      };
    }
    grouped[s.CoreAttributeID].skills.push({
      SkillID: s.SkillID,
      Name:    s.SkillName,
      Description: s.SkillDescription
    });
  });

  // regions + houses
  const regions = (await sql.query`
    SELECT RegionID, RegionName FROM Regions ORDER BY RegionName
  `).recordset;

  const housesByRegion = {};
  (await sql.query`
    SELECT HouseID, HouseName, Region FROM Houses ORDER BY Region, HouseName
  `).recordset.forEach(h => {
    (housesByRegion[h.Region] ||= []).push({ id: h.HouseID, name: h.HouseName });
  });

  return {
    coreAttributes:     attrRes.recordset,
    skillsByAttribute:  Object.values(grouped),
    regions,
    housesByRegion
  };
}

/* ----------------------------------------------------------------------
 * 3) GET / – creation form
 * -------------------------------------------------------------------- */
router.get('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  try {
    const lists = await fetchLists();
    res.render('create-character', {
      coreAttributes:    lists.coreAttributes,
      skillsByAttribute: lists.skillsByAttribute,
      regions:           lists.regions,
      housesByRegion:    lists.housesByRegion,
      ATTR_MIN,
      ATTR_MAX,
      SKILL_MIN,
      SKILL_MAX
    });
  } catch (err) {
    console.error('[GET /account/create-character] Error:', err);
    res.status(500).send('Server error.');
  }
});

/* ----------------------------------------------------------------------
 * 4) POST / – insert character
 * -------------------------------------------------------------------- */
router.post('/', upload.single('avatar'), async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  let {
    Name,
    Age,
    Region,
    House,
    HoHApp = 'no',
    Description,
    Sex = 'male',
    History,
    attributes = {},
    skills     = {}
  } = req.body;

  Age    = parseInt(Age, 10)    || 18;
  Region = parseInt(Region, 10) || null;
  House  = parseInt(House, 10)  || null;
  const applyingHoH = HoHApp === 'yes' ? 1 : 0;

  // clamp incoming numbers
  Object.keys(attributes).forEach(k => {
    let v = parseInt(attributes[k], 10);
    attributes[k] = isNaN(v) ? ATTR_MIN : Math.max(ATTR_MIN, Math.min(ATTR_MAX, v));
  });
  Object.keys(skills).forEach(k => {
    let v = parseInt(skills[k], 10);
    skills[k] = isNaN(v) ? SKILL_MIN : Math.max(SKILL_MIN, Math.min(SKILL_MAX, v));
  });

  let tx;
  try {
    // enforce max-two rule
    const cntRes = await sql.query`
      SELECT COUNT(*) AS C FROM Characters WHERE UserID = ${req.session.userId}
    `;
    if (cntRes.recordset[0].C >= 2)
      return res.status(400).send('Max characters reached.');
    const slot = cntRes.recordset[0].C === 0 ? 1 : 2;

    tx = new sql.Transaction();
    await tx.begin();

    // insert main character
    const ins = await tx.request()
      .input('uid',  sql.Int,    req.session.userId)
      .input('name', sql.NVarChar(100), Name)
      .input('age',  sql.Int,    Age)
      .input('reg',  sql.Int,    Region)
      .input('house',sql.Int,    House)
      .input('hoh',  sql.Bit,    applyingHoH)
      .input('desc', sql.NVarChar(sql.MAX), Description || null)
      .input('sex',  sql.VarChar(10), Sex)
      .input('img',  sql.NVarChar(255),
         req.file
           ? req.file.path.replace(/.*?public/, '').replace(/\\/g, '/')
           : null
      )
      .input('hist', sql.NVarChar(sql.MAX), History || null)
      .input('slot', sql.TinyInt, slot)
      .query(`
        INSERT INTO Characters
          (UserID, Name, Age, RegionID, HouseID, ApplyingHoH,
           Description, Sex, ImagePath, History, AssignedSlot, Created_At)
        OUTPUT INSERTED.CharacterID
        VALUES
          (@uid,@name,@age,@reg,@house,@hoh,@desc,@sex,@img,@hist,@slot, GETDATE())
      `);
    const charId = ins.recordset[0].CharacterID;

    // attributes
    for (const aId in attributes) {
      await tx.request()
        .input('cid', sql.Int, charId)
        .input('aid', sql.Int, parseInt(aId,10))
        .input('val', sql.Int, attributes[aId])
        .input('cap', sql.Int, ATTR_MAX)
        .query(`
          INSERT INTO CharacterAttributes
            (CharacterID, CoreAttributeID, Value, MaxCap)
          VALUES (@cid,@aid,@val,@cap)
        `);
    }

    // skills
    for (const sId in skills) {
      await tx.request()
        .input('cid', sql.Int, charId)
        .input('sid', sql.Int, parseInt(sId,10))
        .input('val', sql.Int, skills[sId])
        .query(`
          INSERT INTO CharacterSkills
            (CharacterID, SkillID, Value)
          VALUES (@cid,@sid,@val)
        `);
    }

    await tx.commit();
    res.redirect('/account');
  } catch (err) {
    console.error('[POST /account/create-character] Error:', err);
    if (tx && !tx.finished) await tx.rollback();
    res.status(500).send('Server error creating character.');
  }
});

module.exports = router;
