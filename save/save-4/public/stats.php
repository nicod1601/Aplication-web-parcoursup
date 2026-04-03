<?php
require_once '../app/controllers/tableau/StatsController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new StatsController();
$controller->stats();