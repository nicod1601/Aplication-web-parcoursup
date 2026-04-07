<?php
require_once '../app/controllers/gestion_donnees/DeleteController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new DeleteController();
$action = $_GET['action'] ?? '';

if ($action === 'all') {
	$controller->deleteAll();
} elseif ($action === 'one') {
	$controller->deleteOne();
} else {
	header('Content-Type: application/json');
	http_response_code(400);
	echo json_encode(['success' => false, 'error' => 'Action inconnue']);
}