// routes/regions.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

function checkAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(403).send('Access denied (not admin).');
  }
  next();
}

// GET /api/regions
router.get('/', checkAdmin, async (req, res) => {
  try {
    /*
      Columns in dbo.Regions:
        [RegionID]
        ,[RegionName]
        ,[regionColor]
        ,[rulingHouse]
    */
    const pool = req.app.get('dbpool');
    const result = await pool.request().query(`
      SELECT
        RegionID,
        RegionName,
        regionColor,
        rulingHouse
      FROM dbo.Regions
      ORDER BY RegionID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching regions:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/regions
router.post('/', checkAdmin, async (req, res) => {
  try {
    // Extract fields from the request body
    const { regionName, regionColor, rulingHouse } = req.body;
    if (!regionName) {
      return res.status(400).json({ error: 'RegionName is required' });
    }
    const pool = req.app.get('dbpool');
    const request = pool.request();
    request.input('RegionName', sql.NVarChar(100), regionName);
    request.input('regionColor', sql.VarChar(7), regionColor || '#ffffff');
    request.input('rulingHouse', sql.Int, rulingHouse || 0);

    const result = await request.query(`
      INSERT INTO dbo.Regions
        (RegionName, regionColor, rulingHouse)
      OUTPUT INSERTED.*
      VALUES
        (@RegionName, @regionColor, @rulingHouse)
    `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating region:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/regions/:id
router.put('/:id', checkAdmin, async (req, res) => {
    try {
      const regionID = parseInt(req.params.id, 10);
      if (!regionID) {
        return res.status(400).json({ error: 'Invalid region ID' });
      }
  
      const { regionName, regionColor, rulingHouse } = req.body;
      if (!regionName) {
        return res.status(400).json({ error: 'RegionName is required' });
      }
  
      const pool = req.app.get('dbpool');
      const request = pool.request();
      request.input('RegionID', sql.Int, regionID);
      request.input('RegionName', sql.NVarChar(100), regionName);
      request.input('regionColor', sql.VarChar(7), regionColor || '#ffffff');
      request.input('rulingHouse', sql.Int, rulingHouse || 0);
  
      const result = await request.query(`
        UPDATE dbo.Regions
        SET
          RegionName = @RegionName,
          regionColor = @regionColor,
          rulingHouse = @rulingHouse
        OUTPUT INSERTED.*
        WHERE RegionID = @RegionID
      `);
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Region not found' });
      }
  
      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Error updating region:', err);
      res.status(500).json({ error: err.message });
    }
  });
  

module.exports = router;
