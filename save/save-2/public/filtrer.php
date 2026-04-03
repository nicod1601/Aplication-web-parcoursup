<?php
require_once '../app/controllers/FiltrerController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new FiltrerController();
$controller->filtrer();
