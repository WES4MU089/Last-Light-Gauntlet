// js/houseTools.js
import { store } from './store.js';
import { renderScene } from './mapRenderer.js'; // or whichever function re-renders
// Note: be sure to import any other modules if needed, e.g. `loadAllUnits` or so

/**
 * Initialize House Tools: attach click handlers for Create House and Edit House.
 */
export function initHouseTools() {
  const btnCreateHouse = document.getElementById('btnCreateHouse');
  if (btnCreateHouse) {
    btnCreateHouse.addEventListener('click', () => {
      store.currentTool = 'createHouse';
      renderHouseForm();
    });
  }
  const btnEditHouse = document.getElementById('btnEditHouse');
  if (btnEditHouse) {
    btnEditHouse.addEventListener('click', () => {
      store.currentTool = 'editHouse';
      showEditHouseUI();
    });
  }
}

/**
 * Renders the Create House form in the tool bench.
 */
function renderHouseForm() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Create House</h3>
    <form id="houseForm">
      <div>
        <label for="houseName">House Name:</label><br>
        <input type="text" id="houseName" name="houseName" required />
      </div>
      <div>
        <label for="allianceID">Alliance ID:</label><br>
        <input type="number" id="allianceID" name="allianceID" placeholder="Optional" />
      </div>
      <div>
        <label for="hoh">Head of House (HoH):</label><br>
        <select id="hoh">
          <option value="0">NONE</option>
        </select>
      </div>
      <div>
        <label for="houseColor">House Color:</label><br>
        <input type="color" id="houseColor" name="houseColor" value="#ffffff" />
      </div>
      <div>
        <label for="houseRegion">Region:</label><br>
        <select id="houseRegion">
          <option value="0">NONE</option>
        </select>
      </div>
      <br>
      <button type="submit">Create House</button>
      <button type="button" id="cancelHouseForm">Cancel</button>
    </form>
  `;

  loadRegionsForHouse();
  loadCharactersForHouse();

  const houseForm = document.getElementById('houseForm');
  houseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    createHouse();
  });
  document.getElementById('cancelHouseForm').addEventListener('click', () => {
    toolBench.innerHTML = '';
    store.currentTool = null;
  });
}

/**
 * Loads regions from /api/regions and populates the houseRegion dropdown.
 */
function loadRegionsForHouse() {
  fetch('/api/regions')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('houseRegion');
      select.innerHTML = `<option value="0">NONE</option>`;
      data.forEach(region => {
        select.innerHTML += `<option value="${region.RegionID}">${region.RegionName}</option>`;
      });
    })
    .catch(err => console.error('Error loading regions for house:', err));
}

/**
 * Loads characters from /api/characters and populates the hoh dropdown.
 */
function loadCharactersForHouse() {
  fetch('/api/characters')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('hoh');
      select.innerHTML = `<option value="0">NONE</option>`;
      data.forEach(character => {
        select.innerHTML += `<option value="${character.CharacterID}">${character.Name}</option>`;
      });
    })
    .catch(err => console.error('Error loading characters for house:', err));
}

/**
 * Creates a new house by sending a POST request to /api/houses,
 * then re-fetches /api/houses so we see the updated color in store.houses.
 */
function createHouse() {
  const houseName = document.getElementById('houseName').value.trim();
  const allianceID = document.getElementById('allianceID').value;
  const hoh = document.getElementById('hoh').value;
  const houseColor = document.getElementById('houseColor').value;
  const region = document.getElementById('houseRegion').value;

  if (!houseName) {
    alert('House Name is required.');
    return;
  }

  const payload = {
    houseName,
    allianceID: allianceID ? parseInt(allianceID, 10) : null,
    hoh: hoh ? parseInt(hoh, 10) : 0,
    houseColor: houseColor || '#ffffff',
    region: region ? parseInt(region, 10) : 0
  };

  console.log('[DEBUG] Creating house with payload =>', payload);

  fetch('/api/houses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => { throw new Error(text); });
      }
      return response.json();
    })
    .then(data => {
      console.log('[DEBUG] Created house =>', data);
      if (data.error) {
        alert('Error creating house: ' + data.error);
      } else {
        alert('House created successfully!');
      }
      document.getElementById('toolBench').innerHTML = '';
      store.currentTool = null;

      // Re-fetch houses to ensure store.houses is updated with the new color
      refreshHousesFromServer();
    })
    .catch(err => {
      console.error('Error creating house:', err);
      alert('Error creating house: ' + err.message);
      document.getElementById('toolBench').innerHTML = '';
      store.currentTool = null;
    });
}

/**
 * Renders the Edit House UI.
 */
function showEditHouseUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Edit House</h3>
    <div>
      <label>Select a house to edit:</label><br>
      <select id="editHouseSelect">
        <option value="">Loading...</option>
      </select>
    </div>
    <hr />
    <div>
      <label>House Name:</label><br>
      <input type="text" id="editHouseName" />
    </div>
    <div>
      <label>Alliance ID:</label><br>
      <input type="number" id="editAllianceID" placeholder="Optional" />
    </div>
    <div>
      <label>Head of House (HoH):</label><br>
      <select id="editHoH">
        <option value="0">NONE</option>
      </select>
    </div>
    <div>
      <label>House Color:</label><br>
      <input type="color" id="editHouseColor" value="#ffffff" />
    </div>
    <div>
      <label>Region:</label><br>
      <select id="editHouseRegion">
        <option value="0">NONE</option>
      </select>
    </div>
    <br>
    <button id="updateHouseBtn">Update House</button>
  `;

  Promise.all([
    fetch('/api/houses').then(r => r.json()),
    fetch('/api/regions').then(r => r.json()),
    fetch('/api/characters').then(r => r.json())
  ])
    .then(([houseList, regionList, characterList]) => {
      populateHouseSelectEdit(houseList);
      populateRegionSelectEdit(regionList);
      populateCharacterSelectEdit(characterList);
    })
    .catch(err => console.error('Error loading data for editHouseUI:', err));

  setTimeout(() => {
    document.getElementById('updateHouseBtn').addEventListener('click', updateHouse);
  }, 0);
}

