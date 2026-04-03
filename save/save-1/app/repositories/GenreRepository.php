<?php

require_once "../app/core/Repository.php";

class GenreRepository
{
	private $pdo;

	public function __construct()
	{
		$this->pdo = Repository::getInstance()->getPDO();
	}

	public function getGenresFromAnnee($anneeDeb, $anneeFin): ?array
	{
		$stmtGenre = $this->pdo->prepare("
			SELECT civilite, COUNT(*) AS total
			FROM candidat
			WHERE anneeDeb = ? AND anneeFin = ?
			GROUP BY civilite
		");
		$stmtGenre->execute([$anneeDeb, $anneeFin]);
		$genres = $stmtGenre->fetchAll(PDO::FETCH_ASSOC);

		return $genres;
	}
}

