// public/js/holdingTools.js

import { store } from './store.js';
import { renderScene } from './mapRenderer.js';

/**
 * Initialize Holding Tools: attach click handlers for both Create Holding and Edit Holding buttons.
 */
export function initHoldingTools() {
  const btnCreateHolding = document.getElementById('btnCreateHolding');
  if (btnCreateHolding) {
    btnCreateHolding.addEventListener('click', () => {
      store.currentTool = 'createHolding';
      showCreateHoldingUI();
    });
  }

  const btnEditHolding = document.getElementById('btnEditHolding');
  if (btnEditHolding) {
    btnEditHolding.addEventListener('click', () => {
      store.currentTool = 'editHolding';
      showEditHoldingUI();
    });
  }
}

/* ===============================
         CREATE HOLDING LOGIC
   =============================== */

/**
 * Renders the Create Holding UI in the #toolBench div.
 */
function showCreateHoldingUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Create Holding</h3>

    <div>
      <label>Holding Name:</label><br>
      <input type="text" id="holdingNameInput" placeholder="Holding Name" />
    </div>

    <div>
      <label>Settlement Tier (1-5):</label><br>
      <select id="settlementTierSelect">
        <option value="1">Tier 1</option>
        <option value="2">Tier 2</option>
        <option value="3">Tier 3</option>
        <option value="4">Tier 4</option>
        <option value="5">Tier 5</option>
      </select>
    </div>

    <div>
      <label>Defense Tier (1-5):</label><br>
      <select id="defenseTierSelect">
        <option value="1">Tier 1</option>
        <option value="2">Tier 2</option>
        <option value="3">Tier 3</option>
        <option value="4">Tier 4</option>
        <option value="5">Tier 5</option>
      </select>
    </div>

    <div>
      <label>Primary Resource:</label><br>
      <select id="primaryResourceSelect">
        <option value="1">Population</option>
        <option value="2">Food</option>
        <option value="3">Coin</option>
        <option value="4">Materials</option>
      </select>
    </div>

    <div>
      <label>Secondary Resource:</label><br>
      <select id="secondaryResourceSelect">
        <option value="1">Population</option>
        <option value="2">Food</option>
        <option value="3">Coin</option>
        <option value="4">Materials</option>
      </select>
    </div>

    <div>
      <label>House:</label><br>
      <select id="holdingHouseSelect">
        <option value="">Loading houses...</option>
      </select>
    </div>

    <div>
      <label>Region:</label><br>
      <select id="holdingRegionSelect">
        <option value="">Loading regions...</option>
      </select>
    </div>

    <div>
      <label>Ruling Character:</label><br>
      <select id="holdingRulerSelect">
        <option value="">(Optional)</option>
      </select>
    </div>

    <div>
      <label>Image Path:</label><br>
      <input type="text" id="holdingImagePath" value="/img/wbs/castle.png" />
    </div>
    <div>
      <label>Preview:</label><br>
      <img id="holdingImagePreview" src="/img/wbs/castle.png" style="max-width: 100px; max-height: 100px;" />
    </div>

    <button id="initiateHoldingPlacementBtn">Place Holding on Map</button>
  `;

  // Load reference data for houses, regions, and characters
  loadHouses().then(list => populateHouseSelect(list));
  loadRegions().then(list => populateRegionSelect(list));
  loadCharacters().then(list => populateCharacterSelect(list));

  setTimeout(() => {
    // Button: user clicks => we gather data & set store.placingHolding
    const btn = document.getElementById('initiateHoldingPlacementBtn');
    if (btn) {
      btn.addEventListener('click', onClickInitiatePlacement);
    }

    // Live preview for image path
    const imagePathInput = document.getElementById('holdingImagePath');
    const previewImg = document.getElementById('holdingImagePreview');
    imagePathInput.addEventListener('input', () => {
      previewImg.src = imagePathInput.value;
    });
  }, 0);
}

/**
 * Gathers form data, sets store.pendingHolding, and instructs user to click the map.
 */
function onClickInitiatePlacement() {
  const nameEl = document.getElementById('holdingNameInput');
  const settlementTierEl = document.getElementById('settlementTierSelect');
  const defenseTierEl = document.getElementById('defenseTierSelect');
  const primaryResEl = document.getElementById('primaryResourceSelect');
  const secondaryResEl = document.getElementById('secondaryResourceSelect');
  const houseEl = document.getElementById('holdingHouseSelect');
  const regionEl = document.getElementById('holdingRegionSelect');
  const rulerEl = document.getElementById('holdingRulerSelect');
  const imagePathEl = document.getElementById('holdingImagePath');

  const holdingName = nameEl.value.trim();
  if (!holdingName) {
    alert('Please enter a Holding Name!');
    return;
  }

  store.pendingHolding = {
    mapID: 1, // Adjust if needed
    holdingName,
    settlementTier: parseInt(settlementTierEl.value, 10) || 1,
    defenseTier: parseInt(defenseTierEl.value, 10) || 1,
    primaryResourceID: parseInt(primaryResEl.value, 10) || null,
    secondaryResourceID: parseInt(secondaryResEl.value, 10) || null,

    houseID: parseInt(houseEl.value, 10) || null,
    regionID: parseInt(regionEl.value, 10) || null,
    rulingCharacterID: parseInt(rulerEl.value, 10) || null,
    imagePath: imagePathEl.value.trim() || ''
  };

  store.placingHolding = true;
  store.currentTool = 'createHolding';

  alert('Now click on the hex grid where you want to place the Holding.');
}

/**
 * Actually sends a POST to create the holding once we have col/row from map click.
 */
export function createHoldingOnServer(col, row, holdingData) {
  const payload = {
    mapID: holdingData.mapID,
    holdingName: holdingData.holdingName,
    settlementTier: holdingData.settlementTier,
    defenseTier: holdingData.defenseTier,
    primaryResourceID: holdingData.primaryResourceID,
    secondaryResourceID: holdingData.secondaryResourceID,

    houseID: holdingData.houseID,
    regionID: holdingData.regionID,
    rulingCharacterID: holdingData.rulingCharacterID,
    imagePath: holdingData.imagePath,

    col,
    row
  };

  return fetch('/api/holdings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('Created Holding =>', data);
      return data;
    });
}

/**
 * Fetch all holdings, store in state, re-render scene.
 */
export function loadAllHoldings() {
  return fetch('/api/holdings')
    .then(res => res.json())
    .then(data => {
      store.holdings = data;
      renderScene();
    })
    .catch(err => {
      console.error('Failed to load holdings:', err);
    });
}

/* ===============================
         EDIT HOLDING LOGIC
   =============================== */

function showEditHoldingUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Edit Holding</h3>
    <div>
      <label>Select a holding to edit:</label><br>
      <select id="editHoldingSelect">
        <option value="">Loading holdings...</option>
      </select>
    </div>
    <hr />
    <div>
      <label>Holding Name:</label><br>
      <input type="text" id="editHoldingName" />
    </div>

    <div>
      <label>Settlement Tier (1-5):</label><br>
      <select id="editSettlementTier">
        <option value="1">Tier 1</option>
        <option value="2">Tier 2</option>
        <option value="3">Tier 3</option>
        <option value="4">Tier 4</option>
        <option value="5">Tier 5</option>
      </select>
    </div>

    <div>
      <label>Defense Tier (1-5):</label><br>
      <select id="editDefenseTier">
        <option value="1">Tier 1</option>
        <option value="2">Tier 2</option>
        <option value="3">Tier 3</option>
        <option value="4">Tier 4</option>
        <option value="5">Tier 5</option>
      </select>
    </div>

    <div>
      <label>Primary Resource:</label><br>
      <select id="editPrimaryResource">
        <option value="1">Population</option>
        <option value="2">Food</option>
        <option value="3">Coin</option>
        <option value="4">Materials</option>
      </select>
    </div>

    <div>
      <label>Secondary Resource:</label><br>
      <select id="editSecondaryResource">
        <option value="1">Population</option>
        <option value="2">Food</option>
        <option value="3">Coin</option>
        <option value="4">Materials</option>
      </select>
    </div>

    <div>
      <label>House:</label><br>
      <select id="editHoldingHouse">
        <option value="">(None)</option>
      </select>
    </div>
    <div>
      <label>Region:</label><br>
      <select id="editHoldingRegion">
        <option value="">(None)</option>
      </select>
    </div>
    <div>
      <label>Ruling Character:</label><br>
      <select id="editHoldingRuler">
        <option value="">(Optional)</option>
      </select>
    </div>

    <div>
      <label>Image Path:</label><br>
      <input type="text" id="editHoldingImagePath" value="/img/wbs/castle.png" />
    </div>
    <br>
    <button id="updateHoldingBtn">Update Holding</button>
    <button id="deleteHoldingBtn" style="margin-left:10px; background:red; color:#fff;">Delete Holding</button>
  `;

  Promise.all([
    fetch('/api/holdings').then(r => r.json()),
    fetch('/api/houses').then(r => r.json()),
    fetch('/api/regions').then(r => r.json()),
    fetch('/api/characters').then(r => r.json())
  ])
    .then(([holdings, houses, regions, characters]) => {
      populateHoldingSelectForEdit(holdings);
      populateHouseSelectForHoldingEdit(houses);
      populateRegionSelectForHoldingEdit(regions);
      populateCharacterSelectForHoldingEdit(characters);
    })
    .catch(err => console.error('Error loading data for editHoldingUI:', err));

  setTimeout(() => {
    document.getElementById('updateHoldingBtn').addEventListener('click', updateHolding);

    // Our delete button for removing the holding
    const deleteBtn = document.getElementById('deleteHoldingBtn');
    deleteBtn.addEventListener('click', onClickDeleteHolding);
  }, 0);
}

