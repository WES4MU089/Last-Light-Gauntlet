// gameLogic.js
const { tileToPixel } = require('./utils');
const config = require('./config');

let terrainInfoMap = new Map();
// This holds your 2D array of terrain IDs
let mapData = [];

/**
 * Initialize the game logic with terrain info and map data.
 */
function init({ terrainInfo, mapData: initialMapData }) {
  terrainInfoMap = terrainInfo;
  mapData = initialMapData;
  // If you ever want to set an initial "test" tile or do something else, do it here.
}

/**
 * isPassable(terrainId): checks if the terrain is passable from terrainInfoMap.
 */
function isPassable(terrainId) {
  const info = terrainInfoMap.get(terrainId);
  return info ? info.passable : false;
}

/**
 * getMovementCost(terrainId): returns movementCost from terrainInfoMap, or Infinity if unknown.
 */
function getMovementCost(terrainId) {
  const info = terrainInfoMap.get(terrainId);
  return info ? info.movementCost : Infinity;
}

/**
 * inBounds(col, row): checks if col/row is within the configured map size.
 */
function inBounds(col, row) {
  const { ROWS, COLS } = config;
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

/**
 * A* pathfinding for hex grids, returns a tile path from start to goal.
 * If no path is found or the tiles are not passable, returns null.
 */
function aStarPath(start, goal) {
  // Basic out-of-bounds or blocked checks
  if (!inBounds(start.col, start.row) || !inBounds(goal.col, goal.row)) return null;
  if (!isPassable(mapData[start.row][start.col]) || !isPassable(mapData[goal.row][goal.col])) return null;

  const toKey = (c, r) => `${c},${r}`;
  const startKey = toKey(start.col, start.row);
  const goalKey = toKey(goal.col, goal.row);

  let openSet = new Set([startKey]);
  let cameFrom = new Map();
  let gScore = new Map([[startKey, 0]]);
  let fScore = new Map([[startKey, hexHeuristic(start, goal)]]);

  while (openSet.size > 0) {
    let currentKey = null;
    let lowestF = Infinity;
    for (let key of openSet) {
      const fs = fScore.get(key) ?? Infinity;
      if (fs < lowestF) {
        lowestF = fs;
        currentKey = key;
      }
    }
    if (!currentKey) break;
    if (currentKey === goalKey) {
      return reconstructPath(cameFrom, currentKey);
    }
    openSet.delete(currentKey);
    const [currCol, currRow] = currentKey.split(',').map(Number);
    const currentG = gScore.get(currentKey);

    const neighbors = getNeighbors(currCol, currRow);
    for (let nb of neighbors) {
      if (!inBounds(nb.col, nb.row)) continue;
      if (!isPassable(mapData[nb.row][nb.col])) continue;
      const tentativeG = currentG + getMovementCost(mapData[nb.row][nb.col]);
      const nbKey = toKey(nb.col, nb.row);
      if (tentativeG < (gScore.get(nbKey) ?? Infinity)) {
        cameFrom.set(nbKey, currentKey);
        gScore.set(nbKey, tentativeG);
        fScore.set(nbKey, tentativeG + hexHeuristic(nb, goal));
        openSet.add(nbKey);
      }
    }
  }
  return null;
}

/**
 * Reconstructs the path from a cameFrom map. Returns an array of { col, row }.
 */
function reconstructPath(cameFrom, currentKey) {
  let path = [];
  while (cameFrom.has(currentKey)) {
    const [col, row] = currentKey.split(',').map(Number);
    path.push({ col, row });
    currentKey = cameFrom.get(currentKey);
  }
  // add the start tile
  const [sc, sr] = currentKey.split(',').map(Number);
  path.push({ col: sc, row: sr });
  path.reverse();
  return path;
}

/**
 * Converts a tile-based path (array of { col, row }) to a pixel-based path 
 * (array of { x, y }) for rendering or movement. 
 */
function tilePathToPixelPath(tilePath) {
  if (!tilePath) return [];
  return tilePath.map(t => {
    const [px, py] = tileToPixel(t.col, t.row);
    return { x: px, y: py };
  });
}

/**
 * Neighbors for a hex grid in "odd-q" layout
 */
function getNeighbors(col, row) {
  const odd = (col % 2) === 1;
  if (!odd) {
    return [
      { col, row: row - 1 },
      { col: col - 1, row },
      { col: col + 1, row },
      { col, row: row + 1 },
      { col: col - 1, row: row - 1 },
      { col: col + 1, row: row - 1 }
    ];
  } else {
    return [
      { col, row: row - 1 },
      { col: col - 1, row: row + 1 },
      { col: col + 1, row: row + 1 },
      { col, row: row + 1 },
      { col: col - 1, row },
      { col: col + 1, row }
    ];
  }
}

function oddqToCube(col, row) {
  const x = col;
  const z = row - Math.floor((col - (col & 1)) / 2);
  const y = -x - z;
  return { x, y, z };
}

function cubeDistance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
}

/**
 * Hex heuristic for A* using cube distance.
 */
function hexHeuristic(a, b) {
  const ac = oddqToCube(a.col, a.row);
  const bc = oddqToCube(b.col, b.row);
  return cubeDistance(ac, bc);
}

// Export the logic
module.exports = {
  init,
  getTerrainInfo: () => terrainInfoMap,
  getMapData: () => mapData,
  aStarPath,
  tilePathToPixelPath
};
