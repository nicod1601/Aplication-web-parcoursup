<?php
require_once '../app/controllers/gestion_donnees/ImportController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new ImportController();
$controller->import();