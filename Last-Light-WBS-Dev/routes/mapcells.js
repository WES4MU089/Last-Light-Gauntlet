// routes/mapcells.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

function checkAdmin(req, res, next) {
  if (!req.session.isAdmin) return res.status(403).send('Access denied (not admin).');
  next();
}

// POST /api/mapcells/paint - Single-cell update (not used by flood fill)
router.post('/paint', checkAdmin, async (req, res) => {
  try {
    const { mapId, col, row, terrainId } = req.body;
    const pool = req.app.get('dbpool');
    await pool.request()
      .input('MapID', sql.Int, mapId)
      .input('Row', sql.Int, row)
      .input('Col', sql.Int, col)
      .input('TerrainID', sql.Int, terrainId)
      .query(`
        UPDATE dbo.Map_Cells
        SET TerrainID = @TerrainID
        WHERE MapID = @MapID AND [Row] = @Row AND [Col] = @Col
      `);
    console.log(`[DB] Updated cell at (${col}, ${row}) to terrainId ${terrainId}`);
    res.json({ message: 'Cell updated', mapId, col, row, terrainId });
  } catch (err) {
    console.error('[DB] Error painting cell:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mapcells/bulkPaint - Bulk update for map cells
router.post('/bulkPaint', checkAdmin, async (req, res) => {
  try {
    const { mapId, changes } = req.body; // changes is an array of { row, col, terrainId }
    const pool = req.app.get('dbpool');
    let updateCount = 0;
    for (const change of changes) {
      const { row, col, terrainId } = change;
      const result = await pool.request()
        .input('MapID', sql.Int, mapId)
        .input('Row', sql.Int, row)
        .input('Col', sql.Int, col)
        .input('TerrainID', sql.Int, terrainId)
        .query(`
          UPDATE dbo.Map_Cells
          SET TerrainID = @TerrainID
          WHERE MapID = @MapID AND [Row] = @Row AND [Col] = @Col
        `);
      if (result.rowsAffected[0] > 0) {
        console.log(`[DB] Updated cell at (${col}, ${row}) to terrainId ${terrainId}`);
        updateCount++;
      } else {
        console.warn(`[DB] No cell updated at (${col}, ${row}) for terrainId ${terrainId}`);
      }
    }
    res.json({ success: true, updatedCount: updateCount });
  } catch (err) {
    console.error('[DB] Error in bulkPaint:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