function populateHoldingSelectForEdit(holdings) {
  const sel = document.getElementById('editHoldingSelect');
  sel.innerHTML = `<option value="">-- select holding --</option>`;
  holdings.forEach(h => {
    sel.innerHTML += `<option value="${h.HoldingID}">${h.HoldingName}</option>`;
  });

  sel.addEventListener('change', () => {
    const holdingID = parseInt(sel.value, 10);
    const hold = holdings.find(x => x.HoldingID === holdingID);
    if (hold) {
      document.getElementById('editHoldingName').value = hold.HoldingName || '';
      document.getElementById('editSettlementTier').value = hold.SettlementTier || 1;
      document.getElementById('editDefenseTier').value = hold.DefenseTier || 1;
      document.getElementById('editPrimaryResource').value = hold.PrimaryResourceID || 1;
      document.getElementById('editSecondaryResource').value = hold.SecondaryResourceID || 1;

      document.getElementById('editHoldingHouse').value = hold.HouseID || '';
      document.getElementById('editHoldingRegion').value = hold.Region || '';
      document.getElementById('editHoldingRuler').value = hold.RulingCharacterID || '';
      document.getElementById('editHoldingImagePath').value = hold.ImagePath || '/img/wbs/castle.png';
    }
  });
}

function populateHouseSelectForHoldingEdit(houses) {
  const sel = document.getElementById('editHoldingHouse');
  sel.innerHTML = `<option value="">(None)</option>`;
  houses.forEach(h => {
    sel.innerHTML += `<option value="${h.HouseID}">${h.HouseName}</option>`;
  });
}

