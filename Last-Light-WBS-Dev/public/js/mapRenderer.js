// js/mapRenderer.js
import { store } from './store.js';
import { hexToPixel, HEX_WIDTH, HEX_HEIGHT } from './geometry.js';

let canvas, ctx;
let mapImage = null;
let territoryMapImage = null;
let baseImage = null;  // For optional tinted base behind units/holdings

// Global caches
const unitImageCache = {};
const holdingImageCache = {};
const tintedCache = {};

// Base icon sizes (at scale=1.0)
const BASE_UNIT_SIZE = 25;
const BASE_HOLDING_SIZE = 25;

// Flag to schedule a single render per animation frame
let renderScheduled = false;
function scheduleRenderScene() {
  if (!renderScheduled) {
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      renderScene();
    });
  }
}

/**
 * Initialize the renderer with references to the canvas,
 * the normal map image, and territory map image (optional).
 */
export function initRenderer(canvasEl, mapImg, territoryImg) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');

  // Save references to our two maps
  mapImage = mapImg;
  territoryMapImage = territoryImg;

  // Resize on load using scheduled renders
  window.addEventListener('resize', () => {
    resizeCanvas();
  });
  resizeCanvas();

  // If main or territory map isn't fully loaded, schedule render when it completes
  if (!mapImage.complete) {
    mapImage.onload = scheduleRenderScene;
  }
  if (territoryMapImage && !territoryMapImage.complete) {
    territoryMapImage.onload = scheduleRenderScene;
  }

  // Optional base "flag"
  baseImage = new Image();
  baseImage.src = '/img/wbs/base.png';
  baseImage.onload = scheduleRenderScene;
}

/**
 * Main render function.
 * Note: The update here now always draws terrain overlays based on the current mapData and terrainList.
 */
export function renderScene() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { x, y, scale } = store.camera;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Decide which map (normal vs. territory)
  const baseMap = (store.views && store.views.territory && territoryMapImage)
    ? territoryMapImage
    : mapImage;

  // Draw the chosen base map
  if (baseMap) {
    ctx.drawImage(baseMap, 0, 0);
  }

  // Always draw terrain overlays so that the painted colors show.
  drawTerrainOverlays();

  // Debug: draw BFS unit if present
  drawBfsUnit();

  // Draw all units & holdings
  drawAllUnits();
  drawAllHoldings();

  ctx.restore();
}

/**
 * Keep canvas sized.
 */
function resizeCanvas() {
  if (!canvas) return;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  scheduleRenderScene();
}

/**
 * Draw terrain overlays: for each cell, draw a hex filled with the terrain's color.
 */
function drawTerrainOverlays() {
  const { mapData, terrainList } = store;
  if (!mapData || !terrainList) return;

  for (let row = 0; row < mapData.length; row++) {
    for (let col = 0; col < mapData[row].length; col++) {
      const [cx, cy] = hexToPixel(col, row);
      const terrainId = mapData[row][col];
      const terr = terrainList.find(t => t.terrain_id === terrainId);

      if (!terr) {
        drawHex(cx, cy, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.2)');
      } else {
        // Use the terrain's color with an alpha of 0.5 for the overlay.
        drawHex(cx, cy, hexToRgba(terr.color, 0.5), 'rgba(0,0,0,0.2)');
      }
    }
  }
}

/**
 * Draw a single hex polygon.
 */
