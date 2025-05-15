/* public/js/letters.js
   – navigates “View” links inside SL media surfaces                */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.view-letter').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();                 // no pop-up
      window.location.href = link.href;   // load in current surface
    });
  });
});
