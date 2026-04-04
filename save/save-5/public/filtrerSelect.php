<?php
require_once '../app/controllers/FiltrerController.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$controller = new FiltrerController();

if ( isset($_GET['typeBac'] ) )
    $controller->recupererDonneesFromTypeBac();
else
    $controller->recupererDonneesFromEtablissement();