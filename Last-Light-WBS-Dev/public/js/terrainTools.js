// js/terrainTools.js
import { store } from './store.js';
import { renderScene } from './mapRenderer.js';

/**
 * Setup button event listeners for “Create Terrain,” “Edit Terrain,” and “Paint Terrain.”
 * This will be called once on page load (from adminClient.js).
 */
export function initTerrainTools() {
  const btnCreateTerrain  = document.getElementById('btnCreateTerrain');
  const btnEditTerrain    = document.getElementById('btnEditTerrain');
  const btnPaintTerrain   = document.getElementById('btnPaintTerrain');

  if (btnCreateTerrain) {
    btnCreateTerrain.addEventListener('click', () => {
      store.currentTool = 'createTerrain';
      showCreateTerrainUI();
    });
  }
  if (btnEditTerrain) {
    btnEditTerrain.addEventListener('click', () => {
      store.currentTool = 'editTerrain';
      showEditTerrainUI();
    });
  }
  if (btnPaintTerrain) {
    btnPaintTerrain.addEventListener('click', () => {
      store.currentTool = 'paintTerrain';
      showPaintTerrainUI();
    });
  }
}

/**
 * Display the UI for creating a new terrain type.
 */
function showCreateTerrainUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Create Terrain</h3>
    <div>
      <label>Name:</label>
      <input type="text" id="terrainName" />
    </div>
    <div>
      <label>Color:</label>
      <input type="color" id="terrainColor" value="#ccffcc"/>
    </div>
    <div>
      <label>Passable:</label>
      <input type="checkbox" id="terrainPassable" checked />
    </div>
    <div>
      <label>Movement Cost:</label>
      <input type="number" id="terrainCost" value="1" />
    </div>
    <!-- Additional Mods -->
    <div><label>Defense Mod: <input type="number" id="defenseMod" value="0" /></label></div>
    <div><label>Morale Mod: <input type="number" id="moraleMod" value="0" /></label></div>
    <div><label>Attrition Mod: <input type="number" id="attritionMod" value="0" /></label></div>
    <div><label>Flee Mod: <input type="number" id="fleeMod" value="0" /></label></div>
    <div><label>Perception Mod: <input type="number" id="perceptionMod" value="0" /></label></div>
    <button id="submitTerrainBtn">Save</button>
  `;
  const btn = document.getElementById('submitTerrainBtn');
  btn.addEventListener('click', createTerrain);
}

/**
 * Create a new terrain type by sending a POST to /api/terrain.
 * On success, refresh the terrain list.
 */
function createTerrain() {
  const name         = document.getElementById('terrainName').value;
  const color        = document.getElementById('terrainColor').value;
  const passable     = document.getElementById('terrainPassable').checked ? 1 : 0;
  const movementCost = parseInt(document.getElementById('terrainCost').value, 10) || 1;
  const defenseMod    = parseFloat(document.getElementById('defenseMod').value) || 0;
  const moraleMod     = parseFloat(document.getElementById('moraleMod').value) || 0;
  const attritionMod  = parseFloat(document.getElementById('attritionMod').value) || 0;
  const fleeMod       = parseFloat(document.getElementById('fleeMod').value) || 0;
  const perceptionMod = parseFloat(document.getElementById('perceptionMod').value) || 0;

  fetch('/api/terrain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      color,
      passable,
      movementCost,
      defenseMod,
      moraleMod,
      attritionMod,
      fleeMod,
      perceptionMod
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error creating terrain: ' + data.error);
      } else {
        alert(`Terrain created => ${data.name || data.Name}`);
        // Refresh terrain list after creation
        loadTerrainList().then(() => renderScene());
      }
    })
    .catch(err => console.error('Error creating terrain:', err));
}

/**
 * Display UI for editing a terrain type.
 */
function showEditTerrainUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Edit Terrain</h3>
    <div>
      <label>Choose terrain to edit:</label>
      <select id="editTerrainSelect">
        <option value="">Loading list...</option>
      </select>
    </div>
    <hr />
    <div><label>Name: <input type="text" id="editTerrainName" /></label></div>
    <div><label>Color: <input type="color" id="editTerrainColor" /></label></div>
    <div><label>Passable: <input type="checkbox" id="editTerrainPassable" /></label></div>
    <div><label>Movement Cost: <input type="number" id="editTerrainMovementCost" value="1" /></label></div>
    <div><label>Defense Mod: <input type="number" id="editDefenseMod" value="0" /></label></div>
    <div><label>Morale Mod: <input type="number" id="editMoraleMod" value="0" /></label></div>
    <div><label>Attrition Mod: <input type="number" id="editAttritionMod" value="0" /></label></div>
    <div><label>Flee Mod: <input type="number" id="editFleeMod" value="0" /></label></div>
    <div><label>Perception Mod: <input type="number" id="editPerceptionMod" value="0" /></label></div>
    <button id="updateTerrainBtn">Update Terrain</button>
  `;

  loadTerrainList().then(() => {
    populateTerrainSelect();
  });

  setTimeout(() => {
    const btn = document.getElementById('updateTerrainBtn');
    btn.addEventListener('click', updateTerrain);
  }, 0);
}

