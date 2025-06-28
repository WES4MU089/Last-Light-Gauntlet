/********************************************************************************************
-- script-populate-houses-and-regions.sql
-- Inserts Westeros regions, banner houses, and assigns ruling houses
-- Dependencies: Empty dbo.Regions and dbo.Houses in Last-Light-DB
********************************************************************************************/

USE [Last-Light-DB];
GO

-- SECTION 1: Regions
INSERT INTO dbo.Regions (RegionName, regionColor, rulingHouse)
VALUES
    (N'The North',        NULL, NULL),
    (N'The Vale',         NULL, NULL),
    (N'The Riverlands',   NULL, NULL),
    (N'The Westerlands',  NULL, NULL),
    (N'The Stormlands',   NULL, NULL),
    (N'The Reach',        NULL, NULL),
    (N'Dorne',            NULL, NULL),
    (N'The Iron Islands', NULL, NULL),
    (N'The Crownlands',   NULL, NULL);
GO

-- SECTION 2: Houses
INSERT INTO dbo.Houses (HouseName, AllianceID, HoH, HouseColor, Region)
VALUES
    -- Region 1: The North
    ('Stark',    NULL, NULL, '#EEEEEE', 1),
    ('Umber',    NULL, NULL, '#556B2F', 1),
    ('Karstark', NULL, NULL, '#000000', 1),
    ('Manderly', NULL, NULL, '#228B22', 1),
    ('Cerwyn',   NULL, NULL, '#8B4513', 1),
    ('Glover',   NULL, NULL, '#4169E1', 1),
    ('Mormont',  NULL, NULL, '#2F4F4F', 1),
    ('Dustin',   NULL, NULL, '#A0522D', 1),
    ('Hornwood', NULL, NULL, '#556B2F', 1),
    ('Tallhart', NULL, NULL, '#8B0000', 1),
    ('Reed',     NULL, NULL, '#2E8B57', 1),
    
    -- Region 2: The Vale
    ('Arryn',     NULL, NULL, '#1E90FF', 2),
    ('Royce',     NULL, NULL, '#FFD700', 2),
    ('Corbray',   NULL, NULL, '#DC143C', 2),
    ('Hunter',    NULL, NULL, '#228B22', 2),
    ('Waynwood',  NULL, NULL, '#8B0000', 2),
    ('Templeton', NULL, NULL, '#483D8B', 2),
    ('Coldwater', NULL, NULL, '#4682B4', 2),
    ('Tollett',   NULL, NULL, '#808080', 2),
    ('Lynderly',  NULL, NULL, '#DAA520', 2),
    ('Redfort',   NULL, NULL, '#8B0000', 2),
    ('Hunter',    NULL, NULL, '#228B22', 2),
    
    -- Region 3: The Riverlands
    ('Tully',      NULL, NULL, '#0000FF', 3),
    ('Frey',       NULL, NULL, '#696969', 3),
    ('Blackwood',  NULL, NULL, '#006400', 3),
    ('Bracken',    NULL, NULL, '#8A2BE2', 3),
    ('Darry',      NULL, NULL, '#DC143C', 3),
    ('Haigh',      NULL, NULL, '#228B22', 3),
    ('Mallister',  NULL, NULL, '#800000', 3),
    ('Mooton',     NULL, NULL, '#FF4500', 3),
    ('Riverrun',   NULL, NULL, '#A52A2A', 3),
    ('Shett',      NULL, NULL, '#2F4F4F', 3),
    ('Whent',      NULL, NULL, '#D2691E', 3),
    
    -- Region 4: The Westerlands
    ('Lannister', NULL, NULL, '#FFD700', 4),
    ('Reyne',     NULL, NULL, '#8B0000', 4),
    ('Tarbeck',   NULL, NULL, '#DAA520', 4),
    ('Marbrand',  NULL, NULL, '#000000', 4),
    ('Crakehall', NULL, NULL, '#8B4513', 4),
    ('Banefort',  NULL, NULL, '#008080', 4),
    ('Brax',      NULL, NULL, '#800080', 4),
    ('Clegane',   NULL, NULL, '#A9A9A9', 4),
    ('Serrett',   NULL, NULL, '#B22222', 4),
    ('Westerling',NULL, NULL, '#4682B4', 4),
    ('Tarbeck',   NULL, NULL, '#DAA520', 4),
    
    -- Region 5: The Stormlands
    ('Baratheon', NULL, NULL, '#000000', 5),
    ('Dondarrion',NULL, NULL, '#FF0000', 5),
    ('Selmy',     NULL, NULL, '#FFFFFF', 5),
    ('Tarth',     NULL, NULL, '#0000FF', 5),
    ('Caron',     NULL, NULL, '#DC143C', 5),
    ('Errol',     NULL, NULL, '#228B22', 5),
    ('Grandison', NULL, NULL, '#B8860B', 5),
    ('Staunton',  NULL, NULL, '#8B4513', 5),
    ('Swann',     NULL, NULL, '#00008B', 5),
    ('Trant',     NULL, NULL, '#A52A2A', 5),
    ('Wensington',NULL, NULL, '#FF8C00', 5),
    
    -- Region 6: The Reach
    ('Tyrell',      NULL, NULL, '#228B22', 6),
    ('Hightower',   NULL, NULL, '#FFFFFF', 6),
    ('Rowan',       NULL, NULL, '#FF4500', 6),
    ('Redwyne',     NULL, NULL, '#800080', 6),
    ('Tarly',       NULL, NULL, '#006400', 6),
    ('Oakheart',    NULL, NULL, '#DAA520', 6),
    ('Peake',       NULL, NULL, '#00008B', 6),
    ('Florent',     NULL, NULL, '#FF0000', 6),
    ('Fossoway',    NULL, NULL, '#008000', 6),
    ('Chelsted',    NULL, NULL, '#FFA500', 6),
    ('Crane',       NULL, NULL, '#000000', 6),
    
    -- Region 7: Dorne
    ('Martell',   NULL, NULL, '#FF4500', 7),
    ('Yronwood',  NULL, NULL, '#FFD700', 7),
    ('Qorgyle',   NULL, NULL, '#8B4513', 7),
    ('Fowler',    NULL, NULL, '#A0522D', 7),
    ('Santagar',  NULL, NULL, '#DC143C', 7),
    ('Manwoody',  NULL, NULL, '#800000', 7),
    ('Uller',     NULL, NULL, '#228B22', 7),
    ('Dayne',     NULL, NULL, '#708090', 7),
    ('Blackmont', NULL, NULL, '#000000', 7),
    ('Allyrion',  NULL, NULL, '#B22222', 7),
    ('Vaith',     NULL, NULL, '#FF4500', 7),
    
    -- Region 8: The Iron Islands
    ('Greyjoy',      NULL, NULL, '#2F4F4F', 8),
    ('Goodbrother',  NULL, NULL, '#654321', 8),
    ('Harlaw',       NULL, NULL, '#000000', 8),
    ('Merlyn',       NULL, NULL, '#8B008B', 8),
    ('Sparr',        NULL, NULL, '#A9A9A9', 8),
    ('Stonesinger',  NULL, NULL, '#800000', 8),
    ('Farwynd',      NULL, NULL, '#2F4F4F', 8),
    ('Blacktyde',    NULL, NULL, '#00008B', 8),
    ('Drumm',        NULL, NULL, '#DAA520', 8),
    ('Orkwood',      NULL, NULL, '#556B2F', 8),
    ('Stonetree',    NULL,	NULL, '#008080', 8),
    
    -- Region 9: The Crownlands
    ('Targaryen',  NULL, NULL, '#FF0000', 9),
    ('Baratheon',  NULL, NULL, '#000000', 9),
    ('Velaryon',   NULL, NULL, '#4169E1', 9),
    ('Celtigar',   NULL, NULL, '#FFD700', 9),
    ('Estermont',  NULL, NULL, '#008000', 9),
    ('Staedmon',   NULL, NULL, '#800080', 9),
    ('Stokeworth', NULL, NULL, '#808080', 9),
    ('Durwell',    NULL, NULL, '#4682B4', 9),
    ('Vance',      NULL, NULL, '#B22222', 9),
    ('Bracken',    NULL, NULL, '#8B4513', 9),
    ('Merryweather',NULL,	NULL, '#DAA520', 9);
