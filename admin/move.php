<?php
session_start();

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: admin.php?moved=0&msg=method');
    exit;
}

$quizId = trim($_POST['quiz_id'] ?? '');
$newModule = trim($_POST['new_module'] ?? '');

$allowedModules = ['aero', 'aeronefs', 'meteo', 'nav', 'histoire', 'anglais'];
$moduleTitles = [
    'aero' => 'Aérodynamique et mécanique du vol',
    'aeronefs' => 'Connaissance des aéronefs',
    'meteo' => 'Météorologie et aérologie',
    'nav' => 'Navigation, sécurité et réglementation',
    'histoire' => "Histoire de l'aéronautique et de l'espace",
    'anglais' => 'Anglais aéronautique',
];

if ($quizId === '' || !in_array($newModule, $allowedModules, true)) {
    header('Location: admin.php?moved=0&msg=invalid');
    exit;
}

$indexPath = __DIR__ . '/../api/quizzes/index.json';

if (!file_exists($indexPath) || !is_readable($indexPath)) {
    header('Location: admin.php?moved=0&msg=index');
    exit;
}

$indexJson = file_get_contents($indexPath);

if ($indexJson === false) {
    header('Location: admin.php?moved=0&msg=index');
    exit;
}

$decoded = json_decode($indexJson, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
    header('Location: admin.php?moved=0&msg=json');
    exit;
}

$found = false;

if (isset($decoded['modules']) && is_array($decoded['modules'])) {
    $modules = $decoded['modules'];
    $targetIndex = null;

    foreach ($modules as $idx => $module) {
        if (($module['slug'] ?? null) === $newModule) {
            $targetIndex = $idx;
            break;
        }
    }

    foreach ($modules as $moduleIndex => $module) {
        if (!isset($module['quizzes']) || !is_array($module['quizzes'])) {
            continue;
        }

        foreach ($module['quizzes'] as $quizIndex => $quiz) {
            if (($quiz['id'] ?? '') === $quizId) {
                $found = true;
                $quiz['module'] = $newModule;

                unset($modules[$moduleIndex]['quizzes'][$quizIndex]);
                $modules[$moduleIndex]['quizzes'] = array_values($modules[$moduleIndex]['quizzes']);

                if ($targetIndex === null) {
                    $modules[] = [
                        'slug' => $newModule,
                        'title' => $moduleTitles[$newModule] ?? $newModule,
                        'quizzes' => [],
                    ];
                    $targetIndex = array_key_last($modules);
                }

                $modules[$targetIndex]['quizzes'][] = $quiz;
                break 2;
            }
        }
    }

    $decoded['modules'] = $modules;
} elseif (array_keys($decoded) === range(0, count($decoded) - 1)) {
    foreach ($decoded as &$quiz) {
        if (($quiz['id'] ?? '') === $quizId) {
            $quiz['module'] = $newModule;
            $found = true;
            break;
        }
    }
    unset($quiz);
}

if (!$found) {
    header('Location: admin.php?moved=0&msg=notfound');
    exit;
}

$result = file_put_contents(
    $indexPath,
    json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

if ($result === false) {
    header('Location: admin.php?moved=0&msg=write');
    exit;
}

header('Location: admin.php?moved=1');
exit;
