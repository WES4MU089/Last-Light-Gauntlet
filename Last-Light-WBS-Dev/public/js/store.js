// js/store.js

let listeners = [];
export const store = {
  socket: null,
  mapData: null,
  terrainList: [],
  units: [],
  holdings: [],
  houses: [],
  regions: [],
  unit: null,

  camera: { x: 0, y: 0, scale: 1.0 },

  currentTool: null,
  selectedTerrainId: null,
  brushSize: 0,
  floodFillEnabled: false,

  pendingUnit: null,
  placingUnit: false,
  pendingHolding: null,
  placingHolding: false,

  views: { territory: false, showTerrainOverlays: true },

  // subscribe / notify
  subscribe(fn) {
    listeners.push(fn);
  },
  notify() {
    listeners.forEach(fn => fn());
  },

  // setters that notify
  setMapData(data) {
    this.mapData = data;
    this.notify();
  },
  setTerrainList(list) {
    this.terrainList = list;
    this.notify();
  },
  setUnits(list) {
    this.units = list;
    this.notify();
  },
  setHoldings(list) {
    this.holdings = list;
    this.notify();
  },
  setHouses(list) {
    this.houses = list;
    this.notify();
  },
  setRegions(list) {
    this.regions = list;
    this.notify();
  },
  setUnit(u) {
    this.unit = u;
    this.notify();
  }
};