GO

-- SECTION 3: Assign rulingHouse
UPDATE R
SET R.rulingHouse = H.HouseID
FROM dbo.Regions AS R
JOIN dbo.Houses AS H
  ON 
    (R.RegionName = N'The North'        AND H.HouseName = N'Stark')
 OR (R.RegionName = N'The Vale'         AND H.HouseName = N'Arryn')
 OR (R.RegionName = N'The Riverlands'   AND H.HouseName = N'Tully')
 OR (R.RegionName = N'The Westerlands'  AND H.HouseName = N'Lannister')
 OR (R.RegionName = N'The Stormlands'   AND H.HouseName = N'Baratheon')
 OR (R.RegionName = N'The Reach'        AND H.HouseName = N'Tyrell')
 OR (R.RegionName = N'Dorne'            AND H.HouseName = N'Martell')
 OR (R.RegionName = N'The Iron Islands' AND H.HouseName = N'Greyjoy')
 OR (R.RegionName = N'The Crownlands'   AND H.HouseName = N'Targaryen');
GO

-- SECTION 4: Verification
SELECT R.RegionID, R.RegionName, H.HouseName AS RulingHouse
FROM dbo.Regions R
LEFT JOIN dbo.Houses H ON R.rulingHouse = H.HouseID;

SELECT H.HouseID, H.HouseName, R.RegionName
FROM dbo.Houses H
LEFT JOIN dbo.Regions R ON H.Region = R.RegionID;
GO
