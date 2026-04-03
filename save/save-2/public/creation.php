<?php
require_once '../app/controllers/CreationCompteController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new CreationCompteController();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->store();
} else {
    $controller->creation();
}
