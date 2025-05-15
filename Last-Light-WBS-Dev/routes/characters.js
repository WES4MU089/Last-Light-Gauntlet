// routes/characters.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

function checkAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(403).send('Access denied (not admin).');
  }
  next();
}

// GET /api/characters
router.get('/', checkAdmin, async (req, res) => {
  try {
    /*
      Columns in dbo.Characters:
        [CharacterID]
        ,[UserID]
        ,[Name]
        ,[Description]
        ,[Created_At]
        ,[Age]
        ,[House]      -- original user-entered field
        ,[HouseID]    -- new field for determining the house
        ,[Favor]
        ,[AssignedSlot]
        ,[Sex]
        ,[ImagePath]
        ,[History]
        ,[appStatus]
        ,[ModifiedBy]
        ,[Holding]
    */
    const pool = req.app.get('dbpool');
    const result = await pool.request().query(`
      SELECT
        CharacterID,
        UserID,
        [Name],
        [Description],
        Created_At,
        Age,
        [House],
        HouseID,
        Favor,
        AssignedSlot,
        Sex,
        ImagePath,
        [History],
        appStatus,
        ModifiedBy,
        Holding
      FROM dbo.Characters
      ORDER BY CharacterID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching characters:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/characters
router.post('/', checkAdmin, async (req, res) => {
  try {
    const {
      UserID,
      Name,
      Description,
      Created_At,
      Age,
      House,
      HouseID,  // new field
      Favor,
      AssignedSlot,
      Sex,
      ImagePath,
      History,
      appStatus,
      ModifiedBy,
      Holding
    } = req.body;

    const pool = req.app.get('dbpool');
    const request = pool.request();
    request.input('UserID', sql.Int, UserID || null);
    request.input('Name', sql.NVarChar(100), Name);
    request.input('Description', sql.NVarChar(500), Description || null);
    request.input('Created_At', sql.DateTime, Created_At || null);
    request.input('Age', sql.Int, Age || null);
    request.input('House', sql.NVarChar(100), House || null);
    request.input('HouseID', sql.Int, HouseID || null);
    request.input('Favor', sql.Int, Favor || 0);
    request.input('AssignedSlot', sql.Int, AssignedSlot || null);
    request.input('Sex', sql.NVarChar(1), Sex || null);
    request.input('ImagePath', sql.NVarChar(255), ImagePath || null);
    request.input('History', sql.NVarChar(sql.MAX), History || null);
    request.input('appStatus', sql.NVarChar(50), appStatus || null);
    request.input('ModifiedBy', sql.NVarChar(50), ModifiedBy || null);
    request.input('Holding', sql.Int, Holding || null);

    const result = await request.query(`
      INSERT INTO dbo.Characters
        (UserID, [Name], [Description], Created_At, Age, [House], HouseID, Favor,
         AssignedSlot, Sex, ImagePath, [History], appStatus, ModifiedBy, Holding)
      OUTPUT INSERTED.*
      VALUES
        (@UserID, @Name, @Description, @Created_At, @Age, @House, @HouseID, @Favor,
         @AssignedSlot, @Sex, @ImagePath, @History, @appStatus, @ModifiedBy, @Holding)
    `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating character:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/characters/:id - Update a character (including new HouseID)
router.put('/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  // For this update, we're editing Name, Description, and HouseID.
  const { Name, Description, HouseID } = req.body;
  try {
    const pool = req.app.get('dbpool');
    const poolReq = pool.request();
    poolReq.input('CharacterID', sql.Int, id);
    poolReq.input('Name', sql.NVarChar(100), Name);
    poolReq.input('Description', sql.NVarChar(500), Description);
    poolReq.input('HouseID', sql.Int, HouseID);
    
    const result = await poolReq.query(`
      UPDATE dbo.Characters
      SET [Name] = @Name,
          [Description] = @Description,
          HouseID = @HouseID
      WHERE CharacterID = @CharacterID;
      SELECT * FROM dbo.Characters WHERE CharacterID = @CharacterID;
    `);
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error updating character:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
