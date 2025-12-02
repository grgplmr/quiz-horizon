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

function attachDeleteHandlers() {
  const deleteButtons = document.querySelectorAll('.js-delete-quiz');

  deleteButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const quizId = btn.dataset.quizId;
      const moduleSlug = btn.dataset.moduleSlug;
      const quizTitle = btn.dataset.quizTitle || quizId;

      const confirmed = window.confirm(
        `Confirmer la suppression du quiz "${quizTitle}" ?\nCette action est irréversible.`
      );

      if (!confirmed) {
        return;
      }

      btn.disabled = true;

      try {
        const response = await fetch('delete.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ quiz_id: quizId, module_slug: moduleSlug }).toString(),
        });

        const data = await response.json();

        if (data.success) {
          const row = btn.closest('tr');
          if (row) {
            row.remove();
          } else {
            btn.textContent = 'Supprimé';
          }
        } else {
          alert(data.message || 'Erreur lors de la suppression du quiz.');
          btn.disabled = false;
        }
      } catch (error) {
        console.error('Erreur de suppression', error);
        alert('Impossible de supprimer le quiz pour le moment.');
        btn.disabled = false;
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', attachDeleteHandlers);
