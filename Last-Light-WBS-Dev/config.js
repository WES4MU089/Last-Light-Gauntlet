// config.js
const IMAGE_WIDTH = 4096;
const IMAGE_HEIGHT = 8192;
const HEX_WIDTH = 50;
const HEX_HEIGHT = 44;
const COL_SPACING = HEX_WIDTH * 0.75;

const COLS = Math.floor(IMAGE_WIDTH / COL_SPACING);
const ROWS = Math.floor(IMAGE_HEIGHT / HEX_HEIGHT);

module.exports = {
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
  HEX_WIDTH,
  HEX_HEIGHT,
  COL_SPACING,
  COLS,
  ROWS
};
