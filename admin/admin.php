<?php
session_start();

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

$username = $_SESSION['admin_username'] ?? 'admin';
$loginTime = $_SESSION['login_time'] ?? time();

$quizzesFile = __DIR__ . '/../api/quizzes/index.json';
$modules = [];
$totalQuizzes = 0;
$status = null;
$importMessage = null;
$importClass = 'alert-info';
$deleteMessage = null;
$deleteClass = 'alert-info';
$moveMessage = null;
$moveClass = 'alert-info';

if (file_exists($quizzesFile)) {
    $json = file_get_contents($quizzesFile);
    $decoded = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        $status = 'Le fichier des quiz est illisible (JSON invalide).';
        $decoded = [];
    }
} else {
    $status = 'Le fichier des quiz n\'existe pas encore.';
    $decoded = [];
}

$moduleOptions = [
    'aero' => 'Aérodynamique et mécanique du vol',
    'aeronefs' => 'Connaissance des aéronefs',
    'meteo' => 'Météorologie et aérologie',
    'nav' => 'Navigation, sécurité et réglementation',
    'histoire' => "Histoire de l'aéronautique et de l'espace",
    'anglais' => 'Anglais aéronautique',
];

if (isset($decoded['modules']) && is_array($decoded['modules'])) {
    $modules = $decoded['modules'];
    foreach ($modules as $module) {
        $totalQuizzes += isset($module['quizzes']) && is_array($module['quizzes']) ? count($module['quizzes']) : 0;
    }
} elseif (is_array($decoded) && array_keys($decoded) === range(0, count($decoded) - 1)) {
    $grouped = [];
    foreach ($decoded as $quiz) {
        $slug = $quiz['module'] ?? 'inconnu';
        if (!isset($grouped[$slug])) {
            $grouped[$slug] = [
                'slug' => $slug,
                'title' => $moduleOptions[$slug] ?? ucfirst($slug),
                'quizzes' => [],
            ];
        }

        $grouped[$slug]['quizzes'][] = [
            'id' => $quiz['id'] ?? '',
            'title' => $quiz['title'] ?? 'Sans titre',
            'description' => $quiz['description'] ?? '',
            'file' => $quiz['questionsFile'] ?? ($quiz['file'] ?? (($quiz['id'] ?? '') . '.json')),
        ];
    }

    $modules = array_values($grouped);
    $totalQuizzes = count($decoded);
}

foreach ($modules as $index => $module) {
    if (!isset($module['title']) && isset($module['slug'])) {
        $modules[$index]['title'] = $moduleOptions[$module['slug']] ?? $module['slug'];
    }
}

if (isset($_GET['import'])) {
    $type = $_GET['import'];
    if ($type === 'success') {
        $importMessage = 'Quiz importé avec succès.';
    } elseif ($type === 'updated') {
        $importMessage = 'Quiz mis à jour avec succès.';
    } elseif ($type === 'error') {
        $msg = $_GET['msg'] ?? 'Erreur inconnue.';
        $importMessage = 'Erreur lors de l\'import : ' . htmlspecialchars($msg, ENT_QUOTES);
        $importClass = 'alert-error';
    }
}

if (isset($_GET['deleted'])) {
    if ($_GET['deleted'] === '1') {
        $deleteMessage = 'Quiz supprimé avec succès.';
        $deleteClass = 'alert-success';
    } elseif ($_GET['deleted'] === '0') {
        $deleteMessage = 'Erreur lors de la suppression du quiz.';
        $deleteClass = 'alert-error';
    }
}

