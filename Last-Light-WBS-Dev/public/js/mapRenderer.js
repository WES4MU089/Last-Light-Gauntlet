// js/mapRenderer.js
import { store } from './store.js';
import { hexToPixel, HEX_WIDTH, HEX_HEIGHT } from './geometry.js';

let canvas, ctx;
let mapImage = null;
let territoryMapImage = null;
let baseImage = null;

const unitImageCache = {};
const holdingImageCache = {};
const tintedCache = {};

const BASE_UNIT_SIZE = 25;
const BASE_HOLDING_SIZE = 25;

let renderScheduled = false;

// ---------- Core Rendering Cycle ----------

export function scheduleRenderScene() {
  if (!renderScheduled) {
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      renderScene();
    });
  }
}

export function initRenderer(canvasEl, mapImg, territoryImg) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');

  mapImage = mapImg;
  territoryMapImage = territoryImg;

  resizeCanvas();

  if (mapImage && !mapImage.complete) {
    mapImage.onload = () => {
      resizeCanvas();
      fitToBounds();
      scheduleRenderScene();
    };
  } else if (mapImage?.complete) {
    fitToBounds();
  }

  if (territoryMapImage && !territoryMapImage.complete) {
    territoryMapImage.onload = () => {
      scheduleRenderScene();
    };
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    scheduleRenderScene();
  });

  baseImage = new Image();
  baseImage.src = '/img/wbs/base.png';
  baseImage.onload = scheduleRenderScene;

  ['regionBanner','houseBanner'].forEach(key => {
    const img = new Image();
    img.src = `/images/units/${key}.png`;
    unitImageCache[key] = img;
  });

  if (typeof store.subscribe === 'function') {
    store.subscribe(() => { scheduleRenderScene(); });
  }
}

// ---------- Camera Fit ----------

function fitToBounds() {
  if (!canvas || !mapImage || !mapImage.complete) return;
  const rect = canvas.getBoundingClientRect();
  const mw = mapImage.naturalWidth;
  const mh = mapImage.naturalHeight;
  const offsetX = (rect.width - mw) / 2;
  const offsetY = (rect.height - mh) / 2;
  store.camera = { x: offsetX, y: offsetY, scale: 1 };
}

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

// ---------- Scene Rendering ----------

export function renderScene() {
  if (!ctx || !mapImage) return;
  const { x = 0, y = 0, scale = 1 } = store.camera || {};

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Draw main map image at 1:1 pixel resolution
  const baseMap = (store.views?.territory && territoryMapImage?.complete)
    ? territoryMapImage
    : (mapImage?.complete ? mapImage : null);

  if (baseMap) ctx.drawImage(baseMap, 0, 0);

  // Draw hex grid overlays
  if (baseMap) drawGrid(ctx, baseMap);

  // Terrain overlays
  if (store.views?.showTerrainOverlays && Array.isArray(store.mapData) && Array.isArray(store.terrainList)) {
    const lookup = Object.fromEntries(store.terrainList.map(t => [Number(t.terrain_id), t]));
    store.mapData.forEach((row, r) => {
      if (!Array.isArray(row)) return;
      row.forEach((cell, c) => {
        const terr = lookup[Number(cell)];
        const [cx, cy] = hexToPixel(c, r);
        const fill = terr ? hexToRgba(terr.color, 0.5) : 'rgba(0,0,0,0)';
        drawHex(ctx, cx, cy, fill, 'rgba(0,0,0,0.2)');
      });
    });
  }

  // Draw dynamic overlays
  drawBfsUnit();
  drawAllUnits();
  drawAllHoldings();

  ctx.restore();
}

// ---------- Grid and Hex Utilities ----------

function drawGrid(ctx2, img) {
  const hStep = HEX_WIDTH * 0.75;
  const vStep = HEX_HEIGHT;
  const cols  = Math.ceil(img.naturalWidth  / hStep) + 1;
  const rows  = Math.ceil(img.naturalHeight / vStep) + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [cx, cy] = hexToPixel(c, r);
      if (cx < -HEX_WIDTH || cy < -HEX_HEIGHT || cx > img.naturalWidth + HEX_WIDTH || cy > img.naturalHeight + HEX_HEIGHT) continue;
      drawHex(ctx2, cx, cy, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.2)');
    }
  }
}

function drawHex(ctx2, cx, cy, fill, stroke) {
  const pts = [
    { x: cx - HEX_WIDTH / 2, y: cy },
    { x: cx - HEX_WIDTH / 4, y: cy - HEX_HEIGHT / 2 },
    { x: cx + HEX_WIDTH / 4, y: cy - HEX_HEIGHT / 2 },
    { x: cx + HEX_WIDTH / 2, y: cy },
    { x: cx + HEX_WIDTH / 4, y: cy + HEX_HEIGHT / 2 },
    { x: cx - HEX_WIDTH / 4, y: cy + HEX_HEIGHT / 2 }
  ];
  ctx2.beginPath();
  pts.forEach((p, i) => i ? ctx2.lineTo(p.x, p.y) : ctx2.moveTo(p.x, p.y));
  ctx2.closePath();
  ctx2.fillStyle = fill; ctx2.fill();
  ctx2.strokeStyle = stroke; ctx2.lineWidth = 1; ctx2.stroke();
}

