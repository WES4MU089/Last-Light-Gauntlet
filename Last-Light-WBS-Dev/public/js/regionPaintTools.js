// js/regionPaintTools.js
// A stand‑alone paint helper dedicated to REGION overlays.
// Mirrors paintTools.js but targets store.regionData and hits the new
// /api/mapcells/bulkPaintRegion endpoint so we don’t touch terrain logic.

import { store } from './store.js';
import { renderScene } from './mapRenderer.js';
import {
  inBoundsHex,
  hexNeighbors,
  getHexesWithinRadius,
  pixelToHex
} from './geometry.js';

// Tracks painted cells during a single drag (throttling)
let paintedThisDrag = new Set();
// Batch array that will be POSTed at drag‑end
let pendingChanges = [];
// Tracks all cells locally painted this session (useful for debug)
export const locallyRegionPainted = new Set();

/**
 * Brush paint handler (radius == store.brushSize)
 */
export function paintRegionBrush(worldX, worldY) {
  const { regionData, selectedRegionId, brushSize } = store;
  if (!regionData || !selectedRegionId) return;

  const [centerC, centerR] = pixelToHex(worldX, worldY);
  const hexes = getHexesWithinRadius(centerC, centerR, brushSize);
  let changedThisStep = [];

  hexes.forEach(cell => {
    if (!inBoundsHex(regionData, cell.col, cell.row)) return;
    const key = `${cell.col},${cell.row}`;
    if (paintedThisDrag.has(key)) return;

    const before = regionData[cell.row][cell.col];
    const rId = Number(selectedRegionId);
    if (Number(before) === rId) return; // already that region

    // Update local state & queues
    regionData[cell.row][cell.col] = rId;
    paintedThisDrag.add(key);
    locallyRegionPainted.add(key);
    changedThisStep.push({ col: cell.col, row: cell.row, regionId: rId });
  });

  if (changedThisStep.length) {
    pendingChanges.push(...changedThisStep);
    renderScene();
  }
}

/**
 * Flood‑fill contiguous region IDs starting at (col,row)
 */
export function floodFillRegion(startCol, startRow, newRegionId) {
  const { regionData } = store;
  if (!regionData) return;
  if (!inBoundsHex(regionData, startCol, startRow)) return;

  const targetId = Number(regionData[startRow][startCol]);
  const fillId   = Number(newRegionId);
  if (targetId === fillId) return; // nothing to do

  const queue   = [{ col: startCol, row: startRow }];
  const visited = new Set();
  let changed   = [];

  while (queue.length) {
    const { col, row } = queue.shift();
    const key = `${col},${row}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (!inBoundsHex(regionData, col, row)) continue;
    if (Number(regionData[row][col]) !== targetId) continue;

    // apply fill
    regionData[row][col] = fillId;
    locallyRegionPainted.add(key);
    changed.push({ col, row, regionId: fillId });

    hexNeighbors(col, row).forEach(n => {
      const nKey = `${n.col},${n.row}`;
      if (!visited.has(nKey)) queue.push(n);
    });
  }

  if (changed.length) {
    pendingChanges.push(...changed);
    renderScene();
  }
}

/**
 * Called on mouse‑up / drag‑end. Flushes pendingChanges in one API hit.
 */
export function resetRegionPaintThrottle() {
  paintedThisDrag = new Set();
  if (pendingChanges.length) {
    fetch('/api/mapcells/bulkPaintRegion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mapId: store.currentMapId || 1,
        changes: pendingChanges
      })
    })
      .then(r => r.json())
      .then(res => console.log('[PAINT‑REGION] bulkPaintRegion:', res))
      .catch(err => console.error('[PAINT‑REGION] error:', err));

    pendingChanges = [];
  }
}

/**
 * Convenience to convert screen event to brush paint (used by adminClient)
 */
export function paintRegionBrushFromScreen(evt) {
  const { wx, wy } = screenToWorld(evt);
  paintRegionBrush(wx, wy);
}

// Utility copied from adminClient so we can call without circular dep
function screenToWorld(evt) {
  const rect = evt.currentTarget.getBoundingClientRect();
  const sx = evt.clientX - rect.left;
  const sy = evt.clientY - rect.top;
  return {
    wx: (sx - store.camera.x) / store.camera.scale,
    wy: (sy - store.camera.y) / store.camera.scale
  };
}
