/* ------------------------------------------------------------------ */
/* public/js/socketHandlers.js                                        */
/* ------------------------------------------------------------------ */
/* eslint-disable no-console */
import { store } from './store.js';
import { renderScene } from './mapRenderer.js';

/**
 * Called once from adminClient.js after the page boots.
 * Hooks up socket.io and keeps unit / misc state in sync.
 * We deliberately *ignore* the mapData that the server emits,
 * because we already fetched a fresh, authoritative copy via
 * /api/mapcells on page-load and we don’t want it overwritten.
 */
export function initSocket () {
  /* socket.io client is exposed globally (bundled in index.html) */
  const socket = io();
  store.socket = socket;

  /* -------------------------------------------------------------- */
  /* initial handshake                                               */
  /* -------------------------------------------------------------- */
  socket.on('initState', data => {
    // mapId is still useful (e.g. for future API calls)
    store.socketMapId = data.mapId;
    // but DO NOT touch store.mapData here
    store.unit = data.unit;
    renderScene();
  });

  /* -------------------------------------------------------------- */
  /* realtime game ticks                                             */
  /* -------------------------------------------------------------- */
  socket.on('gameUpdate', data => {
    // keep units in sync
    store.unit = data.unit;
    // ignore data.mapData to avoid reverting terrain colours
    renderScene();
  });

  /* -------------------------------------------------------------- */
  /* diagnostics                                                     */
  /* -------------------------------------------------------------- */
  socket.on('connect_error', err => console.warn('[socket] connect_error', err));
  socket.on('disconnect',     ()  => console.log('[socket] disconnected'));
}

/* ------------------------------------------------------------------ */
/* helper                                                             */
/* ------------------------------------------------------------------ */
export function setPath (col, row) {
  if (store.socket) store.socket.emit('setPath', { col, row });
}
