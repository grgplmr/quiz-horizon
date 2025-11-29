<?php
session_start();

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

function redirect_error(string $message): void {
    header('Location: admin.php?import=error&msg=' . urlencode($message));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_error('Requête invalide.');
}

if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
    redirect_error('Fichier manquant.');
}

$module = $_POST['module'] ?? '';
$quizId = trim($_POST['quiz_id'] ?? '');
$title = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');

$allowedModules = ['aero', 'aeronefs', 'meteo', 'nav', 'histoire', 'anglais'];
if (!in_array($module, $allowedModules, true)) {
    redirect_error('Module invalide.');
}

$quizDir = __DIR__ . '/../api/quizzes';
$indexPath = $quizDir . '/index.json';
$indexData = [];

if (file_exists($indexPath)) {
    $indexRaw = file_get_contents($indexPath);
    $indexData = json_decode($indexRaw, true);
    if (!is_array($indexData)) {
        redirect_error('Index JSON illisible.');
    }
}

if ($quizId === '') {
    $highest = 0;

    foreach ($indexData as $item) {
        if (!isset($item['id'])) {
            continue;
        }

        if (preg_match('/^' . preg_quote($module, '/') . '-(\d+)$/', $item['id'], $matches)) {
            $highest = max($highest, (int) $matches[1]);
        }
    }

    foreach (glob($quizDir . '/' . $module . '-*.json') ?: [] as $filePath) {
        $base = basename($filePath);
        if (preg_match('/^' . preg_quote($module, '/') . '-(\d+)\.json$/', $base, $matches)) {
            $highest = max($highest, (int) $matches[1]);
        }
    }

    $quizId = $module . '-' . ($highest + 1);
}

if (!preg_match('/^[a-z0-9_-]+$/i', $quizId)) {
    redirect_error('ID du quiz invalide.');
}

$tmpPath = $_FILES['csv_file']['tmp_name'];
$handle = @fopen($tmpPath, 'r');
if ($handle === false) {
    redirect_error('Impossible de lire le fichier CSV.');
}

$questions = [];
$rowNumber = 0;
$csvTitle = null;
$csvDescription = null;

while (($row = fgetcsv($handle, 0, ';')) !== false) {
    $rowNumber++;
    $firstCell = trim($row[0] ?? '');
    if ($rowNumber === 1 && $firstCell !== '' && stripos($firstCell, 'question') !== false) {
        continue;
    }

    if (count(array_filter($row, fn($cell) => $cell !== '' && $cell !== null)) === 0) {
        continue;
    }

    if (str_starts_with($firstCell, '#')) {
        $key = strtolower(ltrim($firstCell, "# \t"));
        $value = trim($row[1] ?? '');

        if ($key === 'title') {
            if ($value !== '') {
                $csvTitle = $value;
            }
            continue;
        }

        if ($key === 'description') {
            if ($value !== '') {
                $csvDescription = $value;
            }
            continue;
        }

        continue;
    }

    $questionText = $row[0] ?? '';
    $choice1 = $row[1] ?? '';
    $choice2 = $row[2] ?? '';
    $choice3 = $row[3] ?? '';
    $choice4 = $row[4] ?? '';
    $correct = (int)($row[5] ?? 0);
    $explanation = $row[6] ?? '';

    if ($questionText === '' || $choice1 === '' || $choice2 === '' || $choice3 === '' || $choice4 === '') {
        redirect_error('Ligne ' . $rowNumber . ' : question ou choix manquant.');
    }

    if (!in_array($correct, [1, 2, 3, 4], true)) {
        redirect_error('Ligne ' . $rowNumber . ' : réponse correcte invalide (attendu 1-4).');
    }

    $questions[] = [
        'text' => $questionText,
        'choices' => [$choice1, $choice2, $choice3, $choice4],
        'correctIndex' => $correct - 1,
        'explanation' => $explanation,
    ];
}

fclose($handle);

if (count($questions) !== 20) {
    redirect_error('Le CSV doit contenir 20 questions.');
}

$title = $csvTitle ?? $title;
$description = $csvDescription ?? $description;

if ($title === '') {
    redirect_error('Le titre est requis (formulaire ou CSV).');
}

if ($description === '') {
    redirect_error('La description est requise (formulaire ou CSV).');
}

$quizData = [
    'id' => $quizId,
    'module' => $module,
    'title' => $title,
    'description' => $description,
    'questions' => $questions,
];

$jsonPath = __DIR__ . '/../api/quizzes/' . $quizId . '.json';
if (file_put_contents($jsonPath, json_encode($quizData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
    redirect_error('Échec d\'écriture du fichier JSON.');
}

$entry = [
    'id' => $quizId,
    'module' => $module,
    'title' => $title,
    'description' => $description,
    'questionsFile' => $quizId . '.json',
];

$updated = false;
foreach ($indexData as $key => $item) {
    if (isset($item['id']) && $item['id'] === $quizId) {
        $indexData[$key] = $entry;
        $updated = true;
        break;
    }
}

if (!$updated) {
    $indexData[] = $entry;
}

if (file_put_contents($indexPath, json_encode($indexData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
    redirect_error('Impossible de mettre à jour index.json.');
}

if ($updated) {
    header('Location: admin.php?import=updated');
    exit;
}

header('Location: admin.php?import=success');
exit;
