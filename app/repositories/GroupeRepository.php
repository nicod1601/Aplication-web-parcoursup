<?php
require_once '../app/core/Repository.php';

class GestionnaireRepository
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Repository::getInstance()->getPDO();
    }

    public function getAllGroupes(): array
    {
        $stmt = $this->pdo->query('WITH combinaisons AS (
                                   SELECT c.idCand, sd.libSerieDip, COALESCE(STRING_AGG(es.libEnsSpe, \' | \' ORDER BY es.libEnsSpe), \'Inconnu\') AS combinaison, c.civilite, c.nvBoursCand 
                                   FROM Candidat c JOIN SerieDiplome sd ON c.idSerieDip = sd.idSerieDip LEFT JOIN Candidat_EnseignementSpecialite ces ON c.idCand = ces.idCand LEFT JOIN EnseignementSpecialite es ON ces.idEnsSpe = es.idEnsSpe 
                                   GROUP BY c.idCand, sd.libSerieDip, c.civilite, c.nvBoursCand) 
                                   SELECT libSerieDip AS "Série de bac réformé", combinaison AS "Combinaison des enseignements de spécialités", COUNT(*) AS "Total des voeux de l\'année N", COUNT(CASE WHEN civilite = \'F\' THEN 1 END) AS "Filles", COUNT(CASE WHEN civilite = \'M\' THEN 1 END) AS "Garçons", COUNT(CASE WHEN nvBoursCand > 0 THEN 1 END) AS "Boursiers certifiés des lycées", COUNT(CASE WHEN nvBoursCand = 0 THEN 1 END) AS "Non Boursiers certifiés des lycées"
                                   FROM combinaisons
                                   GROUP BY libSerieDip, combinaison ORDER BY libSerieDip, combinaison;');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}