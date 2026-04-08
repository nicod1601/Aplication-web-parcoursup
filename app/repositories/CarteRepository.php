<?php
// app/repositories/CarteRepository.php

require_once '../app/core/Repository.php';

class CarteRepository
{
	private $pdo;

	public function __construct()
	{
		$this->pdo = Repository::getInstance()->getPDO();
	}

	public function getCandidatsForCarte(int $anneeDeb, int $anneeFin): array
	{
		$stmt = $this->pdo->prepare("
			SELECT
				c.idCand,
				c.codeCand,
				c.nomCand,
				c.prenomCand,
				c.civilite,
				c.profilCand,
				c.noteGlobale,
				c.noteLycee,
				sd.libSerieDip,
				sd.codeSerieDip,
				l.nomCommu,
				l.nomDept,
				l.pays,
				e.codePost,
				e.nomEtab
			FROM Candidat c
			JOIN SerieDiplome sd ON c.idSerieDip = sd.idSerieDip
			JOIN Etablissement e ON c.idEtab = e.idEtab
			JOIN Localisation l ON e.idLoc = l.idLoc
			WHERE c.anneeDeb = :anneeDeb AND c.anneeFin = :anneeFin
			ORDER BY sd.libSerieDip
		");
		$stmt->execute([':anneeDeb' => $anneeDeb, ':anneeFin' => $anneeFin]);
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	public function getSeriesForAnnee(int $anneeDeb, int $anneeFin): array
	{
		$stmt = $this->pdo->prepare("
			SELECT DISTINCT sd.codeSerieDip, sd.libSerieDip
			FROM Candidat c
			JOIN SerieDiplome sd ON c.idSerieDip = sd.idSerieDip
			WHERE c.anneeDeb = :anneeDeb AND c.anneeFin = :anneeFin
			ORDER BY sd.libSerieDip
		");
		$stmt->execute([':anneeDeb' => $anneeDeb, ':anneeFin' => $anneeFin]);
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}
}