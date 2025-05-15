// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const session = require('express-session');
const path = require('path');
const { Server } = require('socket.io');

const config = require('./config');
const utils = require('./utils');
const db = require('./db');
const gameLogic = require('./gameLogic');

// Initialize Express app
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysupersecret',
  resave: false,
  saveUninitialized: false
}));

// Admin authentication routes
const slAdminAuthRouter = require('./routes/slAdminAuth');
const adminTokenLoginRouter = require('./routes/adminTokenLogin');
app.use('/sl-admin-auth', slAdminAuthRouter);
app.use('/admin-token-login', adminTokenLoginRouter);

// Mount our API routes
app.use('/api/terrain', require('./routes/terrain'));
app.use('/api/mapcells', require('./routes/mapcells'));
app.use('/api/unittypes', require('./routes/unittypes'));
app.use('/api/units', require('./routes/units'));
app.use('/api/holdings', require('./routes/holdings'));
app.use('/api/houses', require('./routes/houses'));
app.use('/api/regions', require('./routes/regions'));
app.use('/admin-dev-bypass', require('./routes/adminDevBypass'));
app.use('/api/characters', require('./routes/characters'));

// Serve static files from /public
app.use(express.static('public'));

// A simple admin-check middleware for private routes
function checkAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(403).send('Access denied (not admin).');
  }
  next();
}

// Example route for serving the admin panel
app.get('/admin', checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'adminPanel.html'));
});

// Initialize the DB pool and game state
db.initPool()
  .then(async (pool) => {
    app.set('dbpool', pool);
    const terrainInfo = await db.loadTerrainInfo();
    const hexWidth = config.HEX_WIDTH || 25;
    const hexHeight = config.HEX_HEIGHT || 22;
    const totalCols = config.COLS;
    const totalRows = config.ROWS;
    // Ensure the main map exists (the DB generates the MapID if needed)
    const mapId = await db.ensureMainMapExists(
      config.IMAGE_WIDTH,
      config.IMAGE_HEIGHT,
      hexWidth,
      hexHeight,
      totalCols,
      totalRows
    );
    // Sync and load the map cells for the generated MapID
    await db.syncMapCells(mapId, totalRows, totalCols);
    const mapData = await db.loadMapCellsFromDB(mapId, totalRows, totalCols);
    gameLogic.init({ terrainInfo, mapData });
    // Attach the actual mapId to gameLogic for later use.
    gameLogic.mapId = mapId;
    console.log('Game state initialized with MapID:', mapId);
  })
  .catch(err => {
    console.error('DB connection error:', err);
  });

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// Initialize Socket.IO handler (see socketHandler.js)
require('./socketHandler')(io, gameLogic, { config, utils });

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Grid: COLS=${config.COLS}, ROWS=${config.ROWS}`);
});