function drawHex(cx, cy, fillStyle, strokeStyle) {
  const corners = [
    { x: cx - HEX_WIDTH / 2, y: cy },
    { x: cx - HEX_WIDTH / 4, y: cy - HEX_HEIGHT / 2 },
    { x: cx + HEX_WIDTH / 4, y: cy - HEX_HEIGHT / 2 },
    { x: cx + HEX_WIDTH / 2, y: cy },
    { x: cx + HEX_WIDTH / 4, y: cy + HEX_HEIGHT / 2 },
    { x: cx - HEX_WIDTH / 4, y: cy + HEX_HEIGHT / 2 }
  ];

  ctx.beginPath();
  corners.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Debug BFS unit.
 */
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

/**
 * Utility: tinted drawing using an offscreen canvas.
 */
function tintedDraw(img, x, y, w, h, color, tintAlpha = 0.8) {
  const cacheKey = `${img.src}-${color}-${tintAlpha}`;
  let tintedCanvas = tintedCache[cacheKey];

  if (!tintedCanvas) {
    tintedCanvas = document.createElement('canvas');
    tintedCanvas.width = img.naturalWidth;
    tintedCanvas.height = img.naturalHeight;
    const offCtx = tintedCanvas.getContext('2d');
    offCtx.imageSmoothingEnabled = true;
    
    // Draw original image.
    offCtx.drawImage(img, 0, 0);
    
    // Multiply tint.
    offCtx.globalCompositeOperation = 'multiply';
    offCtx.fillStyle = color;
    offCtx.globalAlpha = tintAlpha;
    offCtx.fillRect(0, 0, img.naturalWidth, img.naturalHeight);
    
    // Restore original details.
    offCtx.globalCompositeOperation = 'destination-atop';
    offCtx.globalAlpha = 1;
    offCtx.drawImage(img, 0, 0);
    
    tintedCache[cacheKey] = tintedCanvas;
  }
  
  ctx.save();
  ctx.drawImage(tintedCanvas, 0, 0, img.naturalWidth, img.naturalHeight, x, y, w, h);
  ctx.restore();
}

/**
 * Convert a hex color and alpha value to an rgba string.
 */
function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) {
    return `rgba(255,255,255,${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** =======================
 *   UNITS
 ======================= */
function drawAllUnits() {
  if (!store.units) return;
  store.units.forEach(u => {
    const [cx, cy] = hexToPixel(u.col, u.row);
    drawUnitSprite(u, cx, cy);
  });
}

function drawUnitSprite(u, mapX, mapY) {
  const iconFactor = Math.sqrt(store.camera.scale);
  const drawW = BASE_UNIT_SIZE * iconFactor;
  const drawH = BASE_UNIT_SIZE * iconFactor;
  const drawX = mapX - drawW / 2;
  const drawY = mapY + (HEX_HEIGHT / 2) - drawH;

  // 1. Base Image (untinted)
  if (baseImage && baseImage.complete && baseImage.naturalWidth > 0) {
    ctx.drawImage(baseImage, drawX, drawY, drawW, drawH);
  }

  // 2. Region Banner (tinted with region color)
  let regionBannerImg = unitImageCache['regionBanner'];
  if (!regionBannerImg) {
    regionBannerImg = new Image();
    regionBannerImg.src = '/images/units/regionBanner.png';
    unitImageCache['regionBanner'] = regionBannerImg;
    regionBannerImg.onload = scheduleRenderScene;
    regionBannerImg.onerror = () => console.error('Failed to load region banner image');
  }
  let regionColor = '#ffffff';
  if (u.RegionID && store.regions) {
    const reg = store.regions.find(r => r.RegionID === u.RegionID);
    if (reg && reg.regionColor) {
      regionColor = reg.regionColor;
    }
  }
  if (regionBannerImg.complete && regionBannerImg.naturalWidth > 0) {
    tintedDraw(regionBannerImg, drawX, drawY, drawW, drawH, regionColor, 0.8);
  }

  // 3. House Banner (tinted with house color)
  let houseBannerImg = unitImageCache['houseBanner'];
  if (!houseBannerImg) {
    houseBannerImg = new Image();
    houseBannerImg.src = '/images/units/houseBanner.png';
    unitImageCache['houseBanner'] = houseBannerImg;
    houseBannerImg.onload = scheduleRenderScene;
    houseBannerImg.onerror = () => console.error('Failed to load house banner image');
  }
  const houseColor = getHouseColor(u.HouseID);
  if (houseBannerImg.complete && houseBannerImg.naturalWidth > 0) {
    tintedDraw(houseBannerImg, drawX, drawY, drawW, drawH, houseColor, 1);
  }

  // 4. Unit Icon (untinted)
  let img = unitImageCache[u.ImagePath];
  if (!img) {
    img = new Image();
    img.src = u.ImagePath || '/images/units/army.png';
    unitImageCache[u.ImagePath] = img;
    img.onload = scheduleRenderScene;
    img.onerror = () => console.error('Failed to load unit image:', img.src);
  }
  if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // 5. Label.
  if (u.UnitName) {
    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const labelX = mapX;
    const labelY = drawY - 2;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(u.UnitName, labelX, labelY);
    ctx.fillStyle = 'white';
    ctx.fillText(u.UnitName, labelX, labelY);
    ctx.restore();
  }
}

/** =======================
 *   HOLDINGS
 ======================= */
function drawAllHoldings() {
  if (!store.holdings) return;
  store.holdings.forEach(h => {
    const [cx, cy] = hexToPixel(h.col, h.row);
    drawHoldingSprite(h, cx, cy);
  });
}

function drawHoldingSprite(h, mapX, mapY) {
  const iconFactor = Math.sqrt(store.camera.scale);
  const drawW = BASE_HOLDING_SIZE * iconFactor;
  const drawH = BASE_HOLDING_SIZE * iconFactor;
  const drawX = mapX - drawW / 2;
  const drawY = mapY + (HEX_HEIGHT / 2) - drawH;

  const houseColor = getHouseColor(h.HouseID);
  let img = holdingImageCache[h.ImagePath];
  if (!img) {
    img = new Image();
    img.src = h.ImagePath || '/images/holdings/castle.png';
    holdingImageCache[h.ImagePath] = img;
    img.onload = scheduleRenderScene;
    img.onerror = () => console.error('Failed to load holding image:', img.src);
  }
  if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
    tintedDraw(img, drawX, drawY, drawW, drawH, houseColor, 1);
  }

  // Holding label.
  if (h.HoldingName) {
    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const labelX = mapX;
    const labelY = drawY - 2;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(h.HoldingName, labelX, labelY);
    ctx.fillStyle = 'white';
    ctx.fillText(h.HoldingName, labelX, labelY);
    ctx.restore();
  }
}

/**
 * Utility: get the house color for a HouseID.
 */
function getHouseColor(houseID) {
  if (!houseID) {
    return '#ffffff';
  }
  const h = store.houses.find(x => x.HouseID === houseID);
  return h ? h.HouseColor : '#ffffff';
}
