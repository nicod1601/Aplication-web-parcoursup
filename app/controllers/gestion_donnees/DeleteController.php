<?php

require_once '../app/core/Controller.php';
require_once '../app/repositories/FichierRepository.php';
require_once '../app/repositories/CandidatRepository.php';


class DeleteController extends Controller
{
	private FichierRepository $fichierRepository;

	public function __construct()
	{
		$this->fichierRepository = new FichierRepository();
	}

	/**
	 * Supprime un fichier et tous ses candidats associés
	 */
	public function deleteOne(): void
	{
		$data = json_decode(file_get_contents('php://input'), true);
		$idFichier = isset($data['id']) ? (int)$data['id'] : 0;

		if (!$idFichier) {
			$this->json(['success' => false, 'error' => 'ID manquant'], 400);
			return;
		}

		try {
			$pdo = \Repository::getInstance()->getPDO();
			$pdo->beginTransaction();

			// Suppression des spécialités des candidats du fichier
			$pdo->prepare("
				DELETE FROM Candidat_EnseignementSpecialite
				WHERE idCand IN (
					SELECT idCand FROM Candidat WHERE idFichier = :idFichier
				)
			")->execute([':idFichier' => $idFichier]);

			// Suppression des candidats du fichier
			$pdo->prepare("
				DELETE FROM Candidat WHERE idFichier = :idFichier
			")->execute([':idFichier' => $idFichier]);

			// Suppression du fichier
			$pdo->prepare("
				DELETE FROM Fichier WHERE idFichier = :idFichier
			")->execute([':idFichier' => $idFichier]);

			$pdo->commit();
			$this->json(['success' => true]);

		} catch (\Exception $e) {
			if (isset($pdo) && $pdo->inTransaction()) {
				$pdo->rollBack();
			}
			$this->json(['success' => false, 'error' => $e->getMessage()], 500);
		}
	}

	/**
	 * Supprime TOUTE la base de données (candidats + fichiers)
	 */
	public function deleteAll(): void
	{
		try {
			$pdo = \Repository::getInstance()->getPDO();
			$pdo->beginTransaction();

			$pdo->exec("DELETE FROM Candidat_EnseignementSpecialite");
			$pdo->exec("DELETE FROM Candidat");
			$pdo->exec("DELETE FROM Fichier");

			$pdo->commit();
			$this->json(['success' => true]);

		} catch (\Exception $e) {
			if (isset($pdo) && $pdo->inTransaction()) {
				$pdo->rollBack();
			}
			$this->json(['success' => false, 'error' => $e->getMessage()], 500);
		}
	}
}