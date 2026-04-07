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
	public function getCandidatsByFichier(int $idFichier): array
	{
		$stmt = $this->pdo->prepare("
			SELECT
				c.codeCand,
				c.nomCand,
				c.prenomCand,
				c.civilite,
				c.profilCand,
				c.nvBoursCand,
				sd.codeSerieDip,
				sd.libSerieDip,
				e.nomEtab,
				l.nomCommu,
				l.nomDept,
				c.noteGlobale,
				c.noteFicheAvenir,
				c.noteLycee,
				c.noteDossier
			FROM Candidat c
				JOIN SerieDiplome sd ON c.idSerieDip = sd.idSerieDip
				LEFT JOIN Etablissement e ON c.idEtab = e.idEtab
				LEFT JOIN Localisation l ON e.idLoc = l.idLoc
			WHERE c.idFichier = :idFichier
			ORDER BY c.nomCand
		");
		$stmt->execute([':idFichier' => $idFichier]);
		return $stmt->fetchAll(\PDO::FETCH_ASSOC);
	}
}
