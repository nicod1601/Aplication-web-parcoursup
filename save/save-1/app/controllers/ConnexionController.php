<?php
require_once '../app/core/Controller.php';
require_once '../app/repositories/CompteRepository.php';

class ConnexionController extends Controller
{
	private CompteRepository $repository;

	public function __construct()
	{
		$this->repository = new CompteRepository();
	}

	public function connexion(): void
	{
		$this->view('connexion', 'SAE S401 - Développement d\'une application complexe');
	}

	public function login(): void
	{
		$data = json_decode(file_get_contents('php://input'), true);

		if (empty($data['email']) || empty($data['password'])) {
			$this->json(['success' => false, 'error' => 'Champs manquants']);
			return;
		}

		$user = $this->repository->findByEmail($data['email']);

		if ($user && password_verify($data['password'], $user->getPasswordHashCompte())) {

			if (session_status() === PHP_SESSION_NONE) session_start();

			$_SESSION['user_id'] = $user->getId();
			$_SESSION['user_nom'] = $user->getNomCompte();
			$_SESSION['is_admin'] = $user->isAdmin();

			$this->json(['success' => true]);
		} else {
			$this->json(['success' => false, 'error' => 'Identifiants invalides']);
		}
	}
}