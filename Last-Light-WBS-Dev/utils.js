// utils.js
const { HEX_WIDTH, HEX_HEIGHT, COL_SPACING } = require('./config');

function tileToPixel(col, row) {
  const px = COL_SPACING * col;
  let py = row * HEX_HEIGHT;
  // Shift odd columns by half a hex height for flat-top layout
  if (col % 2 === 1) {
    py += HEX_HEIGHT / 2;
  }
  return [px, py];
}

function approximateTileFromPixel(px, py, ROWS, COLS, tileToPixelFunc) {
  let bestCol = 0, bestRow = 0;
  let bestDist = Infinity;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const [cx, cy] = tileToPixelFunc(col, row);
      const dx = cx - px;
      const dy = cy - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestCol = col;
        bestRow = row;
      }
    }
  }
  return [bestCol, bestRow];
}

module.exports = {
  tileToPixel,
  approximateTileFromPixel
};
