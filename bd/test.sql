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
        WHERE cand.anneeDeb = 2000 AND cand.anneeFin = 2001;