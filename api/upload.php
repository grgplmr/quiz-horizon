<?php
header('Content-Type: application/json; charset=utf-8');
$quizzesDir = __DIR__ . '/quizzes';
if (!is_dir($quizzesDir)) {
    mkdir($quizzesDir, 0775, true);
}

function respond($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function nextFilename($category, $dir) {
    $files = glob($dir . '/' . $category . '-*.json');
    $max = 0;
    foreach ($files as $file) {
        if (preg_match('/-(\d+)\.json$/', $file, $m)) {
            $num = (int) $m[1];
            if ($num > $max) $max = $num;
        }
    }
    return sprintf('%s-%d.json', $category, $max + 1);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $files = glob($quizzesDir . '/*.json');
    $quizzes = [];
    foreach ($files as $file) {
        $json = json_decode(file_get_contents($file), true);
        $quizzes[] = [
            'file' => basename($file),
            'title' => $json['title'] ?? basename($file),
            'category' => $json['category'] ?? 'n/a',
            'questions' => isset($json['questions']) && is_array($json['questions']) ? count($json['questions']) : 0,
        ];
    }
    respond(['success' => true, 'quizzes' => $quizzes]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $file = basename($data['file'] ?? '');
    if (!$file) respond(['success' => false, 'error' => 'Nom de fichier manquant'], 400);
    $path = $quizzesDir . '/' . $file;
    if (!is_file($path)) respond(['success' => false, 'error' => 'Fichier introuvable'], 404);
    unlink($path);
    respond(['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Méthode non supportée'], 405);
}

if (!isset($_FILES['file'])) {
    respond(['success' => false, 'error' => 'Fichier CSV requis'], 400);
}

$csv = file_get_contents($_FILES['file']['tmp_name']);
$lines = array_filter(array_map('trim', preg_split('/\r?\n/', $csv)));
$questions = [];
foreach ($lines as $line) {
    $cols = array_map('trim', str_getcsv($line, ';'));
    if (count($cols) < 6) {
        continue; // skip invalid line
    }
    $questions[] = [
        'text' => $cols[0],
        'choices' => array_slice($cols, 1, 4),
        'answer' => max(0, ((int)$cols[5]) - 1),
        'explanation' => $cols[6] ?? '',
    ];
}

if (empty($questions)) {
    respond(['success' => false, 'error' => 'CSV vide ou invalide'], 400);
}

$title = trim($_POST['title'] ?? 'Quiz HorizonBIA');
$category = trim($_POST['category'] ?? 'autre');
$filename = nextFilename($category, $quizzesDir);
$data = [
    'title' => $title,
    'category' => $category,
    'questions' => $questions,
];
file_put_contents($quizzesDir . '/' . $filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
respond(['success' => true, 'file' => $filename]);
