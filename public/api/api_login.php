<?php
session_start();
require_once __DIR__ . '/../../app/core/Repository.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['email']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'error' => 'Champs manquants']);
    exit;
}

try {
    $pdo = Repository::getInstance()->getPDO();

    $stmt = $pdo->prepare("SELECT * FROM Compte WHERE emailcompte = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($data['password'], $user['passcompte'])) {

        $_SESSION['user_id'] = $user['idcompte'];
        $_SESSION['user_nom'] = $user['nomcompte'];
        $_SESSION['is_admin'] = $user['isadmin'];

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Email ou mot de passe incorrect']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur : ' . $e->getMessage()]);
}

