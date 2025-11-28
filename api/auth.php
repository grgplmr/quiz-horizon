<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

const ADMIN_LOGIN = 'admin';
const ADMIN_PASSWORD = 'HorizonBIA2025!';

function respond($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }
    $login = $input['login'] ?? '';
    $password = $input['password'] ?? '';

    $validLogin = ADMIN_LOGIN;
    $validPassword = getenv('HORIZONBIA_ADMIN_PASSWORD') ?: ADMIN_PASSWORD;

    if ($login === $validLogin && $password === $validPassword) {
        $_SESSION['is_admin'] = true;
        respond(['success' => true]);
    }

    respond(['success' => false, 'error' => 'Identifiants incorrects'], 401);
}

if ($method === 'DELETE') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    respond(['success' => true]);
}

respond(['success' => false, 'error' => 'Méthode non supportée'], 405);
