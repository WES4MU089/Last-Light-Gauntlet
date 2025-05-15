// routes/units.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

function checkAdmin(req, res, next) {
  if (!req.session.isAdmin) return res.status(403).send('Access denied (not admin).');
  next();
}

// GET /api/units - List units (for the admin panel)
router.get('/', checkAdmin, async (req, res) => {
  try {
    const pool = req.app.get('dbpool');
    const result = await pool.request().query(`
      SELECT u.*, 
             ut.ImagePath, 
             ut.Name AS UnitTypeName, 
             c.HouseID
      FROM dbo.Units u
      JOIN dbo.UnitTypes ut ON u.UnitTypeID = ut.UnitTypeID
      LEFT JOIN dbo.Characters c ON u.OwnerCharacterID = c.CharacterID
      ORDER BY u.UnitID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching units:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/units - Create a new unit (admin-placed)
router.post('/', checkAdmin, async (req, res) => {
  try {
    // Log the incoming body for debugging
    console.log("POST /api/units called with body:", req.body);

    const { unitTypeID, unitName, manpower, shipCount, col, row, ownerCharacterID, commanderID, homeHoldingID } = req.body;
    
    // Log each parsed parameter to verify values
    console.log("Parsed parameters:", {
      unitTypeID, unitName, manpower, shipCount, col, row, ownerCharacterID, commanderID, homeHoldingID
    });

    if (manpower % 100 !== 0) {
      return res.status(400).json({ error: 'Manpower must be in increments of 100.' });
    }
    
    const pool = req.app.get('dbpool');
    const poolReq = pool.request();
    poolReq.input('UnitTypeID', sql.Int, unitTypeID);
    // Use the provided values directly
    poolReq.input('OwnerCharacterID', sql.Int, ownerCharacterID);
    poolReq.input('CommanderID', sql.Int, commanderID);
    poolReq.input('AdminCreated', sql.Bit, 1);
    poolReq.input('UnitName', sql.NVarChar(50), unitName);
    poolReq.input('Manpower', sql.Int, manpower);
    poolReq.input('ShipCount', sql.Int, shipCount);
    poolReq.input('CurrentMapID', sql.Int, 1);
    poolReq.input('col', sql.Int, col);
    poolReq.input('row', sql.Int, row);
    poolReq.input('HomeHoldingID', sql.Int, homeHoldingID || null);
    
    const result = await poolReq.query(`
      INSERT INTO dbo.Units (
        UnitTypeID, OwnerCharacterID, CommanderID, AdminCreated, UnitName, Manpower, ShipCount,
        CurrentMapID, DestinationMapID,
        Waypoint1MapID, Waypoint2MapID, Waypoint3MapID, Waypoint4MapID, Waypoint5MapID,
        Waypoint6MapID, Waypoint7MapID, Waypoint8MapID, Waypoint9MapID, Waypoint10MapID,
        CycleWaypoints, [col], [row], HomeHoldingID
      )
      OUTPUT INSERTED.*
      VALUES (
        @UnitTypeID, @OwnerCharacterID, @CommanderID, 1, @UnitName, @Manpower, @ShipCount,
        1, NULL,
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL,
        0, @col, @row, @HomeHoldingID
      );
    `);
    console.log("Unit inserted:", result.recordset[0]);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating unit:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
