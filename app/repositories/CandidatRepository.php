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
            SELECT 
                cand.codeCand, cand.civilite, cand.profilCand, 
                etab.nomEtab,
                loc.nomCommu, loc.nomDept, loc.pays,
                serieDip.codeSerieDip, serieDip.libSerieDip,
                spe.libSpe,
                -- Spécialités suivies (non abandonnées)
                (SELECT es.libEnsSpe FROM Candidat_EnseignementSpecialite ces 
                 JOIN EnseignementSpecialite es ON ces.idEnsSpe = es.idEnsSpe 
                 WHERE ces.idCand = cand.idCand AND ces.abandonnee = false LIMIT 1 OFFSET 0) as speTerm1,
                (SELECT es.libEnsSpe FROM Candidat_EnseignementSpecialite ces 
                 JOIN EnseignementSpecialite es ON ces.idEnsSpe = es.idEnsSpe 
                 WHERE ces.idCand = cand.idCand AND ces.abandonnee = false LIMIT 1 OFFSET 1) as speTerm2,
                (SELECT es.libEnsSpe FROM Candidat_EnseignementSpecialite ces 
                 JOIN EnseignementSpecialite es ON ces.idEnsSpe = es.idEnsSpe 
                 WHERE ces.idCand = cand.idCand AND ces.abandonnee = false LIMIT 1 OFFSET 2) as speTerm3,
                -- Spécialité abandonnée
                (SELECT es.libEnsSpe FROM Candidat_EnseignementSpecialite ces 
                 JOIN EnseignementSpecialite es ON ces.idEnsSpe = es.idEnsSpe 
                 WHERE ces.idCand = cand.idCand AND ces.abandonnee = true LIMIT 1) as speAbandon,
                cand.noteGlobale, cand.noteFicheAvenir, cand.noteLycee, cand.noteDossier, cand.commentaire 
            FROM candidat AS cand
                 INNER JOIN etablissement AS etab ON etab.idEtab = cand.idEtab
                 INNER JOIN localisation AS loc ON loc.idLoc = etab.idLoc
                 INNER JOIN SerieDiplome AS serieDip ON serieDip.idSerieDip = cand.idSerieDip
                 LEFT JOIN Specialite AS spe ON spe.idSpe = cand.idSpe
            WHERE cand.anneeDeb = ? AND cand.anneeFin = ?
        ");
        $stmtListe->execute([$anneeDeb, $anneeFin]);
        return $stmtListe->fetchAll(PDO::FETCH_ASSOC);
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

    public function getCandidatsFromCodeSerieDip($codeSerieDip, $anneeDeb, $anneeFin): ?array
    {
        $stmtCandidats = $this->pdo->prepare("
            SELECT cand.codeCand, cand.nomCand, cand.prenomCand, cand.civilite, cand.profilCand, serieDip.codeSerieDip, cand.noteGlobale, cand.noteFicheAvenir, cand.noteLycee, cand.noteDossier, cand.commentaire
            FROM candidat AS cand
                 INNER JOIN
                 SerieDiplome AS serieDip ON serieDip.idSerieDip = cand.idSerieDip
            WHERE serieDip.codeSerieDip = ? AND cand.anneeDeb = ? AND cand.anneeFin = ?
        ");
        $stmtCandidats->execute([$codeSerieDip, $anneeDeb, $anneeFin]);
        $candidats = $stmtCandidats->fetchAll(PDO::FETCH_ASSOC);

        return $candidats;
    }

    public function getAllCandidats()
    {
        $sql = "SELECT
                c.codeCand                                  AS \"Candidat - Code\",
                c.nomCand                                   AS \"Candidat - Nom\",
                c.prenomCand                                AS \"Candidat - Prénom\",
                c.civilite                                  AS \"Civilité\",
                c.profilCand                                AS \"Profil Candidat - Libellé\",
                c.nvBoursCand                               AS \"Candidat boursier - Code\",

                fi.libFiliere                               AS \"Filiere (pour scolarité du supérieur)- Libellé 2024/2025\",
                fo.libFormation                             AS \"Formation - Libellé (Saisie manuelle) 2024/2025\",
                spe.libSpe                                  AS \"Spécialité / Mention - Libellé 2024/2025\",

                e.nomEtab                                   AS \"Nom Etablissement origine 2024/2025\",
                l.nomCommu                                  AS \"Commune Etablissement origine - Libellé 2024/2025\",
                e.codePost                                  AS \"Commune Etablissement origine - CodePostal 2024/2025\",
                l.nomDept                                   AS \"Département Etablissement origine - Libellé 2024/2025\",
                l.pays                                      AS \"Pays Etablissement origine - Libellé 2024/2025\",

                td.idTypeDip                                AS \"Type Diplôme - Code\",
                td.libTypeDip                               AS \"Type Diplôme - Libellé\",
                sd.codeSerieDip                             AS \"Série Diplôme - Code\",
                sd.libSerieDip                              AS \"Série Diplôme - Libellé\",

                spe.libSpe                                  AS \"Spécialité - Libellé\",

                STRING_AGG(
                    CASE WHEN ces.abandonnee = FALSE THEN es.libEnsSpe END,
                    ' / '
                    ORDER BY es.libEnsSpe
                )                                           AS \"Combinaison des enseignements de spécialité en Terminale\",

                STRING_AGG(
                    CASE WHEN ces.abandonnee = TRUE THEN es.libEnsSpe END,
                    ' / '
                    ORDER BY es.libEnsSpe
                )                                           AS \"Enseignement De spécialité abandonné en Première\",

                c.noteGlobale                               AS \"Note Globale Calculée\",
                c.noteFicheAvenir                           AS \"Note Fiche Avenir\",
                c.noteLycee                                 AS \"Note Lycée calculée\",
                c.noteDossier                               AS \"Note Dossier\",
                c.commentaire                               AS \"Commentaire\"

            FROM Candidat c
                JOIN TypeDiplome    td  ON td.idTypeDip   = c.idTypeDip
                JOIN SerieDiplome   sd  ON sd.idSerieDip  = c.idSerieDip
                LEFT JOIN Filiere       fi  ON fi.idFiliere   = c.idFiliere
                LEFT JOIN Formation     fo  ON fo.idFormation = c.idFormation
                LEFT JOIN Specialite    spe ON spe.idSpe      = c.idSpe
                LEFT JOIN Etablissement e   ON e.idEtab       = c.idEtab
                LEFT JOIN Localisation  l   ON l.idLoc        = e.idLoc
                LEFT JOIN Candidat_EnseignementSpecialite ces ON ces.idCand   = c.idCand
                LEFT JOIN EnseignementSpecialite          es  ON es.idEnsSpe  = ces.idEnsSpe

            GROUP BY
                c.idCand, c.codeCand, c.nomCand, c.prenomCand, c.civilite,
                c.profilCand, c.nvBoursCand,
                fi.libFiliere, fo.libFormation, spe.libSpe,
                e.nomEtab, l.nomCommu, e.codePost, l.nomDept, l.pays,
                td.idTypeDip, td.libTypeDip,
                sd.codeSerieDip, sd.libSerieDip,
                c.noteGlobale, c.noteFicheAvenir, c.noteLycee, c.noteDossier,
                c.commentaire

            ORDER BY c.codeCand";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateNoteDossierFromCodeSerieDip($note, $codeSerieDip, $anneeDeb, $anneeFin)
    {
        // DEBUG — vérifie que la sous-requête trouve bien l'idSerieDip
        $check = $this->pdo->prepare("SELECT idSerieDip FROM SerieDiplome WHERE codeSerieDip = ?");
        $check->execute([$codeSerieDip]);
        $row = $check->fetch(PDO::FETCH_ASSOC);
        error_log("idSerieDip trouvé : " . print_r($row, true));

        $stmt = $this->pdo->prepare("
            UPDATE Candidat 
            SET noteDossier = ?
            WHERE idSerieDip = (SELECT idSerieDip FROM SerieDiplome WHERE codeSerieDip = ?)
              AND anneeDeb = ?
              AND anneeFin = ?
        ");
        $stmt->execute([$note, $codeSerieDip, $anneeDeb, $anneeFin]);
        error_log("Lignes modifiées : " . $stmt->rowCount());
    }
}