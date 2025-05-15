// js/adminClient.js
import { store } from './store.js';
import { initRenderer, renderScene } from './mapRenderer.js';
import { initTerrainTools, loadTerrainList } from './terrainTools.js';
import { initUnitTools, loadAllUnits } from './unitTools.js';
import { initSocket, setPath } from './socketHandlers.js';
import { initHoldingTools, createHoldingOnServer, loadAllHoldings } from './holdingTools.js';
import { pixelToHex } from './geometry.js';
import { paintCellsBrush, floodFillHex } from './paintTools.js';
import { initRegionTools } from './regionTools.js';
import { initHouseTools } from './houseTools.js';
import { initCharacterTools } from './characterTools.js';

let territoryMapImg = null;

// Main entry point
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');

  // Load the normal map
  const mapImg = new Image();
  mapImg.src = 'map.png';

  // Load the territory map
  territoryMapImg = new Image();
  territoryMapImg.src = 'territoryMap.png';

  // Initialize renderer with both images
  initRenderer(canvas, mapImg, territoryMapImg);
  
  // Initialize socket connection
  initSocket();
  
  // NEW: Listen for the 'initState' event to capture the dynamic mapId
  // (Assumes that your socketHandlers.js emits initState with { mapData, mapId }.)
  if (window.socket) {
    window.socket.on('initState', (data) => {
      store.mapData = data.mapData;
      store.currentMapId = data.mapId; // Save the actual map ID for later use by paint tools
      renderScene();
    });
  }
  
  // Initialize tool modules
  initTerrainTools();
  initUnitTools();
  initHoldingTools();
  initRegionTools();
  initHouseTools();
  initCharacterTools();

  // 1) Load houses first => store.houses
  fetch('/api/houses')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch houses, code=${res.status}`);
      return res.json();
    })
    .then(houseList => {
      store.houses = houseList;
      console.log('Houses =>', houseList);
      // 2) Now load terrain, units, holdings in parallel or sequence
      return Promise.all([
        loadTerrainList(),
        loadAllUnits(),
        loadAllHoldings()
      ]);
    })
    .then(() => {
      // Everything loaded, do final render
      renderScene();
    })
    .catch(err => {
      console.error('Error fetching houses or other data:', err);
    });

  // Setup canvas interactions
  setupCanvasInteractions(canvas);

  // Wire up the "Territory" checkbox
  const chkTerritory = document.getElementById('chkTerritoryView');
  if (chkTerritory) {
    chkTerritory.addEventListener('change', (evt) => {
      store.views.territory = evt.target.checked;
      renderScene();
    });
  }
});

/**
 * Canvas interactions: panning, painting, BFS path, placing units/holdings, etc.
 */
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let camStartX = 0;
let camStartY = 0;
let isPainting = false;

function setupCanvasInteractions(canvas) {
  canvas.addEventListener('wheel', onCanvasWheel);
  canvas.addEventListener('mousedown', onCanvasMouseDown);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
  canvas.addEventListener('mouseup', onCanvasMouseUp);
  canvas.addEventListener('mouseleave', () => {
    const tileTooltip = document.getElementById('tileTooltip');
    tileTooltip.style.display = 'none';
  });
  canvas.addEventListener('contextmenu', evt => evt.preventDefault());
}

function onCanvasWheel(evt) {
  evt.preventDefault();
  const { camera } = store;
  const rect = evt.currentTarget.getBoundingClientRect();
  const mx = evt.clientX - rect.left;
  const my = evt.clientY - rect.top;
  const wx = (mx - camera.x) / camera.scale;
  const wy = (my - camera.y) / camera.scale;
  const zoomFactor = 1.1;
  if (evt.deltaY < 0) camera.scale *= zoomFactor;
  else camera.scale /= zoomFactor;
  camera.scale = Math.max(0.25, Math.min(4.0, camera.scale));
  const newSx = wx * camera.scale + camera.x;
  const newSy = wy * camera.scale + camera.y;
  camera.x -= (newSx - mx);
  camera.y -= (newSy - my);
  renderScene();
}

function onCanvasMouseDown(evt) {
  const ignoreTools = [
    'createRegion', 'editRegion',
    'createHouse',  'editHouse',
    'editHolding'
  ];
  if (ignoreTools.includes(store.currentTool)) return;

  if (evt.button === 1) {
    evt.preventDefault();
    isPanning = true;
    panStartX = evt.clientX;
    panStartY = evt.clientY;
    camStartX = store.camera.x;
    camStartY = store.camera.y;
    return;
  }
  if (evt.button === 0) {
    if (store.currentTool === 'createHolding' && store.placingHolding && store.pendingHolding) {
      placeHoldingAtClick(evt);
      return;
    }
    if (store.currentTool === 'createUnit' && store.placingUnit && store.pendingUnit) {
      placeUnitAtClick(evt);
      return;
    }
    const rect = evt.currentTarget.getBoundingClientRect();
    const sx = evt.clientX - rect.left;
    const sy = evt.clientY - rect.top;
    const { camera } = store;
    const wx = (sx - camera.x) / camera.scale;
    const wy = (sy - camera.y) / camera.scale;

    if (store.currentTool === 'paintTerrain' && store.selectedTerrainId) {
      if (store.floodFillEnabled) {
        const [col, row] = pixelToHex(wx, wy);
        floodFillHex(col, row, store.selectedTerrainId);
      } else {
        isPainting = true;
        paintCellsBrush(wx, wy);
      }
    } else {
      // BFS path or other default click
      const [c, r] = pixelToHex(wx, wy);
      setPath(c, r);
    }
  }
}

function onCanvasMouseMove(evt) {
  const { camera, mapData } = store;
  if (!mapData) return;
  const rect = evt.currentTarget.getBoundingClientRect();
  const sx = evt.clientX - rect.left;
  const sy = evt.clientY - rect.top;

  if (isPanning) {
    const dx = evt.clientX - panStartX;
    const dy = evt.clientY - panStartY;
    camera.x = camStartX + dx;
    camera.y = camStartY + dy;
    renderScene();
    return;
  }
  if (isPainting && store.currentTool === 'paintTerrain' && store.selectedTerrainId) {
    const wx = (sx - camera.x) / camera.scale;
    const wy = (sy - camera.y) / camera.scale;
    paintCellsBrush(wx, wy);
    return;
  }

  // Show tile coords in tooltip
  const tileTooltip = document.getElementById('tileTooltip');
  const wx = (sx - camera.x) / camera.scale;
  const wy = (sy - camera.y) / camera.scale;
  const [col, row] = pixelToHex(wx, wy);
  tileTooltip.style.left = (evt.clientX + 12) + 'px';
  tileTooltip.style.top = (evt.clientY + 12) + 'px';
  tileTooltip.innerHTML = `Col: ${col}, Row: ${row}`;
  tileTooltip.style.display = 'block';
}

function onCanvasMouseUp(evt) {
  if (evt.button === 1 && isPanning) {
    isPanning = false;
  }
  if (evt.button === 0 && isPainting) {
    isPainting = false;
  }
}

function placeUnitAtClick(evt) {
  evt.preventDefault();
  const rect = evt.currentTarget.getBoundingClientRect();
  const sx = evt.clientX - rect.left;
  const sy = evt.clientY - rect.top;
  const { camera } = store;
  const wx = (sx - camera.x) / camera.scale;
  const wy = (sy - camera.y) / camera.scale;
  const [col, row] = pixelToHex(wx, wy);
  const { unitTypeID, unitName, manpower, shipCount } = store.pendingUnit;

  fetch('/api/units', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitTypeID, unitName, manpower, shipCount, col, row })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error creating unit: ' + data.error);
      } else {
        alert(`Unit created => ${data.UnitName}`);
      }
      return loadAllUnits();
    })
    .catch(err => {
      console.error('Error creating unit:', err);
      alert('Error creating unit (see console).');
    });

  store.placingUnit = false;
  store.pendingUnit = null;
  store.currentTool = null;
}

function placeHoldingAtClick(evt) {
  evt.preventDefault();
  const rect = evt.currentTarget.getBoundingClientRect();
  const sx = evt.clientX - rect.left;
  const sy = evt.clientY - rect.top;
  const { camera } = store;
  const wx = (sx - camera.x) / camera.scale;
  const wy = (sy - camera.y) / camera.scale;
  const [col, row] = pixelToHex(wx, wy);

  createHoldingOnServer(col, row, store.pendingHolding)
    .then(() => {
      alert('Holding created successfully!');
      store.placingHolding = false;
      store.pendingHolding = null;
      store.currentTool = null;
    })
    .catch(err => {
      console.error('Error creating holding:', err);
      alert('Error creating holding (see console).');
    });
}
