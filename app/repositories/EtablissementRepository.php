<?php
require_once "../app/core/Repository.php";

class EtablissementRepository
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Repository::getInstance()->getPDO();
    }

    public function getNomEtablissementsFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $stmtEtablissement = $this->pdo->prepare("
            SELECT DISTINCT etab.nomEtab
            FROM Etablissement AS etab
                 INNER JOIN
                 Candidat AS cand ON cand.idEtab = etab.idEtab
            WHERE anneeDeb = ? AND anneeFin = ?
            ORDER BY etab.nomEtab ASC
        ");
        $stmtEtablissement->execute([$anneeDeb, $anneeFin]);
        $nomsEtablissements = $stmtEtablissement->fetchAll(PDO::FETCH_ASSOC);

        return $nomsEtablissements;
    }
}