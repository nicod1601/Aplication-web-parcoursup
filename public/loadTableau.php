<?php
require_once '../app/controllers/tableau/LoadTableauController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new LoadTableauController();
$controller->load();