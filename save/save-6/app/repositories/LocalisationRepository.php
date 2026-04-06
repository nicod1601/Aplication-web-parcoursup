<?php
require_once "../app/core/Repository.php";

class LocalisationRepository
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Repository::getInstance()->getPDO();
    }

    public function getNomCommuneFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $stmtCommunes = $this->pdo->prepare("
            SELECT DISTINCT loc.nomCommu
            FROM Localisation AS loc
                 INNER JOIN
                 Etablissement AS etab on etab.idLoc = loc.idLoc
                 INNER JOIN
                 Candidat AS cand ON cand.idEtab = etab.idEtab
            WHERE cand.anneeDeb = ? AND cand.anneeFin = ?
            ORDER BY loc.nomCommu ASC
        ");
        $stmtCommunes->execute([$anneeDeb, $anneeFin]);
        $nomsCommunes = $stmtCommunes->fetchAll(PDO::FETCH_ASSOC);

        return $nomsCommunes;
    }

    public function getNomDepartementFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $stmtDepartement = $this->pdo->prepare("
            SELECT DISTINCT loc.nomDept
            FROM Localisation AS loc
                 INNER JOIN
                 Etablissement AS etab on etab.idLoc = loc.idLoc
                 INNER JOIN
                 Candidat AS cand ON cand.idEtab = etab.idEtab
            WHERE cand.anneeDeb = ? AND cand.anneeFin = ?
            ORDER BY loc.nomDept ASC
        ");
        $stmtDepartement->execute([$anneeDeb, $anneeFin]);
        $nomsDepartements = $stmtDepartement->fetchAll(PDO::FETCH_ASSOC);

        return $nomsDepartements;
    }

    public function getNomPaysFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $stmtPays = $this->pdo->prepare("
            SELECT DISTINCT loc.pays
            FROM Localisation AS loc
                 INNER JOIN
                 Etablissement AS etab on etab.idLoc = loc.idLoc
                 INNER JOIN
                 Candidat AS cand ON cand.idEtab = etab.idEtab
            WHERE cand.anneeDeb = ? AND cand.anneeFin = ?
            ORDER BY loc.pays ASC
        ");
        $stmtPays->execute([$anneeDeb, $anneeFin]);
        $nomsPays= $stmtPays->fetchAll(PDO::FETCH_ASSOC);

        return $nomsPays;
    }

    public function getCommunesFromEtablissement( $anneeDeb, $anneeFin, $etablissement ): ?array
    {
        $stmtPays = $this->pdo->prepare("
            SELECT DISTINCT loc.commune
            FROM Localisation AS loc
                 INNER JOIN
                 Etablissement AS etab on etab.idLoc = loc.idLoc
                 INNER JOIN
                 Candidat AS cand ON cand.idEtab = etab.idEtab
            WHERE cand.anneeDeb = ? AND cand.anneeFin = ? AND etab.nomEtab = ?
            ORDER BY loc.pays ASC
        ");
        $stmtPays->execute([$anneeDeb, $anneeFin, $etablissement]);
        $nomsPays= $stmtPays->fetchAll(PDO::FETCH_ASSOC);

        return $nomsPays;
    }

    public function getDepartementsFromCommune($anneeDeb, $anneeFin, $commune): ?array
    {
        $stmtDepartement = $this->pdo->prepare("
            SELECT DISTINCT loc.nomDept
            FROM Localisation AS loc
                 INNER JOIN
                 Etablissement AS etab on etab.idLoc = loc.idLoc
                 INNER JOIN
                 Candidat AS cand ON cand.idEtab = etab.idEtab
            WHERE cand.anneeDeb = ? AND cand.anneeFin = ? AND loc.nomCommu = ?
            ORDER BY loc.nomDept ASC
        ");
        $stmtDepartement->execute([$anneeDeb, $anneeFin, $commune]);
        $nomsDepartements = $stmtDepartement->fetchAll(PDO::FETCH_ASSOC);

        return $nomsDepartements;
    }

    public function getPaysFromDepartement($anneeDeb, $anneeFin, $departement ): ?array
    {
        $stmtPays = $this->pdo->prepare("
            SELECT DISTINCT loc.pays
            FROM Localisation AS loc
                 INNER JOIN
                 Etablissement AS etab on etab.idLoc = loc.idLoc
                 INNER JOIN
                 Candidat AS cand ON cand.idEtab = etab.idEtab
            WHERE cand.anneeDeb = ? AND cand.anneeFin = ? AND loc.nomDept = ?
            ORDER BY loc.pays ASC
        ");
        $stmtPays->execute([$anneeDeb, $anneeFin, $departement]);
        $nomsPays= $stmtPays->fetchAll(PDO::FETCH_ASSOC);

        return $nomsPays;
    }
}