<?php
session_start();

function isAuthenticated(): bool
{
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

header('Content-Type: application/json');

if (!isAuthenticated()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => "Accès refusé. Merci de vous reconnecter."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Requête de suppression invalide.']);
    exit;
}

$quizId = trim($_POST['quiz_id'] ?? '');
$moduleSlug = trim($_POST['module_slug'] ?? '');

if ($quizId === '' || $moduleSlug === '') {
    echo json_encode(['success' => false, 'message' => 'Identifiants du quiz manquants.']);
    exit;
}

$indexPath = __DIR__ . '/../api/quizzes/index.json';

if (!file_exists($indexPath)) {
    echo json_encode(['success' => false, 'message' => 'Le fichier index.json est introuvable.']);
    exit;
}

$quizzesData = file_get_contents($indexPath);
$decoded = json_decode($quizzesData, true);

if (!is_array($decoded)) {
    echo json_encode(['success' => false, 'message' => 'Le contenu de index.json est invalide.']);
    exit;
}

$quizFileName = null;
$quizFound = false;

// Nouveau format : { modules: [ { slug, quizzes: [...] } ] }
if (isset($decoded['modules']) && is_array($decoded['modules'])) {
    foreach ($decoded['modules'] as $moduleIndex => $moduleData) {
        if (($moduleData['slug'] ?? '') !== $moduleSlug || !isset($moduleData['quizzes']) || !is_array($moduleData['quizzes'])) {
            continue;
        }

        foreach ($moduleData['quizzes'] as $quizIndex => $quizData) {
            if (($quizData['id'] ?? '') === $quizId) {
                $quizFileName = $quizData['file'] ?? ($quizData['questionsFile'] ?? null);
                unset($decoded['modules'][$moduleIndex]['quizzes'][$quizIndex]);
                $decoded['modules'][$moduleIndex]['quizzes'] = array_values($decoded['modules'][$moduleIndex]['quizzes']);
                $quizFound = true;
                break;
            }
        }

        break;
    }
} elseif (array_keys($decoded) === range(0, count($decoded) - 1)) {
    // Ancien format : simple tableau
    foreach ($decoded as $index => $quizData) {
        if (($quizData['id'] ?? '') === $quizId && ($quizData['module'] ?? '') === $moduleSlug) {
            $quizFileName = $quizData['questionsFile'] ?? ($quizData['file'] ?? null);
            unset($decoded[$index]);
            $decoded = array_values($decoded);
            $quizFound = true;
            break;
        }
    }
}

if (!$quizFound) {
    echo json_encode(['success' => false, 'message' => 'Quiz introuvable dans index.json.']);
    exit;
}

if ($quizFileName) {
    $questionsPath = __DIR__ . '/../api/quizzes/' . basename($quizFileName);
    if (file_exists($questionsPath) && !@unlink($questionsPath)) {
        echo json_encode(['success' => false, 'message' => 'Impossible de supprimer le fichier JSON du quiz.']);
        exit;
    }
}

$encoded = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

if ($encoded === false || file_put_contents($indexPath, $encoded) === false) {
    echo json_encode(['success' => false, 'message' => 'Échec de mise à jour de index.json.']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Quiz supprimé avec succès.']);
exit;
