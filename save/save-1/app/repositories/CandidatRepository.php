<?php

require_once "../app/core/Repository.php";

class CandidatRepository
{
	private $pdo;

	public function __construct()
	{
		$this->pdo = Repository::getInstance()->getPDO();
	}

	public function getCandidatsFromAnnee($anneeDeb, $anneeFin): ?array
	{
		$stmtListe = $this->pdo->prepare("
			SELECT codeCand, nomCand, prenomCand, civilite, profilCand
			FROM candidat
			WHERE anneeDeb = ? AND anneeFin = ?
		");
		$stmtListe->execute([$anneeDeb, $anneeFin]);
		$candidats = $stmtListe->fetchAll(PDO::FETCH_ASSOC);

		return $candidats;
	}

	public function getNombreTotalFromAnnee($anneeDeb, $anneeFin): ?int
	{
		$stmtTotal = $this->pdo->prepare("
			SELECT COUNT(*) AS total 
			FROM candidat 
			WHERE anneeDeb = ? AND anneeFin = ?
		");
		$stmtTotal->execute([$anneeDeb, $anneeFin]);
		$total = $stmtTotal->fetchColumn();

		return $total;
	}
}