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

$headerRow = fgetcsv($handle, 0, ';');
if ($headerRow === false) {
    redirect_error('Fichier CSV vide.');
}

$normalizedHeader = array_map(fn($cell) => strtolower(trim((string) $cell)), $headerRow);
$expectedHeader = [
    'title',
    'description',
    'question',
    'choix1',
    'choix2',
    'choix3',
    'choix4',
    'bonne_reponse(1-4)',
    'explication',
];

$questions = [];
$csvTitle = null;
$csvDescription = null;

if ($normalizedHeader === $expectedHeader) {
    $lineNumber = 1;

    while (($row = fgetcsv($handle, 0, ';')) !== false) {
        $lineNumber++;

        $rowTitle = $row[0] ?? '';
        $rowDescription = $row[1] ?? '';
        $qText = $row[2] ?? '';
        $c1 = $row[3] ?? '';
        $c2 = $row[4] ?? '';
        $c3 = $row[5] ?? '';
        $c4 = $row[6] ?? '';
        $bonneRaw = $row[7] ?? '';
        $explicationRaw = $row[8] ?? '';

        if ($title === '' && trim($rowTitle) !== '') {
            $title = trim($rowTitle);
        }

        if ($description === '' && trim($rowDescription) !== '') {
            $description = trim($rowDescription);
        }

        if (count(array_filter($row, fn($cell) => trim((string) $cell) !== '')) === 0) {
            continue;
        }

        $qText = trim($qText);
        if ($qText === '') {
            continue;
        }

        if (trim($c1) === '' && trim($c2) === '' && trim($c3) === '' && trim($c4) === '') {
            redirect_error('Ligne ' . $lineNumber . ' : question ou choix manquant.');
        }

        $bonne = (int) trim((string) $bonneRaw);
        if (!in_array($bonne, [1, 2, 3, 4], true)) {
            redirect_error('Ligne ' . $lineNumber . ' : bonne_reponse(1-4) invalide (doit être 1,2,3 ou 4).');
        }

        $questions[] = [
            'text' => $qText,
            'choices' => [$c1, $c2, $c3, $c4],
            'correctIndex' => $bonne - 1,
            'explanation' => $explicationRaw,
        ];
    }
} else {
    $rowNumber = 0;
    $sawMetaMarkers = false;
    $rows = [$headerRow];

    while (($row = fgetcsv($handle, 0, ';')) !== false) {
        $rows[] = $row;
    }

    foreach ($rows as $row) {
        $rowNumber++;
        $firstCell = trim($row[0] ?? '');

        if ($rowNumber === 1 && $firstCell !== '' && stripos($firstCell, 'question') !== false) {
            $sawMetaMarkers = true;
            continue;
        }

        if (count(array_filter($row, fn($cell) => $cell !== '' && $cell !== null)) === 0) {
            continue;
        }

        if (str_starts_with($firstCell, '#')) {
            $sawMetaMarkers = true;
            $key = strtolower(ltrim($firstCell, "# \t"));
            $value = trim($row[1] ?? '');

            if ($key === 'title' && $value !== '') {
                $csvTitle = $value;
            }

            if ($key === 'description' && $value !== '') {
                $csvDescription = $value;
            }

            continue;
        }

        $sawMetaMarkers = true;
        $questionText = $row[0] ?? '';
        $choice1 = $row[1] ?? '';
        $choice2 = $row[2] ?? '';
        $choice3 = $row[3] ?? '';
        $choice4 = $row[4] ?? '';
        $correct = (int) ($row[5] ?? 0);
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

    if (!$sawMetaMarkers) {
        redirect_error('Format CSV invalide (en-tête inconnu).');
    }
}

fclose($handle);

if ($csvTitle !== null && $csvTitle !== '') {
    $title = $csvTitle;
}

if ($csvDescription !== null && $csvDescription !== '') {
    $description = $csvDescription;
}

if ($title === '') {
    redirect_error('Titre manquant (ni dans le CSV, ni dans le formulaire).');
}

if ($description === '') {
    redirect_error('Description manquante.');
}

if (count($questions) === 0) {
    redirect_error('Aucune question détectée dans le fichier CSV.');
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
