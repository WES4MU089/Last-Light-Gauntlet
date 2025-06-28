// js/paintTools.js
import { store } from './store.js';
import { renderScene } from './mapRenderer.js';
import {
  inBoundsHex,
  hexNeighbors,
  getHexesWithinRadius,
  pixelToHex
} from './geometry.js';

// Tracks painted cells for throttling
let paintedThisDrag = new Set();
// Batch changes for bulk update on drag end
let pendingChanges = [];
// Track every cell the user has painted locally this session
export const locallyPainted = new Set();

/**
 * Called when left-click dragging for painting.
 */
export function paintCellsBrush(worldX, worldY) {
  const { mapData, selectedTerrainId, brushSize } = store;
  if (!mapData || !selectedTerrainId) return;

  const [centerC, centerR] = pixelToHex(worldX, worldY);
  const hexes = getHexesWithinRadius(centerC, centerR, brushSize);
  let changedThisStep = [];

  hexes.forEach(cell => {
    if (!inBoundsHex(mapData, cell.col, cell.row)) return;
    const key = `${cell.col},${cell.row}`;
    if (paintedThisDrag.has(key)) return;
    const before = mapData[cell.row][cell.col];
    const tId = Number(selectedTerrainId);
    if (Number(before) === tId) return;

    // update local state
    mapData[cell.row][cell.col] = tId;
    paintedThisDrag.add(key);
    locallyPainted.add(key);
    changedThisStep.push({ col: cell.col, row: cell.row, terrainId: tId });
  });

  if (changedThisStep.length > 0) {
    pendingChanges.push(...changedThisStep);
    renderScene();
  }
}

// Reset tracking when mouse released, and flush pendingChanges
export function resetPaintThrottle() {
  paintedThisDrag = new Set();
  if (pendingChanges.length > 0) {
    fetch(`/api/mapcells/bulkPaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapId: store.currentMapId || 1, changes: pendingChanges })
    })
    .then(res => res.json())
    .then(res => console.log('[PAINT] bulkPaint response:', res))
    .catch(err => console.error('[PAINT] bulkPaint error:', err));

    pendingChanges = [];
  }
}

/**
 * Flood fill from a single (col,row).
 */
export function floodFillHex(startCol, startRow, newTerrainId) {
  const { mapData } = store;
  if (!mapData) return;
  if (!inBoundsHex(mapData, startCol, startRow)) return;

  const targetId = Number(mapData[startRow][startCol]);
  const fillId = Number(newTerrainId);
  if (targetId === fillId) return;

  const queue = [{ col: startCol, row: startRow }];
  const visited = new Set();
  let changed = [];

  while (queue.length) {
    const { col, row } = queue.shift();
    const key = `${col},${row}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (!inBoundsHex(mapData, col, row)) continue;
    if (Number(mapData[row][col]) !== targetId) continue;

    // apply local fill
    mapData[row][col] = fillId;
    locallyPainted.add(key);
    changed.push({ col, row, terrainId: fillId });

    hexNeighbors(col, row).forEach(n => {
      const nKey = `${n.col},${n.row}`;
      if (!visited.has(nKey)) queue.push(n);
    });
  }

  if (changed.length > 0) {
    pendingChanges.push(...changed);
    renderScene();
  }
}
