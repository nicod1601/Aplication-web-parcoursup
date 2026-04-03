<?php

require_once '../app/controllers/PlatformeController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new PlatformeController();
$controller->platforme();