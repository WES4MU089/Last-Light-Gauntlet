// routes/terrain.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Helper middleware to check admin session
function checkAdmin(req, res, next) {
  if (!req.session.isAdmin) return res.status(403).send('Access denied (not admin).');
  next();
}

// POST /api/terrain - Create a new terrain type
router.post('/', checkAdmin, async (req, res) => {
  try {
    const { name, color, passable, movementCost, defenseMod, moraleMod, attritionMod, fleeMod, perceptionMod } = req.body;
    const pool = req.app.get('dbpool');
    const poolReq = pool.request();
    poolReq.input('Name', sql.NVarChar(50), name);
    poolReq.input('Color', sql.NVarChar(20), color);
    poolReq.input('Passable', sql.Bit, passable ? 1 : 0);
    poolReq.input('MovementCost', sql.Int, movementCost);
    poolReq.input('DefenseMod', sql.Float, defenseMod);
    poolReq.input('MoraleMod', sql.Float, moraleMod);
    poolReq.input('AttritionMod', sql.Float, attritionMod);
    poolReq.input('FleeMod', sql.Float, fleeMod);
    poolReq.input('PerceptionMod', sql.Float, perceptionMod);
    const result = await poolReq.query(`
      INSERT INTO dbo.TerrainTypes
        ([Name], [Color], [Passable], [MovementCost],
         [DefenseMod], [MoraleMod], [AttritionMod], [FleeMod], [PerceptionMod])
      OUTPUT INSERTED.*
      VALUES
        (@Name, @Color, @Passable, @MovementCost,
         @DefenseMod, @MoraleMod, @AttritionMod, @FleeMod, @PerceptionMod)
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating terrain:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/terrain - List all terrain types
router.get('/', checkAdmin, async (req, res) => {
  try {
    const pool = req.app.get('dbpool');
    const result = await pool.request().query(`
      SELECT
        TerrainID AS terrain_id,
        [Name] AS name,
        [Color] AS color,
        Passable AS passable,
        MovementCost AS movementCost,
        DefenseMod AS defenseMod,
        MoraleMod AS moraleMod,
        AttritionMod AS attritionMod,
        FleeMod AS fleeMod,
        PerceptionMod AS perceptionMod
      FROM dbo.TerrainTypes
      ORDER BY TerrainID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching terrain list:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/terrain/:id - Edit a terrain type
router.put('/:id', checkAdmin, async (req, res) => {
  try {
    const terrainId = parseInt(req.params.id, 10);
    const { name, color, passable, movementCost, defenseMod, moraleMod, attritionMod, fleeMod, perceptionMod } = req.body;
    const pool = req.app.get('dbpool');
    const poolReq = pool.request();
    poolReq.input('TerrainID', sql.Int, terrainId);
    poolReq.input('Name', sql.NVarChar(50), name);
    poolReq.input('Color', sql.NVarChar(20), color);
    poolReq.input('Passable', sql.Bit, passable ? 1 : 0);
    poolReq.input('MovementCost', sql.Int, movementCost);
    poolReq.input('DefenseMod', sql.Float, defenseMod);
    poolReq.input('MoraleMod', sql.Float, moraleMod);
    poolReq.input('AttritionMod', sql.Float, attritionMod);
    poolReq.input('FleeMod', sql.Float, fleeMod);
    poolReq.input('PerceptionMod', sql.Float, perceptionMod);
    const result = await poolReq.query(`
      UPDATE dbo.TerrainTypes
      SET
        [Name] = @Name,
        [Color] = @Color,
        [Passable] = @Passable,
        [MovementCost] = @MovementCost,
        [DefenseMod] = @DefenseMod,
        [MoraleMod] = @MoraleMod,
        [AttritionMod] = @AttritionMod,
        [FleeMod] = @FleeMod,
        [PerceptionMod] = @PerceptionMod
      WHERE TerrainID = @TerrainID;

      SELECT * FROM dbo.TerrainTypes WHERE TerrainID = @TerrainID;
    `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Terrain not found or update failed.' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error updating terrain:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
