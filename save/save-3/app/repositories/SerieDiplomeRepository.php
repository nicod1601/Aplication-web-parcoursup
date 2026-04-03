<?php

require_once "../app/core/Repository.php";

class SerieDiplomeRepository
{
	private $pdo;

	public function __construct()
	{
		$this->pdo = Repository::getInstance()->getPDO();
	}

	public function getNbSeriesDiplomesFromAnnee($anneeDeb, $anneeFin): ?array
	{
		// Stats des différents diplômes
		$stmtDiplome = $this->pdo->prepare("
			SELECT serDip.codeSerieDip, COUNT(*) AS total
			FROM Candidat AS cand
				 INNER JOIN
				 SerieDiplome AS serDip ON serDip.idSerieDip = cand.idSerieDip
			WHERE cand.anneeDeb = ? AND cand.anneeFin = ?
			GROUP BY serDip.codeSerieDip
		");
		$stmtDiplome->execute([$anneeDeb, $anneeFin]);
		$nbDiplomes = $stmtDiplome->fetchAll(PDO::FETCH_ASSOC);

		return $nbDiplomes;
	}

    public function getCodeSeriesDiplomesFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $stmtDiplome = $this->pdo->prepare("
        	SELECT DISTINCT serDip.codeSerieDip
			FROM Candidat AS cand
				 INNER JOIN
				 SerieDiplome AS serDip ON serDip.idSerieDip = cand.idSerieDip
			WHERE cand.anneeDeb = ? AND cand.anneeFin = ?
			ORDER BY serDip.codeSerieDip ASC
        ");
        $stmtDiplome->execute([$anneeDeb, $anneeFin]);
        $codeDiplomes = $stmtDiplome->fetchAll(PDO::FETCH_ASSOC);

        return $codeDiplomes;
    }
}