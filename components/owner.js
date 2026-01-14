// Consolidated owner page helpers
(function(){
  function setOwnerMeta() {
    const owner = { name: 'Jean Dupont', email: 'contact@roomrover.com' };
    const sidebar = document.querySelector('custom-owner-sidebar');
    if (!sidebar) return;
    // find the name element and update it if present
    const nameEl = sidebar.querySelector('h4');
    const roleEl = sidebar.querySelector('p');
    if (nameEl) nameEl.textContent = owner.name;
    if (roleEl) roleEl.textContent = 'Propriétaire';
  }

  function setupOwnerInteractions() {
    // Delegate clicks for owner actions
    document.addEventListener('click', function(e){
      const target = e.target.closest('.send-payment-link');
      if (target) {
        e.preventDefault();
        // In a real app we'd open a modal / call API
        alert('Lien de paiement envoyé au locataire (simulation)');
        return;
      }

      const rem = e.target.closest('.send-reminder');
      if (rem) {
        e.preventDefault();
        alert('Rappel envoyé au locataire (simulation)');
        return;
      }

      const del = e.target.closest('[data-owner-action="delete"]');
      if (del) {
        const ok = confirm('Confirmer la suppression de cet élément ?');
        if (!ok) e.preventDefault();
        return;
      }
    });
  }

  function init() {
    // Apply feather icons where needed
    if (window.feather) {
      try { window.feather.replace(); } catch(e){}
    }

    // Try to set owner meta a few times (component might render slightly later)
    let attempts = 0;
    const t = setInterval(() => {
      attempts++;
      setOwnerMeta();
      if (attempts > 6) clearInterval(t);
    }, 200);

    setupOwnerInteractions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
