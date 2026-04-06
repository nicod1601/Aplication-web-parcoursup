<?php
require_once "../app/core/Repository.php";

class SpecialiteRepository
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Repository::getInstance()->getPDO();
    }

    public function getLibSpecialitesFromTypeBac( $typeBac ): ?array
    {
        $stmtSpecialite = $this->pdo->prepare("
            SELECT DISTINCT spe.libSpe
            FROM Specialite AS spe
                 INNER JOIN
                 Candidat AS cand ON cand.idSpe = spe.idSpe
                 INNER JOIN
                 SerieDiplome AS serieDip ON serieDip.idSerieDip = cand.idSerieDip
            WHERE serieDip.codeSerieDip = ?
            ORDER BY spe.libSpe ASC
        ");
        $stmtSpecialite->execute( [$typeBac] );
        $libSpecialites = $stmtSpecialite->fetchAll(PDO::FETCH_ASSOC);

        return $libSpecialites;
    }
}