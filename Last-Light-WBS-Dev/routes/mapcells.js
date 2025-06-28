/* ------------------------------------------------------------------ */
/* routes/mapcells.js                                                 */
/* ------------------------------------------------------------------ */
/* eslint-disable no-console */
const express = require('express');
const router  = express.Router();
const sql     = require('mssql');

/* simple admin gate ------------------------------------------------- */
function checkAdmin (req, res, next) {
  if (!req.session.isAdmin) return res.status(403).send('Access denied (not admin)');
  next();
}

/* helper: patch server-side in-memory grid -------------------------- */
function patchGameLogic (req, changes /* [{row,col,terrainId}] */) {
  const gl = req.app.get('gameLogic');
  if (!gl || !Array.isArray(gl.mapData)) return;
  for (const { row, col, terrainId } of changes) {
    if (gl.mapData[row] && gl.mapData[row][col] !== undefined) {
      gl.mapData[row][col] = Number(terrainId);
    }
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/mapcells/paint  – single-cell update                     */
/* ------------------------------------------------------------------ */
router.post('/paint', checkAdmin, async (req, res) => {
  try {
    const { mapId, col, row, terrainId } = req.body;
    const pool = req.app.get('dbpool');

    await pool.request()
      .input('MapID',     sql.Int,  mapId)
      .input('Row',       sql.Int,  row)
      .input('Col',       sql.Int,  col)
      .input('TerrainID', sql.Int,  terrainId)
      .query(`
        UPDATE dbo.Map_Cells
          SET TerrainID = @TerrainID
        WHERE MapID = @MapID AND [Row] = @Row AND [Col] = @Col
      `);

    /* live-patch in-memory grid */
    patchGameLogic(req, [{ row, col, terrainId }]);

    res.json({ ok: true, mapId, row, col, terrainId });
  } catch (err) {
    console.error('[DB] paint error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* POST /api/mapcells/bulkPaint  – bulk update                        */
/* ------------------------------------------------------------------ */
router.post('/bulkPaint', checkAdmin, async (req, res) => {
  try {
    const { mapId, changes /* array */ } = req.body;
    const pool  = req.app.get('dbpool');
    let updated = 0;

    for (const { row, col, terrainId } of changes) {
      const result = await pool.request()
        .input('MapID',     sql.Int, mapId)
        .input('Row',       sql.Int, row)
        .input('Col',       sql.Int, col)
        .input('TerrainID', sql.Int, terrainId)
        .query(`
          UPDATE dbo.Map_Cells
            SET TerrainID = @TerrainID
          WHERE MapID = @MapID AND [Row] = @Row AND [Col] = @Col
        `);

      if (result.rowsAffected[0] > 0) updated++;
    }

    /* live-patch in-memory grid */
    patchGameLogic(req, changes);

    res.json({ ok: true, updatedCount: updated });
  } catch (err) {
    console.error('[DB] bulkPaint error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* GET /api/mapcells/:mapId – full grid                               */
/* ------------------------------------------------------------------ */
router.get('/:mapId', async (req, res) => {
  try {
    const mapId = +req.params.mapId;
    const pool  = req.app.get('dbpool');

    /* pull raw cells */
    const cells = await pool.request()
      .input('MapID', sql.Int, mapId)
      .query('SELECT [Row],[Col],TerrainID FROM dbo.Map_Cells WHERE MapID = @MapID');

    /* build 2-D array */
    let maxRow = 0, maxCol = 0;
    for (const c of cells.recordset) {
      if (c.Row > maxRow) maxRow = c.Row;
      if (c.Col > maxCol) maxCol = c.Col;
    }
    const mapData = Array.from({ length: maxRow + 1 }, () =>
      Array(maxCol + 1).fill(null));

    for (const { Row, Col, TerrainID } of cells.recordset) {
      mapData[Row][Col] = Number(TerrainID);
    }

    res.json({ mapId, mapData });
  } catch (err) {
    console.error('[Map API] load error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
