<?php
session_start();

function isAuthenticated(): bool
{
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

if (!isAuthenticated()) {
    header('Location: login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: admin.php?deleted=0&reason=invalid_request');
    exit;
}

$quizId = trim($_POST['quiz_id'] ?? '');

if ($quizId === '') {
    header('Location: admin.php?deleted=0&reason=invalid_request');
    exit;
}

$indexPath = __DIR__ . '/../api/quizzes/index.json';

if (!file_exists($indexPath)) {
    header('Location: admin.php?deleted=0&reason=not_found');
    exit;
}

$quizzesData = file_get_contents($indexPath);
$quizzes = json_decode($quizzesData, true);

if (!is_array($quizzes)) {
    header('Location: admin.php?deleted=0&reason=invalid_request');
    exit;
}

$foundIndex = null;
foreach ($quizzes as $index => $quiz) {
    if (($quiz['id'] ?? '') === $quizId) {
        $foundIndex = $index;
        break;
    }
}

if ($foundIndex === null) {
    header('Location: admin.php?deleted=0&reason=not_found');
    exit;
}

$questionsFile = $quizzes[$foundIndex]['questionsFile'] ?? '';
$questionsPath = __DIR__ . '/../api/quizzes/' . basename($questionsFile);

if ($questionsFile && file_exists($questionsPath)) {
    @unlink($questionsPath);
}

unset($quizzes[$foundIndex]);
$quizzes = array_values($quizzes);

$encoded = json_encode($quizzes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

if ($encoded === false || file_put_contents($indexPath, $encoded) === false) {
    header('Location: admin.php?deleted=0');
    exit;
}

header('Location: admin.php?deleted=1');
exit;
