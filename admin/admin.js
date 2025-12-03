(() => {
  const togglePassword = document.getElementById('togglePassword');
  const passwordField = document.getElementById('password');

  if (togglePassword && passwordField) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordField.getAttribute('type') === 'password';
      passwordField.setAttribute('type', isPassword ? 'text' : 'password');
      togglePassword.textContent = isPassword ? '🙈' : '👁';
    });
  }

  const modulePanels = Array.from(document.querySelectorAll('.module-panel'));
  const expandAll = document.getElementById('expandAllModules');
  const collapseAll = document.getElementById('collapseAllModules');

  const setAllPanels = (open) => {
    modulePanels.forEach((panel) => {
      if (open) {
        panel.setAttribute('open', '');
      } else {
        panel.removeAttribute('open');
      }
    });
  };

  if (expandAll) {
    expandAll.addEventListener('click', () => setAllPanels(true));
  }

  if (collapseAll) {
    collapseAll.addEventListener('click', () => setAllPanels(false));
  }
})();
