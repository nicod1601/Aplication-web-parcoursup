<?php
require_once "../app/core/Repository.php";

class EnseignementSpecialiteRepository
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Repository::getInstance()->getPDO();
    }

    public function getLibEnseignementSpecialiteFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $stmtEnseignementSpecialite = $this->pdo->prepare("
            SELECT DISTINCT ensSpe.libEnsSpe
            FROM EnseignementSpecialite AS ensSpe
                 INNER JOIN
                 Candidat_EnseignementSpecialite AS cand_ensSpe on ensSpe.idEnsSpe = cand_ensSpe.idEnsSpe
                 INNER JOIN
                 Candidat AS cand ON cand.idCand = cand_ensSpe.idCand
            WHERE cand.anneeDeb = ? AND cand.anneeFin = ?
            ORDER BY ensSpe.libEnsSpe ASC
        ");
        $stmtEnseignementSpecialite->execute([$anneeDeb, $anneeFin]);
        $libEnseignementsSpecialite = $stmtEnseignementSpecialite->fetchAll(PDO::FETCH_ASSOC);

        return $libEnseignementsSpecialite;
    }
}

