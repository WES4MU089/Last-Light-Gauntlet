const express = require('express');
const router = express.Router();
const sql = require('mssql');

// GET /api/attribute-descriptions
router.get('/attribute-descriptions', async (req, res) => {
  try {
    console.log(`[API] Fetching all attribute and skill descriptions`);

    // Fetch attributes with categories
    const attributesResult = await sql.query`
      SELECT CA.CoreAttributeID, CA.Name AS AttributeName, CA.Description AS AttributeDescription,
             C.Name AS CategoryName
      FROM CoreAttributes CA
      JOIN AttributeCategories C ON CA.CategoryID = C.CategoryID
    `;

    // Fetch skills
    const skillsResult = await sql.query`
      SELECT S.SkillID, S.Name AS SkillName, S.Description AS SkillDescription,
             CA.Name AS CoreAttributeName
      FROM Skills S
      JOIN CoreAttributes CA ON S.CoreAttributeID = CA.CoreAttributeID
    `;

    // Structure descriptions
    const descriptions = {};

    // Add attribute descriptions
    attributesResult.recordset.forEach(attr => {
      descriptions[attr.AttributeName] = attr.AttributeDescription;
    });

    // Add skill descriptions
    skillsResult.recordset.forEach(skill => {
      descriptions[skill.SkillName] = skill.SkillDescription;
    });

    if (Object.keys(descriptions).length > 0) {
      console.log(`[API] Found ${Object.keys(descriptions).length} descriptions`);
      res.json(descriptions);
    } else {
      console.warn(`[API] No descriptions found`);
      res.status(404).json({ message: 'No descriptions found.' });
    }
  } catch (err) {
    console.error(`[GET /api/attribute-descriptions] Error:`, err);
    res.status(500).json({ message: 'Error fetching descriptions.' });
  }
});

// GET /api/secondary-attributes
router.get('/secondary-attributes', async (req, res) => {
  try {
    console.log(`[API] Fetching secondary attributes (e.g., Defensive Rating)`);
    // Fetch secondary attributes from the table that stores calculated values.
    const secondaryResult = await sql.query`
      SELECT CSA.CharacterSecondaryAttributeID, CSA.CharacterID, CSA.DefensiveRating
      FROM dbo.CharacterSecondaryAttributes CSA
    `;

    if (secondaryResult.recordset.length > 0) {
      console.log(`[API] Found ${secondaryResult.recordset.length} secondary attributes`);
      res.json(secondaryResult.recordset);
    } else {
      console.warn(`[API] No secondary attributes found`);
      res.status(404).json({ message: 'No secondary attributes found.' });
    }
  } catch (err) {
    console.error(`[GET /api/secondary-attributes] Error:`, err);
    res.status(500).json({ message: 'Error fetching secondary attributes.' });
  }
});

module.exports = router;
