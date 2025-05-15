// public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    //=========================================================
    // 1) SIMPLE TAB SWITCHING
    //=========================================================
    const tabButtons = document.querySelectorAll('.admin-tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
  
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove 'active' from all tab buttons
        tabButtons.forEach(b => b.classList.remove('active'));
        // Hide all .tab-content
        tabContents.forEach(tc => tc.classList.remove('active-tab'));
  
        // Mark this clicked button as active
        btn.classList.add('active');
        // Show the corresponding .tab-content
        const targetId = btn.dataset.tab;
        const contentEl = document.getElementById(targetId);
        if (contentEl) {
          contentEl.classList.add('active-tab');
        }
      });
    });
  
    //=========================================================
    // 2) VIEW CHARACTER MODAL (READ-ONLY)
    //=========================================================
    const viewCharModal = document.getElementById('viewCharModal');
    const viewCharClose = document.getElementById('viewCharClose');
    const viewCharBody = document.getElementById('viewCharBody');
  
    // Helper to build star bars
    function buildStars(currentValue, maxValue) {
      const filled = '✦'.repeat(currentValue);
      const empty = '✧'.repeat(maxValue - currentValue);
      return filled + empty;
    }
  
    // For each "View" button => build & show the read-only modal
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const charId = btn.dataset.charid;
        try {
          const res = await fetch(`/admin/character/${charId}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          if (!res.ok) {
            console.error('Failed to fetch character', res.status);
            return;
          }
          const data = await res.json();
  
          // fallback if missing
          const charImagePath = data.character.ImagePath || '/images/male.png';
  
          // Build the 2-col read-only snippet
          let html = `
            <div class="view-character-name">
              <h2>${data.character.Name}</h2>
            </div>
  
            <div class="view-char-container">
              <div class="view-char-col view-char-image">
                <img src="${charImagePath}" alt="Character Image" width="300" height="500" />
              </div>
              <div class="view-char-col view-char-details">
                <div class="view-char-row">
                  <div class="view-char-label">Age:</div>
                  <div class="view-char-value">${data.character.Age}</div>
                </div>
                <div class="view-char-row">
                  <div class="view-char-label">House:</div>
                  <div class="view-char-value">${data.character.House || 'N/A'}</div>
                </div>
                <div class="view-char-row">
                  <div class="view-char-label">Favor:</div>
                  <div class="view-char-value">${data.character.Favor || 0}</div>
                </div>
                <div class="view-char-row">
                  <div class="view-char-label">Description:</div>
                  <div class="view-char-value">${data.character.Description || ''}</div>
                </div>
              </div>
            </div>
  
            <div class="view-character-history-header">
              <h3>History</h3>
            </div>
            <div class="character-history-content">
              ${data.character.History || ''}
            </div>
            <br>
            <div class="view-character-attribute-header"><h3>Attributes</h3></div><br>
          `;
  
          // Attributes => up to 8 stars
          if (data.attributes && data.attributes.length) {
            html += `<div class="view-attributes-grid">`;
            data.attributes.forEach(attr => {
              const starBar = buildStars(attr.Value, 8);
              html += `
                <div class="view-attribute-item">
                  <div class="attr-name"><strong>${attr.AttributeName}</strong></div>
                  <div class="attr-stars">${starBar}</div>
                </div>
              `;
            });
            html += `</div>`;
          } else {
            html += `<p>No attributes allocated.</p>`;
          }
  
          // Skills => up to 4 stars
          html += `
            <br>
            <div class="view-character-skills-header"><h3>Skills</h3></div>
            <br>
          `;
          if (data.skills && data.skills.length) {
            html += `<div class="view-skills-grid">`;
            data.skills.forEach(skill => {
              const starBar = buildStars(skill.Value, 4);
              html += `
                <div class="view-skill-item">
                  <div class="skill-name"><strong>${skill.SkillName}</strong></div>
                  <div class="skill-stars">${starBar}</div>
                </div>
              `;
            });
            html += `</div>`;
          } else {
            html += `<p>No skills allocated.</p>`;
          }
  
          // Display in the modal
          viewCharBody.innerHTML = html;
          viewCharModal.classList.add('show');
        } catch (err) {
          console.error('Error fetching character data:', err);
        }
      });
    });
  
    // Close modal
    if (viewCharClose) {
      viewCharClose.addEventListener('click', () => {
        viewCharModal.classList.remove('show');
      });
    }
  
    //=========================================================
    // 3) APPROVE / DENY
    //=========================================================
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const charId = btn.dataset.charid;
        if (!confirm('Approve this character?')) return;
  
        try {
          const response = await fetch(`/admin/character/${charId}/approve`, {
            method: 'POST'
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            alert(`Failed to approve: ${errorData.error || response.statusText}`);
            return;
          }
          window.location.reload();
        } catch (err) {
          console.error('Approve error:', err);
          alert('Server error approving character.');
        }
      });
    });
  
    document.querySelectorAll('.deny-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const charId = btn.dataset.charid;
        if (!confirm('Deny this character?')) return;
  
        try {
          const response = await fetch(`/admin/character/${charId}/deny`, {
            method: 'POST'
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            alert(`Failed to deny: ${errorData.error || response.statusText}`);
            return;
          }
          window.location.reload();
        } catch (err) {
          console.error('Deny error:', err);
          alert('Server error denying character.');
        }
      });
    });
  
    //=========================================================
    // 4) COLOR-CODE THE STATUS DIV
    //=========================================================
    function colorCodeStatusDivs() {
      // For each .admin-card-status h4 => check if Approved/Denied/Pending
      document.querySelectorAll('.admin-card-status h4').forEach(h4 => {
        const statusText = h4.textContent.trim().toLowerCase();
        const parentDiv = h4.closest('.admin-card-status');
        if (!parentDiv) return;
  
        // Add the relevant class => .status-approved or .status-denied
        if (statusText === 'approved') {
          parentDiv.classList.add('status-approved');
        } else if (statusText === 'denied') {
          parentDiv.classList.add('status-denied');
        }
        // If it's "pending", do nothing => default style
      });
    }
  
    // Run color-coding on page load
    colorCodeStatusDivs();
  });
  