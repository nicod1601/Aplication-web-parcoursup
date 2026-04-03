<?php

require_once "../app/core/Repository.php";

class AnneeRepository
{
	private $pdo;

	public function __construct()
	{
		$this->pdo = Repository::getInstance()->getPDO();
	}

	public function getAllAnnees()
	{
		$stmtAnnee = $this->pdo->prepare("
			SELECT DISTINCT anneedeb, anneefin 
			FROM Candidat 
			ORDER BY anneedeb DESC
		");
		$stmtAnnee->execute();
		$annees = $stmtAnnee->fetchAll(PDO::FETCH_ASSOC);

		return $annees;
	}
}