function populateRegionSelectForHoldingEdit(regions) {
  const sel = document.getElementById('editHoldingRegion');
  sel.innerHTML = `<option value="">(None)</option>`;
  regions.forEach(r => {
    sel.innerHTML += `<option value="${r.RegionID}">${r.RegionName}</option>`;
  });
}

function populateCharacterSelectForHoldingEdit(chars) {
  const sel = document.getElementById('editHoldingRuler');
  sel.innerHTML = `<option value="">(Optional)</option>`;
  chars.forEach(c => {
    sel.innerHTML += `<option value="${c.CharacterID}">${c.Name}</option>`;
  });
}

/**
 * PUT /api/holdings/:id
 */
function updateHolding() {
  const sel = document.getElementById('editHoldingSelect');
  const holdingID = parseInt(sel.value, 10);
  if (!holdingID) {
    alert('Please select a holding to edit.');
    return;
  }

  const payload = {
    holdingName: document.getElementById('editHoldingName').value.trim(),
    settlementTier: parseInt(document.getElementById('editSettlementTier').value, 10) || 1,
    defenseTier: parseInt(document.getElementById('editDefenseTier').value, 10) || 1,
    primaryResourceID: parseInt(document.getElementById('editPrimaryResource').value, 10) || null,
    secondaryResourceID: parseInt(document.getElementById('editSecondaryResource').value, 10) || null,

    houseID: parseInt(document.getElementById('editHoldingHouse').value, 10) || null,
    regionID: parseInt(document.getElementById('editHoldingRegion').value, 10) || null,
    rulingCharacterID: parseInt(document.getElementById('editHoldingRuler').value, 10) || null,
    imagePath: document.getElementById('editHoldingImagePath').value.trim() || ''
  };

  if (!payload.holdingName) {
    alert('Holding Name cannot be empty.');
    return;
  }

  fetch(`/api/holdings/${holdingID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error updating holding: ' + data.error);
      } else {
        alert('Holding updated successfully!');
      }
    })
    .catch(err => {
      console.error('Error updating holding:', err);
      alert('Error updating holding (see console).');
    });
}

/**
 * DELETE /api/holdings/:id
 */
function onClickDeleteHolding() {
  const sel = document.getElementById('editHoldingSelect');
  const holdingID = parseInt(sel.value, 10);
  if (!holdingID) {
    alert('Please select a holding to delete.');
    return;
  }

  const confirmDelete = confirm('Are you sure you want to delete this holding? This action cannot be undone.');
  if (!confirmDelete) return;

  fetch(`/api/holdings/${holdingID}`, {
    method: 'DELETE'
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      return res.json();
    })
    .then(deleted => {
      alert(`Holding "${deleted.HoldingName}" has been deleted.`);

      // Remove from store.holdings
      store.holdings = store.holdings.filter(h => h.HoldingID !== holdingID);

      // Re-render or refresh the UI
      showEditHoldingUI();
      renderScene();
    })
    .catch(err => {
      console.error('Error deleting holding:', err);
      alert('Failed to delete holding. Check console for details.');
    });
}

/* ===============================
        SHARED HELPER FUNCTIONS
   =============================== */
function loadHouses() {
  return fetch('/api/houses')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch houses');
      return res.json();
    })
    .catch(err => {
      console.error('Failed to load houses:', err);
      return [];
    });
}

function populateHouseSelect(houses) {
  const sel = document.getElementById('holdingHouseSelect');
  sel.innerHTML = '<option value="">(None)</option>';
  houses.forEach(h => {
    sel.innerHTML += `<option value="${h.HouseID}">${h.HouseName}</option>`;
  });
}

function loadRegions() {
  return fetch('/api/regions')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch regions');
      return res.json();
    })
    .catch(err => {
      console.error('Failed to load regions:', err);
      return [];
    });
}

function populateRegionSelect(regions) {
  const sel = document.getElementById('holdingRegionSelect');
  sel.innerHTML = '<option value="">(None)</option>';
  regions.forEach(r => {
    sel.innerHTML += `<option value="${r.RegionID}">${r.RegionName}</option>`;
  });
}

function loadCharacters() {
  return fetch('/api/characters')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch characters');
      return res.json();
    })
    .catch(err => {
      console.error('Failed to load characters:', err);
      return [];
    });
}

function populateCharacterSelect(chars) {
  const sel = document.getElementById('holdingRulerSelect');
  sel.innerHTML = '<option value="">(None)</option>';
  chars.forEach(c => {
    sel.innerHTML += `<option value="${c.CharacterID}">${c.Name}</option>`;
  });
}
