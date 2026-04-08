<?php

require_once __DIR__ . '/../../core/Controller.php';
require_once __DIR__ . '/../../repositories/CandidatRepository.php';

class ExportController extends Controller {
    private $pdo;

    public function __construct() {
        $this->pdo = Repository::getInstance()->getPDO();
    }

    public function export()
    {
        try {
            $annee = $_GET['annee'] ?? null;
            $repo = new CandidatRepository();

            if ($annee !== null && $annee !== '') {
                if (!preg_match('/^\d{4}-\d{4}$/', $annee)) {
                    throw new InvalidArgumentException("Parametre annee invalide. Format attendu: YYYY-YYYY");
                }

                [$anneeDeb, $anneeFin] = array_map('intval', explode('-', $annee, 2));
                $data = $repo->getAllCandidats($anneeDeb, $anneeFin);
            } else {
                // Fallback: export global si aucune annee n'est fournie
                $data = $repo->getAllCandidats();
            }

            if ($data === null) {
                throw new Exception('Erreur lors de la récupération des données');
            }

            $this->json($data, 200);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }

}