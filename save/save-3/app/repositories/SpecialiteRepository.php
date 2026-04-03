<?php
require_once "../app/core/Repository.php";

class SpecialiteRepository
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Repository::getInstance()->getPDO();
    }

    public function getLibSpecialitesFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $stmtSpecialite = $this->pdo->prepare("
            SELECT DISTINCT spe.libSpe
            FROM Specialite as spe
                 INNER JOIN
                 Candidat as cand on cand.idSpe = spe.idSpe
            WHERE cand.anneeDeb = ? AND cand.anneeFin = ?
            ORDER BY spe.libSpe ASC
        ");
        $stmtSpecialite->execute([$anneeDeb, $anneeFin]);
        $libSpecialites = $stmtSpecialite->fetchAll(PDO::FETCH_ASSOC);

        return $libSpecialites;
    }
}