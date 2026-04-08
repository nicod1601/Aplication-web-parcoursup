<?php
// public/gestionnaire_data.php
// Retourne la liste des fichiers enregistrés en base de données

require_once '../app/repositories/FichierRepository.php';

if (session_status() === PHP_SESSION_NONE) session_start();

header('Content-Type: application/json');

try {
    $repo     = new FichierRepository();
    $fichiers = $repo->getAllFichiers();

    echo json_encode([
        'success'  => true,
        'fichiers' => $fichiers ?? [],
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
