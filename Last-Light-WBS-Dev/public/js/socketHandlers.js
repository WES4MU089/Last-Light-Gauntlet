// js/socketHandlers.js
import { store } from './store.js';
import { renderScene } from './mapRenderer.js';

export function initSocket() {
  // “io” is provided by <script src="/socket.io/socket.io.js">
  const socket = io();
  store.socket = socket; // store reference if needed

  // Listen for server messages
  socket.on('initState', data => {
    store.mapData = data.mapData;
    store.unit = data.unit;
    renderScene();
  });

  socket.on('gameUpdate', data => {
    store.mapData = data.mapData;
    store.unit = data.unit;
    renderScene();
  });
}

/**
 * Called when we want to set BFS path for the “unit,” e.g. left-click.
 */
export function setPath(col, row) {
  if (!store.socket) return;
  store.socket.emit('setPath', { col, row });
}
