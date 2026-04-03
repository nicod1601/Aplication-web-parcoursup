<?php
require_once '../app/core/Controller.php';
require_once '../app/entities/Compte.php';
require_once '../app/repositories/CompteRepository.php';
class CreationCompteController extends Controller
{
    private CompteRepository $repository;
    public function __construct()
    {
        $this->repository = new CompteRepository();
    }
	public function creation(): void
	{
		$this->view('creation');
	}

    public function store(): void
    {
        $accounts = json_decode(file_get_contents('php://input'), true);

        if (!$accounts || !is_array($accounts)) {
            $this->json(['success' => false, 'error' => 'Aucune donnée valide reçue']);
            return;
        }

        try {
            foreach ($accounts as $userData) {
                $hash = password_hash($userData['passCompte'], PASSWORD_BCRYPT);

                $compte = new Compte(
                    null,
                    $userData['nomCompte'],
                    $userData['prenomCompte'],
                    $userData['emailCompte'],
                    $hash,
                    isset($userData['isAdmin']) && $userData['isAdmin']
                );

                $this->repository->create($compte);
            }

            $this->json(['success' => true, 'count' => count($accounts)]);
        } catch (Exception $e) {
            $this->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}
