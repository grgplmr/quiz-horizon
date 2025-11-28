<?php
session_start();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = '$2y$10$pO9pDUOsFdkDT7.Hkrk/u..5wONYxz3VUkFGqosrSZL0BOlzwYC5a'; // Mot de passe par défaut : bia2024

if (!function_exists('isAuthenticated')) {
    function isAuthenticated(): bool
    {
        return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
    }
}

if (isAuthenticated()) {
    header('Location: admin.php');
    exit;
}

$error = '';
$info = '';

if (isset($_GET['logged_out'])) {
    $info = 'Déconnecté avec succès.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login = trim($_POST['login'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($login === ADMIN_USERNAME && password_verify($password, ADMIN_PASSWORD_HASH)) {
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = ADMIN_USERNAME;
        $_SESSION['login_time'] = time();

        header('Location: admin.php');
        exit;
    }

    $error = 'Identifiants invalides. Merci de réessayer.';
}

$defaultCredentials = password_verify('bia2024', ADMIN_PASSWORD_HASH) ? 'admin / bia2024' : '';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion admin - HorizonBIA</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body class="page-auth">
  <div class="login-wrapper">
    <header class="login-header">
      <p class="eyebrow">Espace sécurisé</p>
      <h1>Connexion admin</h1>
      <p class="subtitle">Accédez au tableau de bord d'import des quiz.</p>
    </header>

    <?php if ($error): ?>
      <div class="alert alert-error" role="alert"><?php echo htmlspecialchars($error, ENT_QUOTES); ?></div>
    <?php endif; ?>

    <?php if ($info): ?>
      <div class="alert alert-info" role="status"><?php echo htmlspecialchars($info, ENT_QUOTES); ?></div>
    <?php endif; ?>

    <form method="POST" action="" class="card">
      <label for="login">Identifiant</label>
      <div class="input-row">
        <input type="text" id="login" name="login" autocomplete="username" required autofocus>
        <span class="input-hint">admin</span>
      </div>

      <label for="password">Mot de passe</label>
      <div class="input-row">
        <input type="password" id="password" name="password" autocomplete="current-password" required>
        <button type="button" class="ghost" id="togglePassword" aria-label="Afficher ou masquer le mot de passe">👁</button>
      </div>

      <?php if ($defaultCredentials): ?>
        <p class="helper">Identifiants par défaut : <strong><?php echo $defaultCredentials; ?></strong></p>
      <?php endif; ?>

      <button type="submit" class="primary full">Se connecter</button>
    </form>
  </div>
  <script src="admin.js"></script>
</body>
</html>
