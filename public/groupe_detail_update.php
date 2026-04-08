<?php
require_once '../app/controllers/GroupeController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new GroupeController();
$controller->updateNoteDossierFromCodeSerieDip();