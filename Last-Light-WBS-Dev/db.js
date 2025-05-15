// db.js
const sql = require('mssql');
const dbConfig = require('./dbConfig'); // ensure this points to your DB config file

let pool;

async function initPool() {
  pool = new sql.ConnectionPool(dbConfig);
  await pool.connect();
  console.log('Connected to MSSQL DB');
  return pool;
}

async function loadTerrainInfo() {
  const result = await pool.request().query(`
    SELECT TerrainID, Passable, MovementCost
    FROM dbo.TerrainTypes
  `);
  const terrainMap = new Map();
  result.recordset.forEach(row => {
    terrainMap.set(row.TerrainID, {
      passable: Boolean(row.Passable),
      movementCost: row.MovementCost || 1
    });
  });
  return terrainMap;
}

/**
 * ensureMainMapExists checks if any map record exists in dbo.Maps.
 * If not, it inserts a new record supplying default values for MapName, ImageWidth, ImageHeight,
 * HexWidth, HexHeight, TotalCols, and TotalRows. SQL Server generates the MapID.
 */
async function ensureMainMapExists(imageWidth, imageHeight, hexWidth, hexHeight, totalCols, totalRows) {
  const result = await pool.request().query(`SELECT TOP 1 MapID FROM dbo.Maps`);
  
  if (result.recordset.length === 0) {
    console.log("Main map not found. Creating it...");
    const defaultMapName = "Main Map";
    const insertResult = await pool.request()
      .input('MapName', sql.NVarChar, defaultMapName)
      .input('TotalCols', sql.Int, totalCols)
      .input('TotalRows', sql.Int, totalRows)
      .input('ImageWidth', sql.Int, imageWidth)
      .input('ImageHeight', sql.Int, imageHeight)
      .input('HexWidth', sql.Int, hexWidth)
      .input('HexHeight', sql.Int, hexHeight)
      .query(`
        INSERT INTO dbo.Maps (MapName, TotalCols, TotalRows, ImageWidth, ImageHeight, HexWidth, HexHeight)
        OUTPUT inserted.MapID
        VALUES (@MapName, @TotalCols, @TotalRows, @ImageWidth, @ImageHeight, @HexWidth, @HexHeight)
      `);
    const newMapId = insertResult.recordset[0].MapID;
    console.log("Inserted main map record with MapID =", newMapId);
    return newMapId;
  } else {
    const mapId = result.recordset[0].MapID;
    console.log("Main map record already exists with MapID =", mapId);
    return mapId;
  }
}



async function syncMapCells(mapId, ROWS, COLS) {
  let insertedCount = 0;
  let foundCount = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const result = await pool.request()
        .input('MapID', sql.Int, mapId)
        .input('Row', sql.Int, r)
        .input('Col', sql.Int, c)
        .query(`
          SELECT TOP 1 MapID
          FROM dbo.Map_Cells
          WHERE MapID = @MapID AND [Row] = @Row AND [Col] = @Col
        `);
      if (result.recordset.length === 0) {
        await pool.request()
          .input('MapID', sql.Int, mapId)
          .input('Row', sql.Int, r)
          .input('Col', sql.Int, c)
          .input('TerrainID', sql.Int, 1)  // Default terrain value; adjust if needed.
          .input('Passable', sql.Bit, 1)
          .query(`
            INSERT INTO dbo.Map_Cells (MapID, [Row], [Col], TerrainID, Passable)
            VALUES (@MapID, @Row, @Col, @TerrainID, @Passable)
          `);
        insertedCount++;
      } else {
        foundCount++;
      }
    }
  }
  console.log(`syncMapCells: Inserted=${insertedCount}, Found=${foundCount}`);
}

async function loadMapCellsFromDB(mapId, ROWS, COLS) {
  const mapData = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const result = await pool.request()
    .input('MapID', sql.Int, mapId)
    .query(`
      SELECT [Row], [Col], [TerrainID]
      FROM dbo.Map_Cells
      WHERE MapID = @MapID
    `);
  result.recordset.forEach(cell => {
    const { Row: row, Col: col, TerrainID: terrainId } = cell;
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      mapData[row][col] = terrainId || 0;
    }
  });
  return mapData;
}

module.exports = {
  initPool,
  loadTerrainInfo,
  syncMapCells,
  loadMapCellsFromDB,
  ensureMainMapExists,
  getPool: () => pool
};
