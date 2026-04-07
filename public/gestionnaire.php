<?php
require_once '../app/controllers/gestion_donnees/GestionnaireController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new GestionnaireController();
$controller->index();