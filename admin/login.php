<?php
session_start();
if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
    header('Location: /admin/index.php');
    exit;
}
?>
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HorizonBIA Quiz · Connexion</title>
    <link rel="stylesheet" href="../assets/main.css" />
    <link rel="stylesheet" href="./admin.css" />
    <style>
      .login-shell {
        max-width: 420px;
        margin: 80px auto;
      }
      .login-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 20px;
      }
      .login-card h1 {
        margin: 0 0 6px;
      }
      .login-card form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 12px;
      }
      .login-card input {
        width: 100%;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
      }
      .login-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .error {
        color: var(--danger);
        font-weight: 600;
      }
    </style>
  </head>
  <body class="theme-light">
    <div class="app-shell login-shell">
      <div class="back-link"><a href="https://horizonbia.com">← Retour à HorizonBIA.com</a></div>
      <div class="login-card">
        <div class="logo" style="cursor: pointer" onclick="window.location='/'">
          <span class="dot"></span>
          <div>
            <div>HorizonBIA Quiz</div>
            <div class="muted">Espace administrateur</div>
          </div>
        </div>
        <h1>Connexion admin</h1>
        <p class="muted">Identifiez-vous pour gérer les quiz.</p>
        <form id="login-form">
          <div>
            <label for="login">Identifiant</label>
            <input id="login" name="login" type="text" value="admin" required />
          </div>
          <div>
            <label for="password">Mot de passe</label>
            <input id="password" name="password" type="password" required />
          </div>
          <div class="login-actions">
            <button class="btn btn-primary" type="submit">Se connecter</button>
            <span id="login-status" class="error" style="display:none"></span>
          </div>
        </form>
      </div>
    </div>
    <script>
      const form = document.getElementById('login-form');
      const statusEl = document.getElementById('login-status');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusEl.style.display = 'none';
        const payload = {
          login: form.login.value,
          password: form.password.value,
        };
        const res = await fetch('/api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          window.location = '/admin/index.php';
        } else {
          statusEl.textContent = data.error || 'Identifiants invalides';
          statusEl.style.display = 'inline';
        }
      });
    </script>
  </body>
</html>
