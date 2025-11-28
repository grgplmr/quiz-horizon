<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Location: admin.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion admin - HorizonBIA</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <div class="login-wrapper">
    <h1>Connexion admin</h1>
    <form method="POST" action="">
      <label for="login">Identifiant</label>
      <input type="text" id="login" name="login" required>

      <label for="password">Mot de passe</label>
      <input type="password" id="password" name="password" required>

      <button type="submit">Se connecter</button>
    </form>
  </div>
  <script src="admin.js"></script>
</body>
</html>
