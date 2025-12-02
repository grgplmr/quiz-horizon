<?php
session_start();

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: admin.php?deleted=0');
    exit;
}

$quizId = trim($_POST['quiz_id'] ?? '');
$quizFile = trim($_POST['quiz_file'] ?? '');

if ($quizId === '' || $quizFile === '') {
    header('Location: admin.php?deleted=0');
    exit;
}

$quizFileName = basename($quizFile);
$quizFilePath = __DIR__ . '/../api/quizzes/' . $quizFileName;
$deletionSuccessful = true;

if (file_exists($quizFilePath) && !@unlink($quizFilePath)) {
    $deletionSuccessful = false;
}

$indexPath = __DIR__ . '/../api/quizzes/index.json';

if (!file_exists($indexPath)) {
    header('Location: admin.php?deleted=0');
    exit;
}

$indexJson = file_get_contents($indexPath);
$quizList = json_decode($indexJson, true);

if (!is_array($quizList)) {
    header('Location: admin.php?deleted=0');
    exit;
}

$newList = [];
foreach ($quizList as $entry) {
    if (!isset($entry['id']) || $entry['id'] !== $quizId) {
        $newList[] = $entry;
    }
}

$result = file_put_contents(
    $indexPath,
    json_encode($newList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

if ($result === false || !$deletionSuccessful) {
    header('Location: admin.php?deleted=0');
    exit;
}

header('Location: admin.php?deleted=1');
exit;