/**
 * Populate the dropdown for editing terrain using store.terrainList.
 */
function populateTerrainSelect() {
  const sel = document.getElementById('editTerrainSelect');
  sel.innerHTML = '<option value="">-- select --</option>';
  store.terrainList.forEach(t => {
    sel.innerHTML += `<option value="${t.terrain_id}">${t.name}</option>`;
  });
  sel.addEventListener('change', () => {
    const selectedId = parseInt(sel.value, 10);
    const terr = store.terrainList.find(t => t.terrain_id === selectedId);
    if (terr) {
      document.getElementById('editTerrainName').value = terr.name;
      document.getElementById('editTerrainColor').value = terr.color || '#cccccc';
      document.getElementById('editTerrainPassable').checked = !!terr.passable;
      document.getElementById('editTerrainMovementCost').value = terr.movementCost || 1;
      document.getElementById('editDefenseMod').value = terr.defenseMod || 0;
      document.getElementById('editMoraleMod').value = terr.moraleMod || 0;
      document.getElementById('editAttritionMod').value = terr.attritionMod || 0;
      document.getElementById('editFleeMod').value = terr.fleeMod || 0;
      document.getElementById('editPerceptionMod').value = terr.perceptionMod || 0;
    }
  });
}

/**
 * Update the selected terrain type.
 */
function updateTerrain() {
  const sel = document.getElementById('editTerrainSelect');
  const selectedId = parseInt(sel.value, 10);
  if (!selectedId) {
    alert('Please select a terrain to edit.');
    return;
  }
  const payload = {
    name: document.getElementById('editTerrainName').value,
    color: document.getElementById('editTerrainColor').value,
    passable: document.getElementById('editTerrainPassable').checked ? 1 : 0,
    movementCost: parseInt(document.getElementById('editTerrainMovementCost').value, 10) || 1,
    defenseMod: parseFloat(document.getElementById('editDefenseMod').value) || 0,
    moraleMod: parseFloat(document.getElementById('editMoraleMod').value) || 0,
    attritionMod: parseFloat(document.getElementById('editAttritionMod').value) || 0,
    fleeMod: parseFloat(document.getElementById('editFleeMod').value) || 0,
    perceptionMod: parseFloat(document.getElementById('editPerceptionMod').value) || 0
  };

  fetch(`/api/terrain/${selectedId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error updating terrain: ' + data.error);
      } else {
        alert(`Terrain updated => ${data.name || data.Name}`);
        // Refresh terrain list after update to reflect the new color in the app
        loadTerrainList().then(() => renderScene());
      }
    })
    .catch(err => {
      console.error('Error updating terrain:', err);
      alert('Error updating terrain (check console)');
    });
}

/**
 * Load all terrain from /api/terrain and store in store.terrainList.
 */
export function loadTerrainList() {
  return fetch('/api/terrain')
    .then(res => res.json())
    .then(list => {
      store.terrainList = list;
      console.log('Loaded terrain list:', list);
      return list;
    })
    .catch(err => {
      console.error('Error loading terrain list:', err);
      alert('Error loading terrain list');
      return [];
    });
}

/**
 * Paint Terrain UI - allows selection of terrain for painting and brush settings.
 */
function showPaintTerrainUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Paint Terrain</h3>
    <p>Select a terrain, set brush size (radius), then left-click+drag on map.</p>
    <div>
      <label>Brush Size: 
        <input type="number" id="brushSizeInput" value="0" min="0" max="10">
      </label>
    </div>
    <div style="margin-top:5px;">
      <label>
        <input type="checkbox" id="floodFillToggle"> Flood Fill (contiguous)
      </label>
    </div>
    <div id="terrainButtons" style="margin-top:10px;">Loading terrain list...</div>
  `;

  loadTerrainList().then(list => {
    const container = document.getElementById('terrainButtons');
    let html = '';
    list.forEach(t => {
      html += `
        <div style="margin-bottom:5px;">
          <button class="terBtn" data-id="${t.terrain_id}" style="background:${t.color || '#fff'}; color:#000;">
            ${t.name}
          </button>
        </div>
      `;
    });
    container.innerHTML = html;

    // Set up brush/flood fill toggles
    const brushSizeEl = document.getElementById('brushSizeInput');
    brushSizeEl.addEventListener('change', evt => {
      store.brushSize = parseInt(brushSizeEl.value, 10) || 0;
    });
    store.brushSize = parseInt(brushSizeEl.value, 10) || 0;

    const floodFillToggle = document.getElementById('floodFillToggle');
    floodFillToggle.addEventListener('change', evt => {
      store.floodFillEnabled = evt.target.checked;
    });

    // Terrain selection buttons
    document.querySelectorAll('.terBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.selectedTerrainId = parseInt(btn.dataset.id, 10);
        alert('Selected terrain: ' + store.selectedTerrainId);
      });
    });
  });
}

export default {
  initTerrainTools
};