if (isset($_GET['moved'])) {
    if ($_GET['moved'] === '1') {
        $moveMessage = 'Quiz déplacé avec succès.';
        $moveClass = 'alert-success';
    } elseif ($_GET['moved'] === '0') {
        $moveMessage = 'Erreur lors du déplacement du quiz.';
        $moveClass = 'alert-error';
    }
}
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
  <header class="admin-topbar">
    <span class="admin-topbar-brand">HorizonBIA · Admin</span>
    <a class="btn-ghost" href="../">← Retour aux quiz</a>
  </header>
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
    <?php if ($importMessage): ?>
      <div class="alert <?php echo $importClass; ?>" role="status"><?php echo $importMessage; ?></div>
    <?php endif; ?>

    <?php if ($deleteMessage): ?>
      <div class="alert <?php echo $deleteClass; ?>" role="status"><?php echo htmlspecialchars($deleteMessage, ENT_QUOTES); ?></div>
    <?php endif; ?>

    <?php if ($moveMessage): ?>
      <div class="alert <?php echo $moveClass; ?>" role="status"><?php echo htmlspecialchars($moveMessage, ENT_QUOTES); ?></div>
    <?php endif; ?>

    <?php if ($status): ?>
      <div class="alert alert-info" role="status"><?php echo htmlspecialchars($status, ENT_QUOTES); ?></div>
    <?php endif; ?>

    <section class="stats-grid">
      <div class="card stat-card">
        <p class="eyebrow">Quiz disponibles</p>
        <h2><?php echo $totalQuizzes; ?></h2>
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

      <div class="module-accordion-actions">
        <button type="button" class="btn-ghost" id="expandAllModules">Développer tout</button>
        <button type="button" class="btn-ghost" id="collapseAllModules">Réduire tout</button>
      </div>

      <?php if ($totalQuizzes === 0): ?>
        <p>Aucun quiz détecté pour le moment.</p>
      <?php else: ?>
        <div class="module-accordion">
          <?php foreach ($modules as $module): ?>
            <?php $quizzes = $module['quizzes'] ?? []; ?>
            <?php $quizCount = is_array($quizzes) ? count($quizzes) : 0; ?>
            <details class="module-panel" open>
              <summary class="module-panel-header">
                <div>
                  <p class="eyebrow">Module</p>
                  <div class="module-panel-title">
                    <span><?php echo htmlspecialchars($module['title'] ?? ($module['slug'] ?? 'Sans titre'), ENT_QUOTES); ?></span>
                    <?php if (!empty($module['slug'])): ?>
                      <span class="pill pill-muted"><?php echo htmlspecialchars($module['slug'], ENT_QUOTES); ?></span>
                    <?php endif; ?>
                  </div>
                </div>
                <div class="module-panel-meta">
                  <span class="pill"><?php echo $quizCount; ?> quiz<?php echo $quizCount > 1 ? 's' : ''; ?></span>
                </div>
              </summary>

              <div class="module-panel-body">
                <?php if ($quizCount === 0): ?>
                  <p class="helper">Aucun quiz dans ce module pour le moment.</p>
                <?php else: ?>
                  <div class="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Titre</th>
                          <th>Fichier</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <?php foreach ($quizzes as $quiz): ?>
                          <tr>
                            <td><code><?php echo htmlspecialchars($quiz['id'] ?? '—', ENT_QUOTES); ?></code></td>
                            <td><?php echo htmlspecialchars($quiz['title'] ?? 'Sans titre', ENT_QUOTES); ?></td>
                            <td><?php echo htmlspecialchars($quiz['file'] ?? ($quiz['questionsFile'] ?? 'N/A'), ENT_QUOTES); ?></td>
                            <td><?php echo htmlspecialchars($quiz['description'] ?? '', ENT_QUOTES); ?></td>
                            <td>
                              <?php $quizFileName = $quiz['questionsFile'] ?? ($quiz['file'] ?? (($quiz['id'] ?? '') . '.json')); ?>
                              <?php $currentModule = $quiz['module'] ?? ($module['slug'] ?? ''); ?>
                              <form method="POST" action="move.php" class="quiz-move-form">
                                <input type="hidden" name="quiz_id" value="<?php echo htmlspecialchars($quiz['id'] ?? '', ENT_QUOTES); ?>">
                                <select name="new_module" class="quiz-move-select">
                                  <?php foreach ($moduleOptions as $value => $label): ?>
                                    <option value="<?php echo htmlspecialchars($value, ENT_QUOTES); ?>" <?php echo ($value === $currentModule) ? 'selected' : ''; ?>>
                                      <?php echo htmlspecialchars($label, ENT_QUOTES); ?>
                                    </option>
                                  <?php endforeach; ?>
                                </select>
                                <button type="submit" class="btn btn-secondary btn-sm">Déplacer</button>
                              </form>

                              <form
                                method="POST"
                                action="delete.php"
                                class="quiz-delete-form"
                                onsubmit="return confirm('Confirmer la suppression du quiz &quot;<?php echo htmlspecialchars($quiz['title'] ?? 'Sans titre', ENT_QUOTES); ?>&quot; ? Cette action est irréversible.');"
                              >
                                <input type="hidden" name="quiz_id" value="<?php echo htmlspecialchars($quiz['id'] ?? '', ENT_QUOTES); ?>">
                                <input type="hidden" name="quiz_file" value="<?php echo htmlspecialchars($quizFileName, ENT_QUOTES); ?>">
                                <button type="submit" class="btn btn-danger btn-sm">Supprimer</button>
                              </form>
                            </td>
                          </tr>
                        <?php endforeach; ?>
                      </tbody>
                    </table>
                  </div>
                <?php endif; ?>
              </div>
            </details>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>

    <section class="card">
        <div class="section-header">
          <div>
          <p class="eyebrow">Import CSV</p>
          <h3>Importer un nouveau quiz</h3>
          <p class="subtitle">Téléversez un fichier CSV pour générer un quiz JSON.</p>
          </div>
          <div class="input-row">
          <a class="ghost" href="template.csv">Voir le modèle CSV</a>
          <p class="helper">Format CSV attendu : en-tête <code>title;description;question;choix1;choix2;choix3;choix4;bonne_reponse(1-4);explication</code>, puis une ligne par question. La première ligne de question peut inclure le titre et la description du quiz. L'ancien format avec <code>#title</code> / <code>#description</code> reste accepté.</p>
          </div>
        </div>

      <form action="upload.php" method="POST" enctype="multipart/form-data" class="import-form">
        <div class="form-grid">
          <div class="form-control">
            <label for="module">Module</label>
            <select id="module" name="module" required>
              <?php foreach ($moduleOptions as $value => $label): ?>
                <option value="<?php echo htmlspecialchars($value, ENT_QUOTES); ?>"><?php echo htmlspecialchars($label, ENT_QUOTES); ?></option>
              <?php endforeach; ?>
            </select>
            <p class="input-hint">Sélectionnez le module associé au quiz.</p>
          </div>

          <div class="form-control">
            <label for="quiz_id">ID du quiz</label>
            <input type="text" id="quiz_id" name="quiz_id" placeholder="histoire-2">
            <p class="input-hint">Utilisé pour le nom du fichier JSON (lettres, chiffres, tirets, underscores). Laissez vide pour générer automatiquement un ID du type histoire-3, aero-1, etc.</p>
          </div>

          <div class="form-control">
            <label for="title">Titre</label>
            <input type="text" id="title" name="title" placeholder="Quiz Histoire #2">
            <p class="input-hint">Optionnel : utilisé si les colonnes <code>title</code>/<code>description</code> sont vides dans le CSV ou si l'ancien format <code>#title</code> est absent.</p>
          </div>

          <div class="form-control">
            <label for="description">Description courte</label>
            <input type="text" id="description" name="description" placeholder="20 questions pour réviser">
            <p class="input-hint">Optionnel : sert de secours si la colonne <code>description</code> ou la ligne <code>#description</code> n'est pas renseignée.</p>
          </div>

          <div class="form-control">
            <label for="csv_file">Fichier CSV</label>
            <input type="file" id="csv_file" name="csv_file" accept=".csv" required>
            <p class="input-hint">Délimiteur point-virgule ; 7 colonnes attendues.</p>
          </div>
        </div>

        <button type="submit" class="primary full">Importer le quiz</button>
      </form>
    </section>
  </main>
  <script src="admin.js"></script>
</body>
</html>
