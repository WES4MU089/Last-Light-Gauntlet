/* public/js/letterCompose.js
 * GUI composer logic:
 *   • live 5 000-character counter
 *   • extracts JWT from ?token=  to include sl_uuid
 *   • POST /letters then shows success panel
 *   • “Back to Inbox” link retains the JWT so inbox loads without login
 * ---------------------------------------------------------------*/
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- element refs ---------- */
  const form    = document.getElementById('composeForm');
  const bodyTA  = document.getElementById('body');
  const counter = document.getElementById('count');
  const tpl     = document.getElementById('successTpl').content;

  /* ---------- decode JWT if present ---------- */
  const params   = new URLSearchParams(window.location.search);
  const jwtToken = params.get('token') || '';
  let   slUuid   = '';

  if (jwtToken) {
    try {
      const payload = JSON.parse(
        atob(jwtToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      slUuid = payload.SL_UUID || payload.sl_uuid || '';
    } catch (e) { /* ignore decode errors */ }
  }

  /* ---------- live counter ---------- */
  const updateCounter = () => counter.textContent = bodyTA.value.length;
  bodyTA.addEventListener('input', updateCounter);
  updateCounter();

  /* ---------- submit ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      toName   : document.getElementById('toName').value.trim(),
      fromName : document.getElementById('fromName').value.trim(),
      content  : bodyTA.value.trim(),
      sl_uuid  : slUuid,
      activeChar: "true"
    };

    if (!data.toName || !data.content) {
      alert('“To” and “Body” are required.');
      return;
    }

    try {
      const res = await fetch('/letters', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(data)
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error || 'Server error.');
        return;
      }

      /* build success panel */
      const panel = tpl.cloneNode(true);
      panel.querySelector('#backInbox').href =
        jwtToken ? '/letters/inbox?token=' + jwtToken : '/letters/inbox';

      form.replaceWith(panel);

    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  });
});
