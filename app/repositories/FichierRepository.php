<?php

require_once "../app/core/Repository.php";

class FichierRepository
{
	private $pdo;

	public function __construct()
	{
		$this->pdo = Repository::getInstance()->getPDO();
	}

	public function getAllFichiers(): ?array
	{
		$stmtFichier = $this->pdo->prepare("
			SELECT idFichier as id, nomFichier as nom, 
			       (anneeDeb || '-' || anneeFin) as annee
			FROM Fichier
			ORDER BY anneeDeb ASC
		");
		$stmtFichier->execute();
		return $stmtFichier->fetchAll(PDO::FETCH_ASSOC);
	}
}
