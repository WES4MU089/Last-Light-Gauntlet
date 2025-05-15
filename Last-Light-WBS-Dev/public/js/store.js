export const store = {
  // Socket reference (set in socketHandlers)
  socket: null,

  // Map data from the server: 2D array representing terrain cells
  mapData: null,

  // BFS test unit from the server (if you still want it)
  unit: null,

  // List of all terrain types from /api/terrain
  terrainList: [],

  // All "real" units from /api/units
  units: [],

  // All holdings from /api/holdings
  holdings: [],

  // All houses from /api/houses
  houses: [],

  // All characters (needed for unit color lookups)
  characters: [],

  // All regions (needed for unit color lookups)
  regions: [],

  // Basic camera for panning & zooming
  camera: {
    x: 0,
    y: 0,
    scale: 1.0
  },

  // Tools/current mode
  currentTool: null,        // e.g. 'paintTerrain', 'createUnit', etc.
  selectedTerrainId: null,  // which terrain ID is chosen for painting
  brushSize: 0,             // radius in hex cells
  floodFillEnabled: false,  // whether flood-fill is used when painting

  // For placing a new unit
  pendingUnit: null,
  placingUnit: false,

  // For placing a new holding
  pendingHolding: null,
  placingHolding: false,

  // Views object to handle different layers/overlays (like territory map)
  views: {
    territory: false
  }
};
