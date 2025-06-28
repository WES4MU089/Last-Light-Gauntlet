/* eslint-disable no-console */
// public/js/adminClient.js

import { store } from './store.js';
import { initRenderer, scheduleRenderScene } from './mapRenderer.js';
import { initTerrainTools, loadTerrainList } from './terrainTools.js';
import { initUnitTools, loadAllUnits } from './unitTools.js';
import { initSocket } from './socketHandlers.js';
import { initHoldingTools, loadAllHoldings } from './holdingTools.js';
import { initRegionTools } from './regionTools.js';
import { initHouseTools } from './houseTools.js';
import { initCharacterTools } from './characterTools.js';
import { pixelToHex } from './geometry.js';
import { paintCellsBrush, floodFillHex, resetPaintThrottle } from './paintTools.js';
import { setPath } from './socketHandlers.js';

/* ------------------------------------------------------------------ */
/* simple loader helpers                                              */
/* ------------------------------------------------------------------ */
const loaderEl = document.getElementById('loadingOverlay');
function showLoader() { loaderEl?.classList.remove('hidden'); }
function hideLoader() { loaderEl?.classList.add('hidden'); }

/* ------------------------------------------------------------------ */
/* page bootstrap                                                     */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('gameCanvas');
  showLoader();

  /* -------- preload map images -------- */
  const mapImg       = new Image();
  const territoryImg = new Image();
  mapImg.src         = 'map.png';
  territoryImg.src   = 'territoryMap.png';

  await new Promise(res => {
    if (mapImg.complete && mapImg.naturalWidth) return res();
    mapImg.onload  = res;
    mapImg.onerror = () => { alert('Failed to load map.png'); res(); };
  });

  /* -------- init renderer first (creates canvas layers) -------- */
  initRenderer(canvas, mapImg, territoryImg);

  /* -------- always pull fresh data from DB on every page load --- */
  try {
    /* 1️⃣ terrain types first (colour lookup depends on this) */
    await loadTerrainList(); // internally uses cache:'no-store'

    /* 2️⃣ map grid */
    const mapRes = await fetch('/api/mapcells/1', { cache: 'no-store' });
    const { mapData, mapId } = await mapRes.json();
    store.setMapData(mapData);
    store.currentMapId = mapId;

    /* 3️⃣ supporting tables */
    const houses = await fetch('/api/houses', { cache: 'no-store' }).then(r => r.json());
    store.setHouses(houses);

    await Promise.all([
      loadAllUnits(),
      loadAllHoldings()
    ]);

    /* first draw with everything present */
    scheduleRenderScene();
  } catch (err) {
    console.error('[INIT] Failed to load core data:', err);
    alert('Failed to load initial game data.');
    hideLoader();
    return;
  }

  /* -------- bind dev / GM tools & socket ----------------------- */
  initSocket();
  initTerrainTools();
  initUnitTools();
  initHoldingTools();
  initRegionTools();
  initHouseTools();
  initCharacterTools();

  /* hide loader once the first render has painted */
  requestAnimationFrame(() => requestAnimationFrame(hideLoader));

  /* -------- UI toggles ----------------------------------------- */
  document.getElementById('chkTerritoryView')?.addEventListener('change', e => {
    store.views.territory = e.target.checked;
    scheduleRenderScene();
  });

  const chkOverlay = document.getElementById('chkShowTerrainOverlays');
  if (chkOverlay) {
    chkOverlay.checked = store.views.showTerrainOverlays;
    chkOverlay.addEventListener('change', e => {
      store.views.showTerrainOverlays = e.target.checked;
      scheduleRenderScene();
    });
  }

  /* -------- canvas interaction handlers ------------------------ */
  setupCanvasInteractions(canvas);
});

/* ------------------------------------------------------------------ */
/* canvas input                                                       */
/* ------------------------------------------------------------------ */
let isPanning  = false;
let panStartX  = 0, panStartY = 0;
let camStartX  = 0, camStartY = 0;
let isPainting = false;

function setupCanvasInteractions(canvas) {
  canvas.addEventListener('wheel',       onWheel,      { passive:false });
  canvas.addEventListener('mousedown',   onMouseDown);
  canvas.addEventListener('mousemove',   onMouseMove);
  canvas.addEventListener('mouseup',     onMouseUp);
  canvas.addEventListener('mouseleave',  () => {
    document.getElementById('tileTooltip').style.display = 'none';
    isPainting = false;
    resetPaintThrottle();
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function onWheel(evt) {
  evt.preventDefault();
  const { camera } = store;
  const rect = evt.currentTarget.getBoundingClientRect();
  const mx = evt.clientX - rect.left;
  const my = evt.clientY - rect.top;
  const wx = (mx - camera.x) / camera.scale;
  const wy = (my - camera.y) / camera.scale;
  const factor = evt.deltaY < 0 ? 1.1 : 1 / 1.1;
  camera.scale = Math.max(0.25, Math.min(4, camera.scale * factor));
  camera.x -= (wx * camera.scale + camera.x) - mx;
  camera.y -= (wy * camera.scale + camera.y) - my;
  scheduleRenderScene();
}

function onMouseDown(evt) {
  const ignored = ['createRegion','editRegion','createHouse','editHouse','editHolding'];
  if (ignored.includes(store.currentTool)) return;

  if (evt.button === 1) { /* middle-click pan */
    evt.preventDefault();
    isPanning = true;
    panStartX = evt.clientX;
    panStartY = evt.clientY;
    camStartX = store.camera.x;
    camStartY = store.camera.y;
    return;
  }

  const { wx, wy } = screenToWorld(evt);
  if (evt.button === 0) {
    if (store.currentTool === 'paintTerrain' && store.selectedTerrainId) {
      const [c,r] = pixelToHex(wx, wy);
      if (store.floodFillEnabled)  floodFillHex(c, r, +store.selectedTerrainId);
      else {
        isPainting = true;
        paintCellsBrush(wx, wy);
      }
    } else {
      const [c,r] = pixelToHex(wx, wy);
      setPath(c, r);
    }
  }
}

function onMouseMove(evt) {
  const { wx, wy } = screenToWorld(evt);

  if (isPanning) {
    store.camera.x = camStartX + (evt.clientX - panStartX);
    store.camera.y = camStartY + (evt.clientY - panStartY);
    scheduleRenderScene();
    return;
  }

  if (isPainting && store.currentTool === 'paintTerrain' && store.selectedTerrainId) {
    paintCellsBrush(wx, wy);
    return;
  }

  const [c,r] = pixelToHex(wx, wy);
  const tip = document.getElementById('tileTooltip');
  if (tip) {
    tip.style.left = `${evt.clientX + 12}px`;
    tip.style.top  = `${evt.clientY + 12}px`;
    tip.textContent = `Col: ${c}, Row: ${r}`;
    tip.style.display = 'block';
  }
}

function onMouseUp(evt) {
  if (evt.button === 1)  isPanning  = false;
  if (evt.button === 0) { isPainting = false; resetPaintThrottle(); }
}

function screenToWorld(evt) {
  const rect = evt.currentTarget.getBoundingClientRect();
  const sx = evt.clientX - rect.left;
  const sy = evt.clientY - rect.top;
  return {
    wx: (sx - store.camera.x) / store.camera.scale,
    wy: (sy - store.camera.y) / store.camera.scale
  };
}
