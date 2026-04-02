<?php
require_once '../app/controllers/ConnexionController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new ConnexionController();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->login();
} else {
    $controller->connexion();
}