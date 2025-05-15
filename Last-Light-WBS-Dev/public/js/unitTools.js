// js/unitTools.js
import { store } from './store.js';
import { renderScene } from './mapRenderer.js';

/**
 * Setup button listeners for unit features
 */
export function initUnitTools() {
  const btnCreateUnitType = document.getElementById('btnCreateUnitType');
  const btnEditUnitType   = document.getElementById('btnEditUnitType');
  const btnCreateUnit     = document.getElementById('btnCreateUnit');

  btnCreateUnitType.addEventListener('click', () => {
    store.currentTool = 'createUnitType';
    showCreateUnitTypeUI();
  });

  btnEditUnitType.addEventListener('click', () => {
    store.currentTool = 'editUnitType';
    showEditUnitTypeUI();
  });

  btnCreateUnit.addEventListener('click', () => {
    store.currentTool = 'createUnit';
    showCreateUnitUI();
  });
}

/**
 * Load all units from the server into store.units
 */
export function loadAllUnits() {
  return fetch('/api/units')
    .then(res => res.json())
    .then(data => {
      store.units = data;
      renderScene();
    })
    .catch(err => {
      console.error('Error fetching units:', err);
      alert('Could not load units!');
    });
}

/**
 * Create Unit Type
 */
function showCreateUnitTypeUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Create Unit Type</h3>
    <div>
      <label>Name:</label>
      <input type="text" id="unitName" />
    </div>
    <div>
      <label>Manpower:</label>
      <input type="number" id="unitManpower" value="100" />
    </div>
    <div>
      <label>Initial Food:</label>
      <input type="number" id="unitInitialFood" value="0" />
    </div>
    <div>
      <label>Initial Gold:</label>
      <input type="number" id="unitInitialGold" value="0" />
    </div>
    <div>
      <label>Movement Speed:</label>
      <input type="number" step="0.1" id="unitMoveSpeed" value="1.0" />
    </div>
    <div>
      <label>Upkeep Modifier:</label>
      <input type="number" step="0.1" id="unitUpkeepMod" value="1.0" />
    </div>
    <div>
      <label>Image Path:</label>
      <input type="text" id="unitImagePath" value="/images/units/army.png" />
    </div>
    <div>
      <label>Image Preview:</label>
      <img id="unitImagePreview" src="/images/units/army.png" style="max-width:100%; max-height:200px;" />
    </div>
    <button id="submitUnitTypeBtn">Create</button>
  `;
  setTimeout(() => {
    const imagePathInput = document.getElementById('unitImagePath');
    const imagePreview = document.getElementById('unitImagePreview');
    imagePathInput.addEventListener('input', () => {
      imagePreview.src = imagePathInput.value;
    });
    const btn = document.getElementById('submitUnitTypeBtn');
    btn.addEventListener('click', createUnitType);
  }, 0);
}

function createUnitType() {
  const name        = document.getElementById('unitName').value;
  const manpower    = parseInt(document.getElementById('unitManpower').value, 10) || 100;
  const initialFood = parseInt(document.getElementById('unitInitialFood').value, 10) || 0;
  const initialGold = parseInt(document.getElementById('unitInitialGold').value, 10) || 0;
  const moveSpeed   = parseFloat(document.getElementById('unitMoveSpeed').value) || 1.0;
  const upkeepMod   = parseFloat(document.getElementById('unitUpkeepMod').value) || 1.0;
  const imagePath   = document.getElementById('unitImagePath').value;

  fetch('/api/unittypes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      manpower,
      initialFood,
      initialGold,
      movementSpeed: moveSpeed,
      upkeepMod,
      imagePath
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error creating unit type: ' + data.error);
      } else {
        console.log('Unit type created:', data);
        alert(`Unit type created => ${data.name || data.Name}`);
      }
    })
    .catch(err => {
      console.error('Error creating unit type:', err);
      alert('Failed to create unit type (check console).');
    });
}

/**
 * Edit Unit Type
 */
function showEditUnitTypeUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Edit Unit Type</h3>
    <div>
      <label>Choose unit type to edit:</label>
      <select id="editUnitTypeSelect">
        <option value="">Loading list...</option>
      </select>
    </div>
    <hr />
    <div><label>Name: <input type="text" id="editUnitName" /></label></div>
    <div><label>Manpower: <input type="number" id="editUnitManpower" value="100" /></label></div>
    <div><label>Initial Food: <input type="number" id="editUnitInitialFood" value="0" /></label></div>
    <div><label>Initial Gold: <input type="number" id="editUnitInitialGold" value="0" /></label></div>
    <div><label>Movement Speed: <input type="number" step="0.1" id="editUnitMoveSpeed" value="1.0" /></label></div>
    <div><label>Upkeep Modifier: <input type="number" step="0.1" id="editUnitUpkeepMod" value="1.0" /></label></div>
    <div><label>Image Path: <input type="text" id="editUnitImagePath" value="/images/units/army.png" /></label></div>
    <div>
      <label>Image Preview:</label>
      <img id="editUnitImagePreview" src="/images/units/army.png" style="max-width:100%; max-height:200px;" />
    </div>
    <button id="updateUnitTypeBtn">Update Unit Type</button>
  `;

  // Load unit types
  fetch('/api/unittypes')
    .then(res => res.json())
    .then(list => {
      const sel = document.getElementById('editUnitTypeSelect');
      sel.innerHTML = `<option value="">-- select unit type --</option>`;
      list.forEach(u => {
        sel.innerHTML += `<option value="${u.unit_type_id}">${u.name}</option>`;
      });
      sel.addEventListener('change', () => {
        const selectedId = parseInt(sel.value, 10);
        const unitType = list.find(u => u.unit_type_id === selectedId);
        if (unitType) {
          document.getElementById('editUnitName').value = unitType.name;
          document.getElementById('editUnitManpower').value = unitType.manpower;
          document.getElementById('editUnitInitialFood').value = unitType.initialFood;
          document.getElementById('editUnitInitialGold').value = unitType.initialGold;
          document.getElementById('editUnitMoveSpeed').value = unitType.movementSpeed;
          document.getElementById('editUnitUpkeepMod').value = unitType.upkeepMod;
          document.getElementById('editUnitImagePath').value = unitType.imagePath;
          document.getElementById('editUnitImagePreview').src = unitType.imagePath;
        }
      });
    })
    .catch(err => {
      console.error('Error fetching unit type list:', err);
      alert('Error fetching unit type list');
    });

  setTimeout(() => {
    const btn = document.getElementById('updateUnitTypeBtn');
    btn.addEventListener('click', () => {
      const sel = document.getElementById('editUnitTypeSelect');
      const selectedId = parseInt(sel.value, 10);
      if (!selectedId) {
        alert('Please select a unit type to edit.');
        return;
      }
      const payload = {
        name: document.getElementById('editUnitName').value,
        manpower: parseInt(document.getElementById('editUnitManpower').value, 10) || 0,
        initialFood: parseInt(document.getElementById('editUnitInitialFood').value, 10) || 0,
        initialGold: parseInt(document.getElementById('editUnitInitialGold').value, 10) || 0,
        movementSpeed: parseFloat(document.getElementById('editUnitMoveSpeed').value) || 1.0,
        upkeepMod: parseFloat(document.getElementById('editUnitUpkeepMod').value) || 1.0,
        imagePath: document.getElementById('editUnitImagePath').value
      };

      fetch(`/api/unittypes/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) alert('Error updating unit type: ' + data.error);
          else alert(`Unit type updated => ${data.name}`);
        })
        .catch(err => {
          console.error('Error updating unit type:', err);
          alert('Error updating unit type (check console)');
        });
    });
  }, 0);
}

/**
 * Create (Place) a new Unit on the map
 */
function showCreateUnitUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Create Unit</h3>
    <div>
      <label>Select Unit Type:</label>
      <select id="createUnitTypeSelect">
        <option value="">Loading list...</option>
      </select>
    </div>
    <div>
      <label>Unit Name:</label>
      <input type="text" id="createUnitName" placeholder="Enter unit name" />
    </div>
    <div>
      <label>Manpower (increments of 100):</label>
      <input type="number" id="createUnitManpower" step="100" value="100" />
    </div>
    <div>
      <label>Ship Count:</label>
      <input type="number" id="createUnitShipCount" value="0" />
    </div>
    <div>
      <label>Owner Character:</label>
      <select id="createUnitOwnerCharacter">
        <option value="">-- select owner character --</option>
      </select>
    </div>
    <div>
      <label>Commander:</label>
      <select id="createUnitCommander">
        <option value="0">None</option>
      </select>
    </div>
    <button id="initiateUnitPlacementBtn">Create Unit & Place on Map</button>
  `;

  // Load unit types for the select
  fetch('/api/unittypes')
    .then(res => res.json())
    .then(list => {
      const sel = document.getElementById('createUnitTypeSelect');
      sel.innerHTML = `<option value="">-- select unit type --</option>`;
      list.forEach(u => {
        sel.innerHTML += `<option value="${u.unit_type_id}">${u.name}</option>`;
      });
    })
    .catch(err => {
      console.error('Error fetching unit types:', err);
      alert('Error fetching unit types');
    });

  // Populate the owner and commander dropdowns with characters
  fetch('/api/characters')
    .then(res => res.json())
    .then(list => {
      const ownerSelect = document.getElementById('createUnitOwnerCharacter');
      const commanderSelect = document.getElementById('createUnitCommander');

      ownerSelect.innerHTML = `<option value="">-- select owner character --</option>`;
      commanderSelect.innerHTML = `<option value="0">None</option>`;
      
      list.forEach(ch => {
        const optOwner = document.createElement('option');
        optOwner.value = ch.CharacterID;
        optOwner.text = ch.Name;
        ownerSelect.appendChild(optOwner);

        const optCommander = document.createElement('option');
        optCommander.value = ch.CharacterID;
        optCommander.text = ch.Name;
        commanderSelect.appendChild(optCommander);
      });
    })
    .catch(err => {
      console.error('Error fetching characters for unit assignment:', err);
    });

  // Set up event for unit placement with additional logging
  setTimeout(() => {
    const btn = document.getElementById('initiateUnitPlacementBtn');
    btn.addEventListener('click', () => {
      const sel = document.getElementById('createUnitTypeSelect');
      const unitTypeID = parseInt(sel.value, 10);
      if (!unitTypeID) {
        alert('Please select a unit type.');
        return;
      }
      const unitName = document.getElementById('createUnitName').value;
      if (!unitName) {
        alert('Please enter a unit name.');
        return;
      }
      const manpower = parseInt(document.getElementById('createUnitManpower').value, 10);
      if (manpower % 100 !== 0) {
        alert('Manpower must be in increments of 100.');
        return;
      }
      const shipCount = parseInt(document.getElementById('createUnitShipCount').value, 10);
      
      // Get owner character value without fallback to 0
      const ownerCharacterValue = document.getElementById('createUnitOwnerCharacter').value;
      if (!ownerCharacterValue) {
        alert('Please select an owner character.');
        return;
      }
      const ownerCharacterID = parseInt(ownerCharacterValue, 10);
      
      // Commander fallback to 0 is acceptable
      const commanderID = parseInt(document.getElementById('createUnitCommander').value, 10) || 0;

      // Log the values before storing
      console.log("Creating unit with values:", { unitTypeID, unitName, manpower, shipCount, ownerCharacterID, commanderID });
      
      // Store these in `store.pendingUnit` so our map can read them upon click
      store.pendingUnit = { unitTypeID, unitName, manpower, shipCount, ownerCharacterID, commanderID };
      store.placingUnit = true;
      alert('Now click on the hex grid where you want to place the unit.');
    });
  }, 0);
}

function placeUnitAtClick(evt) {
  evt.preventDefault();
  const rect = evt.currentTarget.getBoundingClientRect();
  const sx = evt.clientX - rect.left;
  const sy = evt.clientY - rect.top;
  const { camera } = store;
  const wx = (sx - camera.x) / camera.scale;
  const wy = (sy - camera.y) / camera.scale;
  const [col, row] = pixelToHex(wx, wy);

  // Log pending unit values at placement time
  console.log("Placing unit with pending unit:", store.pendingUnit);
  
  const { unitTypeID, unitName, manpower, shipCount, ownerCharacterID, commanderID } = store.pendingUnit;

  fetch('/api/units', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitTypeID, unitName, manpower, shipCount, col, row, ownerCharacterID, commanderID })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error creating unit: ' + data.error);
      } else {
        alert(`Unit created => ${data.UnitName}`);
      }
      return loadAllUnits();
    })
    .catch(err => {
      console.error('Error creating unit:', err);
      alert('Error creating unit (see console).');
    });

  store.placingUnit = false;
  store.pendingUnit = null;
  store.currentTool = null;
}
