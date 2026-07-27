/* ============================================================
   Modal Component
   ============================================================ */
function openModal(title, bodyHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML    = bodyHTML;
  document.getElementById('modalBackdrop').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.add('hidden');
  document.getElementById('modalBody').innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
});
