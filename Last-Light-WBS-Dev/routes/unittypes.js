// routes/unittypes.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

function checkAdmin(req, res, next) {
  if (!req.session.isAdmin) return res.status(403).send('Access denied (not admin).');
  next();
}

// POST /api/unittypes - Create a new unit type
router.post('/', checkAdmin, async (req, res) => {
  try {
    const { name, manpower, initialFood, initialGold, movementSpeed, upkeepMod, imagePath } = req.body;
    const pool = req.app.get('dbpool');
    const poolReq = pool.request();
    poolReq.input('Name', sql.NVarChar(50), name);
    poolReq.input('Manpower', sql.Int, manpower);
    poolReq.input('initialFood', sql.Int, initialFood);
    poolReq.input('initialGold', sql.Int, initialGold);
    poolReq.input('MovementSpeed', sql.Float, movementSpeed);
    poolReq.input('upkeepMod', sql.Float, upkeepMod);
    poolReq.input('ImagePath', sql.NVarChar(255), imagePath);
    const result = await poolReq.query(`
      INSERT INTO dbo.UnitTypes
        ([Name], [Manpower], [initialFood], [initialGold], [MovementSpeed], [upkeepMod], [ImagePath])
      OUTPUT INSERTED.*
      VALUES
        (@Name, @Manpower, @initialFood, @initialGold, @MovementSpeed, @upkeepMod, @ImagePath)
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating unit type:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/unittypes - Get a list of unit types
router.get('/', checkAdmin, async (req, res) => {
  try {
    const pool = req.app.get('dbpool');
    const result = await pool.request().query(`
      SELECT 
         UnitTypeID AS unit_type_id,
         [Name] AS name,
         [Manpower] AS manpower,
         [initialFood] AS initialFood,
         [initialGold] AS initialGold,
         [MovementSpeed] AS movementSpeed,
         [upkeepMod] AS upkeepMod,
         [ImagePath] AS imagePath
      FROM dbo.UnitTypes
      ORDER BY UnitTypeID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching unit type list:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/unittypes/:id - Update a unit type
router.put('/:id', checkAdmin, async (req, res) => {
  try {
    const unitTypeId = parseInt(req.params.id, 10);
    const { name, manpower, initialFood, initialGold, movementSpeed, upkeepMod, imagePath } = req.body;
    const pool = req.app.get('dbpool');
    const poolReq = pool.request();
    poolReq.input('UnitTypeID', sql.Int, unitTypeId);
    poolReq.input('Name', sql.NVarChar(50), name);
    poolReq.input('Manpower', sql.Int, manpower);
    poolReq.input('initialFood', sql.Int, initialFood);
    poolReq.input('initialGold', sql.Int, initialGold);
    poolReq.input('MovementSpeed', sql.Float, movementSpeed);
    poolReq.input('upkeepMod', sql.Float, upkeepMod);
    poolReq.input('ImagePath', sql.NVarChar(255), imagePath);
    const result = await poolReq.query(`
      UPDATE dbo.UnitTypes
      SET [Name] = @Name,
          [Manpower] = @Manpower,
          [initialFood] = @initialFood,
          [initialGold] = @initialGold,
          [MovementSpeed] = @MovementSpeed,
          [upkeepMod] = @upkeepMod,
          [ImagePath] = @ImagePath
      WHERE UnitTypeID = @UnitTypeID;

      SELECT * FROM dbo.UnitTypes WHERE UnitTypeID = @UnitTypeID;
    `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Unit type not found or update failed.' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error updating unit type:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
