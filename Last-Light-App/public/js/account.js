// public/js/account.js
// ==========================================================
//  Account page — list, "View", "Edit", and "Delete" handlers
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------ */
  /* 1) VIEW                                                */
  /* ------------------------------------------------------ */
  document.querySelectorAll('.view-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.charid;
      if (id) window.location.href = `/view-character/${id}`;
    })
  );

  /* ------------------------------------------------------ */
  /* 2) EDIT  →  /edit-character/:id                        */
  /* ------------------------------------------------------ */
  document.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      if (btn.disabled) return;             // skip approved characters
      const id = btn.dataset.charid;
      if (id) window.location.href = `/edit-character/${id}`;
    })
  );

  /* ------------------------------------------------------ */
  /* 3) DELETE                                              */
  /* ------------------------------------------------------ */
  document.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this character?')) return;

      try {
        const res = await fetch(`/account/character/${btn.dataset.charid}`, {
          method : 'DELETE',
          headers: { Accept: 'application/json' }
        });

        const j = await res.json().catch(() => ({}));
        if (res.ok && j.success) {
          location.reload();
        } else {
          throw new Error(j.error || res.statusText);
        }
      } catch (err) {
        console.error(err);
        alert(`Failed: ${err.message}`);
      }
    })
  );

});
