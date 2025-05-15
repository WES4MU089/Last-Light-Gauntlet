// js/characterTools.js
import { store } from './store.js';

export function initCharacterTools() {
  const btnEditCharacter = document.getElementById('btnEditCharacter');
  btnEditCharacter.addEventListener('click', () => {
    store.currentTool = 'editCharacter';
    showEditCharacterUI();
  });
}

function showEditCharacterUI() {
  const toolBench = document.getElementById('toolBench');
  toolBench.innerHTML = `
    <h3>Edit Character</h3>
    <div>
      <label>Select Character:</label>
      <select id="editCharacterSelect">
        <option value="">Loading list...</option>
      </select>
    </div>
    <hr />
    <div>
      <label>Name: <input type="text" id="editCharacterName" /></label>
    </div>
    <div>
      <label>Description: <textarea id="editCharacterDescription"></textarea></label>
    </div>
    <div>
      <label>HouseID:</label>
      <select id="editCharacterHouseID">
        <option value="">-- select house --</option>
      </select>
    </div>
    <button id="updateCharacterBtn">Update Character</button>
  `;

  // Load characters for editing
  fetch('/api/characters')
    .then(res => res.json())
    .then(list => {
      const sel = document.getElementById('editCharacterSelect');
      sel.innerHTML = `<option value="">-- select character --</option>`;
      list.forEach(ch => {
        sel.innerHTML += `<option value="${ch.CharacterID}">${ch.Name}</option>`;
      });
      sel.addEventListener('change', () => {
        const selectedId = parseInt(sel.value, 10);
        const character = list.find(ch => ch.CharacterID === selectedId);
        if (character) {
          document.getElementById('editCharacterName').value = character.Name;
          document.getElementById('editCharacterDescription').value = character.Description;
          // Assuming the new HouseID field is now present in the character record:
          document.getElementById('editCharacterHouseID').value = character.HouseID || "";
        }
      });
    })
    .catch(err => {
      console.error('Error fetching characters:', err);
      alert('Error fetching characters');
    });

  // Load houses for the HouseID drop-down
  fetch('/api/houses')
    .then(res => res.json())
    .then(houses => {
      const houseSelect = document.getElementById('editCharacterHouseID');
      houseSelect.innerHTML = `<option value="">-- select house --</option>`;
      houses.forEach(house => {
        houseSelect.innerHTML += `<option value="${house.HouseID}">${house.HouseName}</option>`;
      });
    })
    .catch(err => {
      console.error('Error fetching houses:', err);
    });

  // Set up the update button
  setTimeout(() => {
    const btn = document.getElementById('updateCharacterBtn');
    btn.addEventListener('click', () => {
      const sel = document.getElementById('editCharacterSelect');
      const selectedId = parseInt(sel.value, 10);
      if (!selectedId) {
        alert('Please select a character to edit.');
        return;
      }
      const payload = {
        Name: document.getElementById('editCharacterName').value,
        Description: document.getElementById('editCharacterDescription').value,
        HouseID: parseInt(document.getElementById('editCharacterHouseID').value, 10) || null
      };

      fetch(`/api/characters/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) alert('Error updating character: ' + data.error);
          else alert('Character updated successfully');
        })
        .catch(err => {
          console.error('Error updating character:', err);
          alert('Error updating character (see console)');
        });
    });
  }, 0);
}