function hexToRgba(hex, a) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(255,255,255,${a})`;
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function getHouseColor(id) {
  return store.houses.find(h => h.HouseID === id)?.HouseColor || '#fff';
}

// ---------- Unit and Holdings Rendering ----------

function drawBfsUnit() {
  const { unit } = store;
  if (!unit) return;

  if (unit.path && unit.path.length > 0) {
    ctx.beginPath();
    ctx.moveTo(unit.x, unit.y);
    unit.path.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(unit.x, unit.y, 5, 0, 2 * Math.PI);
  ctx.fill();
}

function drawAllUnits() {
  if (!Array.isArray(store.units)) return;
  store.units.forEach(u => {
    const [cx, cy] = hexToPixel(u.col, u.row);
    drawUnitSprite(u, cx, cy);
  });
}

function drawUnitSprite(u, mapX, mapY) {
  const factor = Math.sqrt(store.camera.scale || 1);
  const w = BASE_UNIT_SIZE * factor;
  const h = BASE_UNIT_SIZE * factor;
  const x = mapX - w / 2;
  const y = mapY + HEX_HEIGHT / 2 - h;

  // Base sprite
  if (baseImage?.complete) {
    ctx.drawImage(baseImage, x, y, w, h);
  }

  // Region banner tint
  const regImg = unitImageCache['regionBanner'];
  let regionColor = '#ffffff';
  if (u.RegionID && store.regions) {
    const reg = store.regions.find(r => r.RegionID === u.RegionID);
    if (reg?.regionColor) regionColor = reg.regionColor;
  }
  if (regImg?.complete) {
    tintedDraw(regImg, x, y, w, h, regionColor, 0.8);
  }

  // House banner tint
  const houseImg = unitImageCache['houseBanner'];
  const houseColor = getHouseColor(u.HouseID);
  if (houseImg?.complete) tintedDraw(houseImg, x, y, w, h, houseColor, 1);

  // Main unit image (unique per unit, fallback if missing)
  let img = unitImageCache[u.ImagePath];
  if (!img) {
    img = new Image();
    img.src = u.ImagePath || '/images/units/army.png';
    unitImageCache[u.ImagePath] = img;
    img.onload = scheduleRenderScene;
  }
  if (img.complete) {
    ctx.drawImage(img, x, y, w, h);
  }

  // Unit name (above icon)
  if (u.UnitName) {
    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(u.UnitName, mapX, y - 2);
    ctx.fillStyle = 'white';
    ctx.fillText(u.UnitName, mapX, y - 2);
    ctx.restore();
  }
}

function drawAllHoldings() {
  if (!Array.isArray(store.holdings)) return;
  store.holdings.forEach(h => {
    const [cx, cy] = hexToPixel(h.col, h.row);
    drawHoldingSprite(h, cx, cy);
  });
}

function drawHoldingSprite(h, mapX, mapY) {
  const factor = Math.sqrt(store.camera.scale || 1);
  const w = BASE_HOLDING_SIZE * factor;
  const hSize = BASE_HOLDING_SIZE * factor;
  const x = mapX - w / 2;
  const y = mapY + HEX_HEIGHT / 2 - hSize;

  // Holding image (with tint)
  let img = holdingImageCache[h.ImagePath];
  if (!img) {
    img = new Image();
    img.src = h.ImagePath || '/images/holdings/castle.png';
    holdingImageCache[h.ImagePath] = img;
    img.onload = scheduleRenderScene;
  }
  if (img.complete) {
    tintedDraw(img, x, y, w, hSize, getHouseColor(h.HouseID), 1);
  }

  // Holding name
  if (h.HoldingName) {
    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(h.HoldingName, mapX, y - 2);
    ctx.fillStyle = 'white';
    ctx.fillText(h.HoldingName, mapX, y - 2);
    ctx.restore();
  }
}

/**
 * Draw tinted (colorized) image, with result cached for performance.
 */
function tintedDraw(img, x, y, w, h, color, tintAlpha = 0.8) {
  if (!img.complete || img.naturalWidth === 0) return;
  const cacheKey = `${img.src}-${color}-${tintAlpha}`;
  let tintedCanvas = tintedCache[cacheKey];

  if (!tintedCanvas) {
    tintedCanvas = document.createElement('canvas');
    tintedCanvas.width = img.naturalWidth;
    tintedCanvas.height = img.naturalHeight;
    const offCtx = tintedCanvas.getContext('2d');
    offCtx.drawImage(img, 0, 0);
    offCtx.globalCompositeOperation = 'multiply';
    offCtx.fillStyle = color;
    offCtx.globalAlpha = tintAlpha;
    offCtx.fillRect(0, 0, img.naturalWidth, img.naturalHeight);
    offCtx.globalCompositeOperation = 'destination-atop';
    offCtx.globalAlpha = 1;
    offCtx.drawImage(img, 0, 0);
    tintedCache[cacheKey] = tintedCanvas;
  }

  ctx.drawImage(tintedCanvas, 0, 0, img.naturalWidth, img.naturalHeight, x, y, w, h);
}
