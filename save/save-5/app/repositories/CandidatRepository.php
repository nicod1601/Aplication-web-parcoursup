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

    public function getCandidatsFiltres(int $anneeDeb, int $anneeFin, array $filtres): array
    {
        $conditions = ['c.anneeDeb = ?', 'c.anneeFin = ?'];
        $params     = [$anneeDeb, $anneeFin];

        // Type de bac
        if (!empty($filtres['typeBac'])) {
            $conditions[] = 'sd.codeSerieDip = ?';
            $params[]     = $filtres['typeBac'];
        }

        // Spécialités (Générale)
        if (!empty($filtres['speTerm1'])) {
            $conditions[] = 'es1.libEnsSpe = ?';
            $params[]     = $filtres['speTerm1'];
        }
        if (!empty($filtres['speTerm2'])) {
            $conditions[] = 'es2.libEnsSpe = ?';
            $params[]     = $filtres['speTerm2'];
        }
        if (!empty($filtres['speAbandon'])) {
            $conditions[] = 'es3.libEnsSpe = ?';
            $params[]     = $filtres['speAbandon'];
        }

        // Spécialité (STI2D/STMG)
        if (!empty($filtres['specialite'])) {
            $conditions[] = 'sp.libSpe = ?';
            $params[]     = $filtres['specialite'];
        }

        // Notes
        if (!empty($filtres['noteGlobaleMin'])) {
            $conditions[] = 'c.noteGlobale >= ?';
            $params[]     = $filtres['noteGlobaleMin'];
        }
        if (!empty($filtres['noteGlobaleMax'])) {
            $conditions[] = 'c.noteGlobale <= ?';
            $params[]     = $filtres['noteGlobaleMax'];
        }
        if (!empty($filtres['noteFicAvenirMin'])) {
            $conditions[] = 'c.noteFicheAvenir >= ?';
            $params[]     = $filtres['noteFicAvenirMin'];
        }
        if (!empty($filtres['noteFicAvenirMax'])) {
            $conditions[] = 'c.noteFicheAvenir <= ?';
            $params[]     = $filtres['noteFicAvenirMax'];
        }

        // Civilité / Bourse
        if (!empty($filtres['civilite'])) {
            $conditions[] = 'c.civilite = ?';
            $params[]     = $filtres['civilite'];
        }
        if (!empty($filtres['nvBourse'])) {
            $conditions[] = 'c.nvBoursCand = ?';
            $params[]     = $filtres['nvBourse'];
        }

        // Établissement / Localisation
        if (!empty($filtres['etablissement'])) {
            $conditions[] = 'e.nomEtab = ?';
            $params[]     = $filtres['etablissement'];
        }
        if (!empty($filtres['commune'])) {
            $conditions[] = 'l.nomCommu = ?';
            $params[]     = $filtres['commune'];
        }
        if (!empty($filtres['departement'])) {
            $conditions[] = 'l.nomDept = ?';
            $params[]     = $filtres['departement'];
        }
        if (!empty($filtres['pays'])) {
            $conditions[] = 'l.pays = ?';
            $params[]     = $filtres['pays'];
        }

        $where = implode(' AND ', $conditions);

        $stmt = $this->pdo->prepare("
            SELECT DISTINCT c.codeCand, c.nomCand, c.prenomCand, c.civilite, c.profilCand
            FROM Candidat c
                LEFT JOIN SerieDiplome sd  ON sd.idSerieDip = c.idSerieDip
                LEFT JOIN Specialite sp    ON sp.idSpe      = c.idSpe
                LEFT JOIN Etablissement e  ON e.idEtab      = c.idEtab
                LEFT JOIN Localisation l   ON l.idLoc       = e.idLoc
            WHERE $where
            ORDER BY c.nomCand
        ");

        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllCandidats() {
        $sql = "SELECT 
                c.codeCand,
                c.nomCand,
                c.prenomCand,
                c.civilite,
                c.profilCand,
                c.nvBoursCand,
                f.libFiliere,
                form.libFormation,
                e.nomEtab,
                l.nomCommu,
                l.nomDept,
                td.libTypeDip,
                sd.libSerieDip,
                c.noteGlobale,
                c.commentaire
            FROM Candidat c
            LEFT JOIN Filiere f ON c.idFiliere = f.idFiliere
            LEFT JOIN Formation form ON c.idFormation = form.idFormation
            LEFT JOIN Etablissement e ON c.idEtab = e.idEtab
            LEFT JOIN Localisation l ON e.idLoc = l.idLoc
            LEFT JOIN TypeDiplome td ON c.idTypeDip = td.idTypeDip
            LEFT JOIN SerieDiplome sd ON c.idSerieDip = sd.idSerieDip";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}