<?php
session_start();

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

$username = $_SESSION['admin_username'] ?? 'admin';
$loginTime = $_SESSION['login_time'] ?? time();

$quizzesFile = __DIR__ . '/../api/quizzes/index.json';
$quizzes = [];
$status = null;

if (file_exists($quizzesFile)) {
    $json = file_get_contents($quizzesFile);
    $quizzes = json_decode($json, true) ?? [];
    if (json_last_error() !== JSON_ERROR_NONE) {
        $status = 'Le fichier des quiz est illisible (JSON invalide).';
        $quizzes = [];
    }
} else {
    $status = 'Le fichier des quiz n\'existe pas encore.';
}

$modules = array_unique(array_map(fn($quiz) => $quiz['module'] ?? 'Inconnu', $quizzes));
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Espace admin - HorizonBIA</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <header class="admin-header">
    <div>
      <p class="eyebrow">HorizonBIA · Admin</p>
      <h1>Tableau de bord</h1>
      <p class="subtitle">Gestion des quiz importés via le CSV.</p>
    </div>
    <div class="session-info">
      <p>Connecté en tant que <strong><?php echo htmlspecialchars($username, ENT_QUOTES); ?></strong></p>
      <p class="helper">Session ouverte depuis <?php echo date('d/m/Y H:i', $loginTime); ?></p>
      <a class="ghost" href="logout.php">Se déconnecter</a>
    </div>
  </header>

  <main class="admin-content">
    <?php if ($status): ?>
      <div class="alert alert-info" role="status"><?php echo htmlspecialchars($status, ENT_QUOTES); ?></div>
    <?php endif; ?>

    <section class="stats-grid">
      <div class="card stat-card">
        <p class="eyebrow">Quiz disponibles</p>
        <h2><?php echo count($quizzes); ?></h2>
        <p class="helper">Fichiers listés dans <code>api/quizzes/index.json</code></p>
      </div>
      <div class="card stat-card">
        <p class="eyebrow">Modules</p>
        <h2><?php echo count($modules); ?></h2>
        <p class="helper">Différents modules référencés</p>
      </div>
      <div class="card stat-card">
        <p class="eyebrow">Identifiants par défaut</p>
        <h2>admin / bia2024</h2>
        <p class="helper">À changer dans <code>admin/login.php</code> si besoin</p>
      </div>
    </section>

    <section class="card">
      <div class="section-header">
        <div>
          <p class="eyebrow">Fichiers JSON</p>
          <h3>Liste des quiz</h3>
          <p class="subtitle">Les fichiers doivent exister dans <code>api/quizzes</code>.</p>
        </div>
        <a class="primary" href="../api/quizzes/index.json">Voir le JSON brut</a>
      </div>

      <?php if (empty($quizzes)): ?>
        <p>Aucun quiz détecté pour le moment.</p>
      <?php else: ?>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Module</th>
                <th>Fichier</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($quizzes as $quiz): ?>
                <tr>
                  <td><code><?php echo htmlspecialchars($quiz['id'] ?? '—', ENT_QUOTES); ?></code></td>
                  <td><?php echo htmlspecialchars($quiz['title'] ?? 'Sans titre', ENT_QUOTES); ?></td>
                  <td><span class="pill"><?php echo htmlspecialchars($quiz['module'] ?? 'N/A', ENT_QUOTES); ?></span></td>
                  <td><?php echo htmlspecialchars($quiz['questionsFile'] ?? 'N/A', ENT_QUOTES); ?></td>
                  <td><?php echo htmlspecialchars($quiz['description'] ?? '', ENT_QUOTES); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </section>
  </main>
  <script src="admin.js"></script>
</body>
</html>
