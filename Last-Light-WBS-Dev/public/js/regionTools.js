// js/regionTools.js
import { store } from './store.js';

export function initRegionTools() {
  const btnCreateRegion = document.getElementById('btnCreateRegion');
  if (btnCreateRegion) {
    btnCreateRegion.addEventListener('click', () => {
      store.currentTool = 'createRegion';
      renderRegionForm();
    });
  }
  const btnEditRegion = document.getElementById('btnEditRegion');
  if (btnEditRegion) {
    btnEditRegion.addEventListener('click', () => {
      store.currentTool = 'editRegion';
      showEditRegionUI();
    });
  }
}

/**
 * Renders the Create Region form in the tool bench.
 */
function renderRegionForm() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Create Region</h3>
    <form id="regionForm">
      <label for="regionName">Region Name:</label><br>
      <input type="text" id="regionName" name="regionName" required /><br>
      <label for="regionColor">Region Color:</label><br>
      <input type="color" id="regionColor" name="regionColor" value="#ffffff" /><br>
      <label for="regionRulingHouse">Ruling House:</label><br>
      <select id="regionRulingHouse">
        <option value="0">NONE</option>
      </select><br><br>
      <button type="submit">Create Region</button>
      <button type="button" id="cancelRegionForm">Cancel</button>
    </form>
  `;

  // Populate the ruling house dropdown.
  loadHousesForRegion();

  const regionForm = document.getElementById('regionForm');
  regionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    createRegion();
  });
  document.getElementById('cancelRegionForm').addEventListener('click', () => {
    toolBench.innerHTML = '';
    store.currentTool = null;
  });
}

/**
 * Loads houses from /api/houses and populates the ruling house dropdown.
 */
function loadHousesForRegion() {
  fetch('/api/houses')
    .then(res => res.json())
    .then(data => {
      const sel = document.getElementById('regionRulingHouse');
      sel.innerHTML = `<option value="0">NONE</option>`;
      data.forEach(house => {
        sel.innerHTML += `<option value="${house.HouseID}">${house.HouseName}</option>`;
      });
    })
    .catch(err => console.error('Error loading houses for region:', err));
}

/**
 * Creates a new region by sending a POST request to /api/regions.
 */
function createRegion() {
  const regionName = document.getElementById('regionName').value.trim();
  const regionColor = document.getElementById('regionColor').value;
  const rulingHouse = document.getElementById('regionRulingHouse').value;

  if (!regionName) {
    alert("Region name cannot be empty.");
    return;
  }

  fetch('/api/regions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      regionName,
      regionColor,
      rulingHouse: parseInt(rulingHouse, 10)
    })
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => { throw new Error(text); });
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        alert("Error creating region: " + data.error);
      } else {
        alert("Region created successfully!");
      }
      document.getElementById('toolBench').innerHTML = '';
      store.currentTool = null;
    })
    .catch(err => {
      console.error("Error creating region:", err);
      alert("Error creating region: " + err.message);
      document.getElementById('toolBench').innerHTML = '';
      store.currentTool = null;
    });
}

/**
 * Renders the Edit Region UI.
 */
function showEditRegionUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Edit Region</h3>
    <div>
      <label>Select a region to edit:</label><br>
      <select id="editRegionSelect">
        <option value="">Loading...</option>
      </select>
    </div>
    <hr />
    <div>
      <label>Region Name:</label><br>
      <input type="text" id="editRegionName" />
    </div>
    <div>
      <label>Region Color:</label><br>
      <input type="color" id="editRegionColor" value="#ffffff" />
    </div>
    <div>
      <label>Ruling House:</label><br>
      <select id="editRegionRulingHouse">
        <option value="0">NONE</option>
      </select>
    </div>
    <br>
    <button id="updateRegionBtn">Update Region</button>
  `;

  fetch('/api/regions')
    .then(res => res.json())
    .then(regionList => {
      populateRegionDropdown(regionList);
      return fetch('/api/houses');
    })
    .then(res => res.json())
    .then(houseList => {
      populateHouseDropdown(houseList);
    })
    .catch(err => console.error('Error loading data for editRegionUI:', err));

  setTimeout(() => {
    document.getElementById('updateRegionBtn').addEventListener('click', updateRegion);
  }, 0);
}

function populateRegionDropdown(regionList) {
  const sel = document.getElementById('editRegionSelect');
  sel.innerHTML = `<option value="">-- select region --</option>`;
  regionList.forEach(r => {
    sel.innerHTML += `<option value="${r.RegionID}">${r.RegionName}</option>`;
  });
  sel.addEventListener('change', () => {
    const selectedId = parseInt(sel.value, 10);
    const region = regionList.find(x => x.RegionID === selectedId);
    if (region) {
      document.getElementById('editRegionName').value = region.RegionName;
      document.getElementById('editRegionColor').value = region.regionColor || '#ffffff';
      document.getElementById('editRegionRulingHouse').value = region.rulingHouse || 0;
    }
  });
}

function populateHouseDropdown(houseList) {
  const sel = document.getElementById('editRegionRulingHouse');
  sel.innerHTML = `<option value="0">NONE</option>`;
  houseList.forEach(h => {
    sel.innerHTML += `<option value="${h.HouseID}">${h.HouseName}</option>`;
  });
}

function updateRegion() {
  const sel = document.getElementById('editRegionSelect');
  const regionID = parseInt(sel.value, 10);
  if (!regionID) {
    alert('Please select a region to edit.');
    return;
  }
  const regionName = document.getElementById('editRegionName').value.trim();
  const regionColor = document.getElementById('editRegionColor').value;
  const rulingHouse = parseInt(document.getElementById('editRegionRulingHouse').value, 10) || 0;

  if (!regionName) {
    alert('Region name cannot be empty.');
    return;
  }

  fetch(`/api/regions/${regionID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regionName, regionColor, rulingHouse })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) alert('Error updating region: ' + data.error);
      else alert('Region updated successfully!');
    })
    .catch(err => {
      console.error('Error updating region:', err);
      alert('Error updating region (see console)');
    });
}

export default {
  initRegionTools
};
