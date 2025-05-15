// js/paintTools.js
import { store } from './store.js';
import { renderScene } from './mapRenderer.js';
import {
  inBoundsHex,
  hexNeighbors,
  getHexesWithinRadius,
  pixelToHex
} from './geometry.js';
import { loadTerrainList } from './terrainTools.js';

/**
 * Called when left-click dragging for painting.
 */
export function paintCellsBrush(worldX, worldY) {
  const { mapData, selectedTerrainId, brushSize } = store;
  if (!mapData || !selectedTerrainId) return;

  // Find center col/row
  const [centerC, centerR] = pixelToHex(worldX, worldY);
  let changedCells = [];
  
  const hexes = getHexesWithinRadius(centerC, centerR, brushSize);
  hexes.forEach(cell => {
    if (!inBoundsHex(mapData, cell.col, cell.row)) return;
    mapData[cell.row][cell.col] = selectedTerrainId;
    changedCells.push({ col: cell.col, row: cell.row, terrainId: selectedTerrainId });
  });

  renderScene();

  // Bulk update server using MapID 1 (which is correct)
  if (changedCells.length > 0) {
    fetch('/api/mapcells/bulkPaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapId: 1, changes: changedCells })
    })
      .then(res => res.json())
      .then(data => {
        console.log('[Brush] Bulk paint update successful:', data);
        // Refresh terrain list to update colors and then re-render.
        loadTerrainList().then(() => renderScene());
      })
      .catch(err => console.error('[Brush] Error in bulk paint update:', err));
  }
}

/**
 * Flood fill from a single (col,row).
 */
export function floodFillHex(startCol, startRow, newTerrainId) {
  const { mapData } = store;
  if (!mapData) return;
  if (!inBoundsHex(mapData, startCol, startRow)) return;

  const targetTerrainId = mapData[startRow][startCol];
  if (targetTerrainId === newTerrainId) {
    console.log('[FloodFill] No change needed, target equals new terrain.');
    return; // nothing to do
  }

  let changedCells = [];
  let queue = [{ col: startCol, row: startRow }];
  let visited = new Set();

  while (queue.length > 0) {
    const { col, row } = queue.shift();
    const key = `${col},${row}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (!inBoundsHex(mapData, col, row)) continue;
    if (mapData[row][col] !== targetTerrainId) continue;

    // Paint it
    mapData[row][col] = newTerrainId;
    changedCells.push({ col, row, terrainId: newTerrainId });

    // Add neighbors
    hexNeighbors(col, row).forEach(n => {
      const nKey = `${n.col},${n.row}`;
      if (!visited.has(nKey)) {
        queue.push(n);
      }
    });
  }

  renderScene();

  if (changedCells.length > 0) {
    fetch('/api/mapcells/bulkPaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapId: 1, changes: changedCells })
    })
      .then(res => res.json())
      .then(data => {
        console.log('[FloodFill] Bulk update response:', data);
        // Refresh terrain list and re-render to update the displayed colors.
        loadTerrainList().then(() => renderScene());
      })
      .catch(err => console.error('[FloodFill] Error in bulk update:', err));
  }
}

/**
 * We also need pixelToHex - but that's in geometry.js,
 * so we import it or define a small wrapper here:
 */
