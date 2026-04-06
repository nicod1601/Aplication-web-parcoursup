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
            $repo = new CandidatRepository();
            $data = $repo->getAllCandidats();

            if ($data === null) {
                throw new Exception('Erreur lors de la récupération des données');
            }

            $this->json($data, 200);
        } catch (Exception $e) {
            $this->json(['error' => $e->getMessage()], 500);
        }
    }
}