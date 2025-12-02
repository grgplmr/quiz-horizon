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

function confirmDeleteQuiz(title) {
  return window.confirm('Supprimer le quiz "' + title + '" ? Cette action est irréversible.');
}
