// routes/houses.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

function checkAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(403).send('Access denied (not admin).');
  }
  next();
}

// GET /api/houses
router.get('/', checkAdmin, async (req, res) => {
  try {
    /*
      Columns in dbo.Houses:
        [HouseID]
        ,[HouseName]
        ,[AllianceID]
        ,[HoH]
        ,[HouseColor]
        ,[Region]
    */
    const pool = req.app.get('dbpool');

    // 1) Run the query
    const result = await pool.request().query(`
      SELECT
        HouseID,
        HouseName,
        AllianceID,
        HoH,
        HouseColor,
        [Region] AS RegionID
      FROM dbo.Houses
      ORDER BY HouseID
    `);

    // 2) Debug: log the entire recordset on the server console
    console.log('[DEBUG] Houses from DB =>', JSON.stringify(result.recordset, null, 2));

    // 3) Send the data back to the client
    res.json(result.recordset);

  } catch (err) {
    console.error('Error fetching houses:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/houses - create a new house
router.post('/', checkAdmin, async (req, res) => {
  try {
    // Use client payload keys (all lowercase)
    const { houseName, allianceID, hoh, houseColor, region } = req.body;

    if (!houseName) {
      return res.status(400).json({ error: 'House Name is required' });
    }

    const pool = req.app.get('dbpool');
    const request = pool.request();
    request.input('HouseName', sql.NVarChar(100), houseName);
    request.input('AllianceID', sql.Int, allianceID !== undefined ? allianceID : null);
    request.input('HoH', sql.Int, hoh !== undefined ? hoh : 0);
    request.input('HouseColor', sql.NVarChar(20), houseColor || '#ffffff');
    request.input('Region', sql.Int, region !== undefined ? region : 0);

    const result = await request.query(`
      INSERT INTO dbo.Houses
        (HouseName, AllianceID, HoH, HouseColor, [Region])
      OUTPUT INSERTED.*
      VALUES
        (@HouseName, @AllianceID, @HoH, @HouseColor, @Region)
    `);

    console.log('[DEBUG] Newly created house =>', result.recordset[0]);
    res.json(result.recordset[0]);

  } catch (err) {
    console.error('Error creating house:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/houses/:id
router.put('/:id', checkAdmin, async (req, res) => {
  try {
    const houseID = parseInt(req.params.id, 10);
    if (!houseID) {
      return res.status(400).json({ error: 'Invalid house ID' });
    }

    const { houseName, allianceID, hoh, houseColor, region } = req.body;
    if (!houseName) {
      return res.status(400).json({ error: 'houseName is required' });
    }

    const pool = req.app.get('dbpool');
    const request = pool.request();
    request.input('HouseID', sql.Int, houseID);
    request.input('HouseName', sql.NVarChar(100), houseName);
    request.input('AllianceID', sql.Int, allianceID);
    request.input('HoH', sql.Int, hoh);
    request.input('HouseColor', sql.NVarChar(20), houseColor || '#ffffff');
    request.input('Region', sql.Int, region);

    const result = await request.query(`
      UPDATE dbo.Houses
      SET
        HouseName = @HouseName,
        AllianceID = @AllianceID,
        HoH = @HoH,
        HouseColor = @HouseColor,
        [Region] = @Region
      OUTPUT INSERTED.*
      WHERE HouseID = @HouseID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'House not found' });
    }

    console.log('[DEBUG] Updated house =>', result.recordset[0]);
    res.json(result.recordset[0]);

  } catch (err) {
    console.error('Error updating house:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
