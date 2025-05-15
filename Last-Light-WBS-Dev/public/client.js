/********************************************************************
 * CLIENT-SIDE CODE
 ********************************************************************/
const HEX_WIDTH = 25;   
const HEX_HEIGHT = 22;  

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Basic camera for zoom + pan
let camera = {
  x: 0,
  y: 0,
  scale: 1.0
};

let mapData = null;
let unit = null;

// We'll store your map's real pixel size (e.g., 7400×4932) for drawing.
let imageWidth = 2048; 
let imageHeight = 4096;

// Load the background map
const mapImage = new Image();
mapImage.src = "map.png"; 
mapImage.onload = () => {
  console.log("Background map loaded");
  resizeCanvas();
  renderScene();
};

// Connect to server
const socket = io();

// On initial + updates
socket.on('initState', (data) => {
  mapData = data.mapData;
  unit = data.unit;

  // If the server also sends imageWidth, imageHeight, set them:
  // imageWidth = data.imageWidth || 7400;
  // imageHeight = data.imageHeight || 4932;

  resizeCanvas();
  renderScene();
});
socket.on('gameUpdate', (data) => {
  mapData = data.mapData;
  unit = data.unit;
  renderScene();
});

/********************************************************************
 * MOUSE INTERACTIONS
 ********************************************************************/
// For zoom with scroll wheel
canvas.addEventListener('wheel', (evt) => {
  evt.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = evt.clientX - rect.left;
  const my = evt.clientY - rect.top;

  // Convert screen -> world coords
  const wx = (mx - camera.x) / camera.scale;
  const wy = (my - camera.y) / camera.scale;

  const zoomFactor = 1.1;
  if (evt.deltaY < 0) {
    // zoom in
    camera.scale *= zoomFactor;
  } else {
    // zoom out
    camera.scale /= zoomFactor;
  }
  camera.scale = Math.max(0.25, Math.min(4.0, camera.scale));

  // Adjust camera so (wx, wy) remains under mouse
  const newSx = wx * camera.scale + camera.x;
  const newSy = wy * camera.scale + camera.y;
  camera.x -= (newSx - mx);
  camera.y -= (newSy - my);

  renderScene();
});

// For panning with middle mouse:
let isPanning = false;
let panStartX = 0, panStartY = 0;      // where the mouse was pressed
let cameraStartX = 0, cameraStartY = 0; // camera coords at mousedown

canvas.addEventListener('mousedown', (evt) => {
  // Middle button => panning
  if (evt.button === 1) { 
    evt.preventDefault();  // block any default middle-click behavior
    isPanning = true;
    panStartX = evt.clientX;
    panStartY = evt.clientY;
    cameraStartX = camera.x;
    cameraStartY = camera.y;
  }
  // Left button => set path with BFS if you want:
  else if (evt.button === 0) {
    // We only do BFS on left click if mapData is loaded
    if (!mapData) return;
    const rect = canvas.getBoundingClientRect();
    const sx = evt.clientX - rect.left;
    const sy = evt.clientY - rect.top;

    const wx = (sx - camera.x) / camera.scale;
    const wy = (sy - camera.y) / camera.scale;

    const [c, r] = pixelToHex(wx, wy);
    socket.emit('setPath', { col: c, row: r });
  }
});

canvas.addEventListener('mousemove', (evt) => {
  if (isPanning) {
    // How far the mouse has moved since mousedown
    const dx = evt.clientX - panStartX;
    const dy = evt.clientY - panStartY;

    // Move the camera by the same amount
    camera.x = cameraStartX + dx;
    camera.y = cameraStartY + dy;

    renderScene();
  }
});

canvas.addEventListener('mouseup', (evt) => {
  if (evt.button === 1 && isPanning) {
    isPanning = false;
  }
});

// If you want to ensure no context menu on middle button:
canvas.addEventListener('contextmenu', (evt) => {
  evt.preventDefault();
});

/********************************************************************
 * Crisp Canvas on window resize
 ********************************************************************/
window.addEventListener('resize', () => {
  resizeCanvas();
  renderScene();
});

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/********************************************************************
 * RENDER
 ********************************************************************/
function renderScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.scale, camera.scale);

  // draw image at (0,0) in its true size (e.g., 7400×4932)
  ctx.drawImage(mapImage, 0, 0, mapImage.width, mapImage.height, 0, 0, imageWidth, imageHeight);

  // draw hex grid for mapData
  if (mapData) {
    for (let row = 0; row < mapData.length; row++) {
      for (let col = 0; col < mapData[row].length; col++) {
        const [cx, cy] = hexToPixel(col, row);
        drawHex(cx, cy);
      }
    }
  }

  // draw unit + path
  if (unit) {
    drawPixelPath(unit.path, unit.x, unit.y);

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 5, 0, 2*Math.PI);
    ctx.fill();
  }

  ctx.restore();
}

/********************************************************************
 * HELPER: Hex Grid
 ********************************************************************/
function hexToPixel(col, row) {
  let x = col * (HEX_WIDTH * 0.75);
  let y = row * HEX_HEIGHT;
  if (col % 2 === 1) {
    y += (HEX_HEIGHT / 2);
  }
  return [x, y];
}

function pixelToHex(px, py) {
  let approxCol = Math.floor(px / (HEX_WIDTH * 0.75));
  let bestC = 0, bestR = 0;
  let bestDist = Infinity;
  for (let dc = -1; dc <= 2; dc++) {
    for (let dr = -1; dr <= 2; dr++) {
      let testC = approxCol + dc;
      let testR = Math.floor(py / HEX_HEIGHT) + dr;
      let [hx, hy] = hexToPixel(testC, testR);
      let dx = hx - px;
      let dy = hy - py;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestC = testC;
        bestR = testR;
      }
    }
  }
  return [bestC, bestR];
}

function drawHex(cx, cy) {
  const corners = [
    { x: cx - (HEX_WIDTH / 2),      y: cy },
    { x: cx - (HEX_WIDTH / 4),      y: cy - (HEX_HEIGHT / 2) },
    { x: cx + (HEX_WIDTH / 4),      y: cy - (HEX_HEIGHT / 2) },
    { x: cx + (HEX_WIDTH / 2),      y: cy },
    { x: cx + (HEX_WIDTH / 4),      y: cy + (HEX_HEIGHT / 2) },
    { x: cx - (HEX_WIDTH / 4),      y: cy + (HEX_HEIGHT / 2) }
  ];
  ctx.beginPath();
  corners.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.closePath();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

/********************************************************************
 * Draw path in pixel coords
 ********************************************************************/
function drawPixelPath(path, startX, startY) {
  if (!path || path.length < 1) return;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (let i = 0; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 2;
  ctx.stroke();
}
