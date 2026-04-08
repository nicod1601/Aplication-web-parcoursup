<?php
// public/gestionnaire_candidats.php
// Retourne les candidats d'un fichier donné (pour la fonctionnalité "Voir")

require_once '../app/core/Controller.php';
require_once '../app/repositories/FichierRepository.php';

if (session_status() === PHP_SESSION_NONE) session_start();

header('Content-Type: application/json');

$idFichier = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$idFichier) {
    echo json_encode(['success' => false, 'error' => 'ID manquant']);
    exit;
}

try {
    $repo      = new FichierRepository();
    $candidats = $repo->getCandidatsByFichier($idFichier);

    echo json_encode([
        'success'   => true,
        'candidats' => $candidats,
        'total'     => count($candidats),
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