function populateHouseSelectEdit(houseList) {
  const sel = document.getElementById('editHouseSelect');
  sel.innerHTML = `<option value="">-- select house --</option>`;
  houseList.forEach(h => {
    sel.innerHTML += `<option value="${h.HouseID}">${h.HouseName}</option>`;
  });
  sel.addEventListener('change', () => {
    const houseID = parseInt(sel.value, 10);
    const house = houseList.find(x => x.HouseID === houseID);
    if (house) {
      document.getElementById('editHouseName').value = house.HouseName;
      document.getElementById('editAllianceID').value = house.AllianceID || '';
      document.getElementById('editHouseColor').value = house.HouseColor || '#ffffff';
      document.getElementById('editHouseRegion').value = house.RegionID || 0;
      document.getElementById('editHoH').value = house.HoH || 0;
    }
  });
}

function populateRegionSelectEdit(regionList) {
  const sel = document.getElementById('editHouseRegion');
  sel.innerHTML = `<option value="0">NONE</option>`;
  regionList.forEach(r => {
    sel.innerHTML += `<option value="${r.RegionID}">${r.RegionName}</option>`;
  });
}

function populateCharacterSelectEdit(characterList) {
  const sel = document.getElementById('editHoH');
  sel.innerHTML = `<option value="0">NONE</option>`;
  characterList.forEach(c => {
    sel.innerHTML += `<option value="${c.CharacterID}">${c.Name}</option>`;
  });
}

/**
 * Update an existing house, then re-fetch houses so store.houses is accurate.
 */
function updateHouse() {
  const sel = document.getElementById('editHouseSelect');
  const houseID = parseInt(sel.value, 10);
  if (!houseID) {
    alert('Please select a house to edit.');
    return;
  }
  const houseName = document.getElementById('editHouseName').value.trim();
  const allianceID = document.getElementById('editAllianceID').value;
  const hoh = parseInt(document.getElementById('editHoH').value, 10) || 0;
  const houseColor = document.getElementById('editHouseColor').value;
  const region = parseInt(document.getElementById('editHouseRegion').value, 10) || 0;

  if (!houseName) {
    alert('House Name cannot be empty.');
    return;
  }

  const payload = {
    houseName,
    allianceID: allianceID ? parseInt(allianceID, 10) : null,
    hoh,
    houseColor,
    region
  };

  console.log('[DEBUG] Updating houseID=' + houseID, 'payload=>', payload);

  fetch(`/api/houses/${houseID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      console.log('[DEBUG] Updated house response =>', data);
      if (data.error) {
        alert('Error updating house: ' + data.error);
      } else {
        alert('House updated successfully!');
      }
      // Re-fetch houses to ensure store.houses is updated with new color
      refreshHousesFromServer();
    })
    .catch(err => {
      console.error('Error updating house:', err);
      alert('Error updating house (see console).');
    });
}

/**
 * Helper to re-fetch houses from /api/houses, update store.houses,
 * and re-render to see new colors in the map.
 */
function refreshHousesFromServer() {
  console.log('[DEBUG] refreshHousesFromServer called...');
  fetch('/api/houses')
    .then(r => r.json())
    .then(houseList => {
      console.log('[DEBUG] Houses re-fetched =>', houseList);
      store.houses = houseList;
      // Re-render so tinted colors match any changes
      renderScene();
    })
    .catch(err => console.error('Error fetching updated houses:', err));
}
