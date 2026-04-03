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

    public function getNbGenresFromAnnee($anneeDeb, $anneeFin): ?array
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

    public function getGenresFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $stmtCivilite = $this->pdo->prepare("
            SELECT DISTINCT civilite
            FROM Candidat
            WHERE anneeDeb = ? AND anneeFin = ?
            ORDER BY civilite ASC
        ");
        $stmtCivilite->execute([$anneeDeb, $anneeFin]);
        $civilites = $stmtCivilite->fetchAll(PDO::FETCH_ASSOC);

        return $civilites;
    }

    public function getNiveauxBourseFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $stmtCivilite = $this->pdo->prepare("
            SELECT DISTINCT nvBoursCand
            FROM Candidat
            WHERE anneeDeb = ? AND anneeFin = ?
            ORDER BY nvBoursCand ASC
        ");
        $stmtCivilite->execute([$anneeDeb, $anneeFin]);
        $nvBourse = $stmtCivilite->fetchAll(PDO::FETCH_ASSOC);

        return $nvBourse;
    }
}