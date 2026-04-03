<?php
require_once '../app/controllers/ConnexionController.php';

$controller = new ConnexionController();


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->login();
} else {
    $controller->connexion();
}