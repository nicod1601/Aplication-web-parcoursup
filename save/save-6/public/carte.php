<?php
require_once '../app/controllers/CarteController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new CarteController();
$controller->index();
