// js/geometry.js

// Some constants mirror your config
export const HEX_WIDTH = 50;
export const HEX_HEIGHT = 44;
export const HEX_COL_SPACING = HEX_WIDTH * 0.75;

/**
 * Convert hex col,row to pixel coordinates.
 * This is a flat-top layout with "odd-r" or "odd-q" logic.
 */
export function hexToPixel(col, row) {
  let x = col * HEX_COL_SPACING;
  let y = row * HEX_HEIGHT;
  if (col % 2 === 1) {
    y += HEX_HEIGHT / 2;
  }
  return [x, y];
}

/**
 * Convert pixel coords to the "closest" hex col,row
 */
export function pixelToHex(px, py) {
  let approxCol = Math.floor(px / HEX_COL_SPACING);
  let bestC = 0, bestR = 0;
  let bestDist = Infinity;
  for (let dc = -1; dc <= 2; dc++) {
    for (let dr = -1; dr <= 2; dr++) {
      const testC = approxCol + dc;
      const testR = Math.floor(py / HEX_HEIGHT) + dr;
      const [hx, hy] = hexToPixel(testC, testR);
      const dx = hx - px;
      const dy = hy - py;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestC = testC;
        bestR = testR;
      }
    }
  }
  return [bestC, bestR];
}

/**
 * In-bounds check for row/col.
 * We only have store.mapData in another module, so
 * we might pass in 'mapData' or do a direct import.
 */
export function inBoundsHex(mapData, col, row) {
  return (
    row >= 0 && row < mapData.length &&
    col >= 0 && col < mapData[0].length
  );
}

/**
 * Return neighbors for a flat-top hex grid, 
 * using your original “odd-r” or “odd-q” logic.
 */
export function hexNeighbors(col, row) {
  if (col % 2 === 0) {
    return [
      { col, row: row-1 },
      { col: col+1, row: row-1 },
      { col: col+1, row },
      { col, row: row+1 },
      { col: col-1, row },
      { col: col-1, row: row-1 }
    ];
  } else {
    return [
      { col, row: row-1 },
      { col: col+1, row },
      { col: col+1, row: row+1 },
      { col, row: row+1 },
      { col: col-1, row: row+1 },
      { col: col-1, row }
    ];
  }
}

/**
 * For brush radius or distance calculations in hex:
 * Convert “odd-q” hex to cube coords, measure distance
 */
function oddqToCube(col, row) {
  const x = col;
  const z = row - ((col - (col & 1)) / 2);
  const y = -x - z;
  return { x, y, z };
}

function cubeDistance(a, b) {
  return Math.max(
    Math.abs(a.x - b.x),
    Math.abs(a.y - b.y),
    Math.abs(a.z - b.z)
  );
}

export function hexDistance(c1, r1, c2, r2) {
  const a = oddqToCube(c1, r1);
  const b = oddqToCube(c2, r2);
  return cubeDistance(a, b);
}

/**
 * Return all hexes within a given “radius” of centerCol,centerRow.
 */
export function getHexesWithinRadius(centerCol, centerRow, radius) {
  const results = [];
  for (let dc = -radius; dc <= radius; dc++) {
    for (let dr = -radius; dr <= radius; dr++) {
      const col = centerCol + dc;
      const row = centerRow + dr;
      if (hexDistance(centerCol, centerRow, col, row) <= radius) {
        results.push({ col, row });
      }
    }
  }
  return results;
}
