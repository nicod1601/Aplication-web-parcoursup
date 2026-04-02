<?php
require_once '../app/controllers/CreationCompteController.php';

$controller = new CreationCompteController();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->store();
} else {
    $controller->creation();
}
