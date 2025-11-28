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
})();
