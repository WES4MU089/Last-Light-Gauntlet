// routes/holdings.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Middleware to check if user is admin
function checkAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(403).send('Access denied (not admin).');
  }
  next();
}

/**
 * GET /api/holdings
 * Returns all Holdings with columns for tier/resources.
 */
router.get('/', checkAdmin, async (req, res) => {
  try {
    const pool = req.app.get('dbpool');
    const result = await pool.request().query(`
      SELECT
        h.HoldingID,
        h.MapID,
        h.HoldingName,
        h.HouseID,
        h.AllianceID,
        h.DefensiveNodes,
        h.col,
        h.row,
        h.RulingCharacterID,
        h.Region,
        h.ImagePath,
        -- Tier/resource columns
        h.SettlementTier,
        h.DefenseTier,
        h.PrimaryResourceID,
        h.SecondaryResourceID,
        -- Example joins for HouseName, CharacterName
        hh.HouseName,
        c.[Name] AS RulingCharacterName
      FROM dbo.Holdings h
      LEFT JOIN dbo.Houses hh ON h.HouseID = hh.HouseID
      LEFT JOIN dbo.Characters c ON h.RulingCharacterID = c.CharacterID
      ORDER BY h.HoldingID;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching holdings:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/holdings
 * Creates a new holding, then adds 25% capacity rows in HoldingResources.
 * Additionally, if a RulingCharacterID is provided, update the Characters table
 * so that the character's Holding field is set to the new HoldingID.
 */
router.post('/', checkAdmin, async (req, res) => {
  try {
    const {
      mapID,
      holdingName,
      col,
      row,
      houseID,
      allianceID,
      regionID,
      rulingCharacterID,
      imagePath,
      defensiveNodes,   // optional/legacy
      settlementTier,   // 1..5
      defenseTier,      // 1..5
      primaryResourceID,// must match a valid ResourceID
      secondaryResourceID
    } = req.body;

    const pool = req.app.get('dbpool');

    // 1) Insert the Holding
    const insertRequest = pool.request();
    insertRequest.input('MapID',              sql.Int,           mapID || 1);
    insertRequest.input('HoldingName',        sql.NVarChar(100), holdingName);
    insertRequest.input('HouseID',            sql.Int,           houseID || null);
    insertRequest.input('AllianceID',         sql.Int,           allianceID || null);
    insertRequest.input('DefensiveNodes',     sql.Int,           defensiveNodes || 0);
    insertRequest.input('col',                sql.Int,           col);
    insertRequest.input('row',                sql.Int,           row);
    insertRequest.input('RulingCharacterID',  sql.Int,           rulingCharacterID || null);
    insertRequest.input('RegionID',           sql.Int,           regionID || null);
    insertRequest.input('ImagePath',          sql.NVarChar(255), imagePath || null);
    insertRequest.input('SettlementTier',     sql.Int, settlementTier || 1);
    insertRequest.input('DefenseTier',        sql.Int, defenseTier    || 1);
    insertRequest.input('PrimaryResourceID',  sql.Int, primaryResourceID || null);
    insertRequest.input('SecondaryResourceID',sql.Int, secondaryResourceID || null);

    const insertResult = await insertRequest.query(`
      INSERT INTO dbo.Holdings
      (
        MapID, HoldingName, HouseID, AllianceID, DefensiveNodes,
        [col], [row], RulingCharacterID, [Region], ImagePath,
        SettlementTier, DefenseTier, PrimaryResourceID, SecondaryResourceID
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @MapID, @HoldingName, @HouseID, @AllianceID, @DefensiveNodes,
        @col, @row, @RulingCharacterID, @RegionID, @ImagePath,
        @SettlementTier, @DefenseTier, @PrimaryResourceID, @SecondaryResourceID
      );
    `);

    if (insertResult.recordset.length === 0) {
      return res.status(500).json({ error: 'Failed to insert holding (no record returned).' });
    }

    const newHolding = insertResult.recordset[0];

    // Step 2: Update the Character's Holding field.
    if (newHolding.RulingCharacterID && newHolding.RulingCharacterID !== 0) {
      const updateCharReq = pool.request();
      updateCharReq.input('HoldingID', sql.Int, newHolding.HoldingID);
      updateCharReq.input('CharacterID', sql.Int, newHolding.RulingCharacterID);
      await updateCharReq.query(`
        UPDATE dbo.Characters 
        SET Holding = @HoldingID 
        WHERE CharacterID = @CharacterID;
      `);
    }

    // 3) Lookup base storage from TierBaseOutputs
    const tierReq = pool.request();
    tierReq.input('TierLevel', sql.Int, newHolding.SettlementTier);
    const tierRes = await tierReq.query(`
      SELECT BaseStorage
      FROM dbo.TierBaseOutputs
      WHERE TierLevel = @TierLevel
    `);
    if (tierRes.recordset.length === 0) {
      console.warn(`No TierBaseOutputs found for TierLevel=${newHolding.SettlementTier}`);
      return res.json(newHolding);
    }
    const baseStorage = tierRes.recordset[0].BaseStorage;

    // 4) For each resource (1..4), compute capacity & insert row into HoldingResources
    const resources = [1, 2, 3, 4]; // (Population, Food, Coin, Materials)
    function computeCapacity(resourceID, primaryID, secondaryID) {
      if (resourceID === primaryID) return baseStorage * 3;
      if (resourceID === secondaryID) return baseStorage * 2;
      return baseStorage;
    }
    for (const rID of resources) {
      const cap = computeCapacity(rID, newHolding.PrimaryResourceID, newHolding.SecondaryResourceID);
      const cur = Math.floor(cap * 0.25); // 25%
      const hrReq = pool.request();
      hrReq.input('HoldingID',     sql.Int, newHolding.HoldingID);
      hrReq.input('ResourceID',    sql.Int, rID);
      hrReq.input('CurrentAmount', sql.Int, cur);
      hrReq.input('MaxAmount',     sql.Int, cap);
      await hrReq.query(`
        INSERT INTO dbo.HoldingResources (HoldingID, ResourceID, CurrentAmount, MaxAmount)
        VALUES (@HoldingID, @ResourceID, @CurrentAmount, @MaxAmount);
      `);
    }
    res.json(newHolding);
  } catch (err) {
    console.error('Error creating holding:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/holdings/:id
 * Updates existing holding with same fields as POST and then updates the associated Character record.
 * If a new ruling character is assigned, any character previously assigned that holding is cleared.
 */
router.put('/:id', checkAdmin, async (req, res) => {
  try {
    const holdingID = parseInt(req.params.id, 10);
    if (!holdingID) {
      return res.status(400).json({ error: 'Invalid holding ID' });
    }
    
    const pool = req.app.get('dbpool');
    // Retrieve the current holding to determine the existing ruling character.
    const selectReq = pool.request();
    selectReq.input('HoldingID', sql.Int, holdingID);
    const selectRes = await selectReq.query(`SELECT RulingCharacterID FROM dbo.Holdings WHERE HoldingID = @HoldingID`);
    if (selectRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Holding not found' });
    }
    const oldRulingCharacterID = selectRes.recordset[0].RulingCharacterID;

    const {
      mapID,
      holdingName,
      // col, row are intentionally ignored here
      houseID,
      allianceID,
      regionID,
      rulingCharacterID,
      imagePath,
      defensiveNodes,
      settlementTier,
      defenseTier,
      primaryResourceID,
      secondaryResourceID
    } = req.body;

    const request = pool.request();
    request.input('HoldingID',          sql.Int,           holdingID);
    request.input('MapID',              sql.Int,           mapID || 1);
    request.input('HoldingName',        sql.NVarChar(100), holdingName);
    request.input('HouseID',            sql.Int,           houseID || null);
    request.input('AllianceID',         sql.Int,           allianceID || null);
    request.input('DefensiveNodes',     sql.Int,           defensiveNodes || 0);
    request.input('RulingCharacterID',  sql.Int,           rulingCharacterID || null);
    request.input('RegionID',           sql.Int,           regionID || null);
    request.input('ImagePath',          sql.NVarChar(255), imagePath || null);
    request.input('SettlementTier',     sql.Int, settlementTier || 1);
    request.input('DefenseTier',        sql.Int, defenseTier    || 1);
    request.input('PrimaryResourceID',  sql.Int, primaryResourceID || null);
    request.input('SecondaryResourceID',sql.Int, secondaryResourceID || null);

    const updateResult = await request.query(`
      UPDATE dbo.Holdings
      SET
        MapID = @MapID,
        HoldingName = @HoldingName,
        HouseID = @HouseID,
        AllianceID = @AllianceID,
        DefensiveNodes = @DefensiveNodes,
        RulingCharacterID = @RulingCharacterID,
        [Region] = @RegionID,
        ImagePath = @ImagePath,
        SettlementTier = @SettlementTier,
        DefenseTier = @DefenseTier,
        PrimaryResourceID = @PrimaryResourceID,
        SecondaryResourceID = @SecondaryResourceID
      OUTPUT INSERTED.*
      WHERE HoldingID = @HoldingID;
    `);

    if (updateResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    const updatedHolding = updateResult.recordset[0];

    // If a new ruling character is provided and it's different from the old one,
    // then clear the old assignment and update the new one.
    if (rulingCharacterID && rulingCharacterID !== 0) {
      if (oldRulingCharacterID && oldRulingCharacterID !== rulingCharacterID) {
        // Clear the old character's assignment.
        const clearOldReq = pool.request();
        clearOldReq.input('HoldingID', sql.Int, holdingID);
        await clearOldReq.query(`
          UPDATE dbo.Characters
          SET Holding = NULL
          WHERE Holding = @HoldingID;
        `);
      }
      // Assign the new character.
      const updateCharReq = pool.request();
      updateCharReq.input('HoldingID', sql.Int, holdingID);
      updateCharReq.input('CharacterID', sql.Int, rulingCharacterID);
      await updateCharReq.query(`
        UPDATE dbo.Characters 
        SET Holding = @HoldingID 
        WHERE CharacterID = @CharacterID;
      `);
    } else {
      // If no ruling character is provided, clear any character with this holding.
      const clearCharReq = pool.request();
      clearCharReq.input('HoldingID', sql.Int, holdingID);
      await clearCharReq.query(`
        UPDATE dbo.Characters 
        SET Holding = NULL 
        WHERE Holding = @HoldingID;
      `);
    }

    res.json(updatedHolding);
  } catch (err) {
    console.error('Error updating holding:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/holdings/:id
 * Removes an existing holding, returning the deleted record if found.
 */
router.delete('/:id', checkAdmin, async (req, res) => {
  try {
    const holdingID = parseInt(req.params.id, 10);
    if (!holdingID) {
      return res.status(400).json({ error: 'Invalid holding ID' });
    }
    const pool = req.app.get('dbpool');
    const request = pool.request();
    request.input('HoldingID', sql.Int, holdingID);
    const delResult = await request.query(`
      DELETE FROM dbo.Holdings
      OUTPUT DELETED.*
      WHERE HoldingID = @HoldingID;
    `);
    if (delResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Holding not found or already deleted' });
    }
    res.json(delResult.recordset[0]);
  } catch (err) {
    console.error('Error deleting holding:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
