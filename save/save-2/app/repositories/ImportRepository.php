<?php
require_once '../app/core/Repository.php';

set_time_limit( 900 );

class ImportRepository
{
	public function getAllDataFromExcel()
	{
		$jsonData = file_get_contents('php://input');
		$data = json_decode($jsonData, true);

		if (!$data || !isset($data['excelData'])) {
			return ['success' => false, 'error' => 'Données invalides'];
		}

		$excelData = $data['excelData'];

		$anneeSelection = $data['annee'] ?? date('Y') . '-' . (date('Y') + 1);
		$years = explode('-', $anneeSelection);
		$anneeDeb = (int)$years[0];
		$anneeFin = (int)($years[1] ?? ($anneeDeb + 1));

		try {
			$pdo = Repository::getInstance()->getPDO();
			$pdo->beginTransaction();

			$locMap    = [];
			$etabMap   = [];
			$serieMap  = [];
			$speMap    = [];
			$ensMap    = [];
			$filiereMap  = [];
			$formationMap = [];

			$maxIdCand = (int)$pdo->query("SELECT COALESCE(MAX(idCand), 0) FROM Candidat")->fetchColumn();
			$candCounter = $maxIdCand + 1;

			$locCounter  = (int)$pdo->query("SELECT COALESCE(MAX(idLoc), 0)  FROM Localisation")->fetchColumn() + 1;
			$etabCounter = (int)$pdo->query("SELECT COALESCE(MAX(idEtab), 0) FROM Etablissement")->fetchColumn() + 1;

			// ---- Statements ----

			$stmtLocalisation = $pdo->prepare("
				INSERT INTO Localisation (idLoc, nomCommu, nomDept, pays)
				VALUES (:idLoc, :nomCommu, :nomDept, :pays)
				ON CONFLICT (idLoc) DO NOTHING
			");

			$stmtEtablissement = $pdo->prepare("
				INSERT INTO Etablissement (idEtab, nomEtab, codePost, idLoc)
				VALUES (:idEtab, :nomEtab, :codePost, :idLoc)
				ON CONFLICT (idEtab) DO NOTHING
			");

			$stmtTypeDiplome = $pdo->prepare("
				INSERT INTO TypeDiplome (idTypeDip, libTypeDip)
				VALUES (:idTypeDip, :libTypeDip)
				ON CONFLICT (idTypeDip) DO NOTHING
			");

			// Formation : pas de code dans l'Excel, on utilise le libellé comme clé unique (serial en base)
			$stmtFormation = $pdo->prepare("
				INSERT INTO Formation (libFormation)
				VALUES (:libFormation)
				ON CONFLICT DO NOTHING
			");
			$stmtGetFormation = $pdo->prepare("
				SELECT idFormation FROM Formation WHERE libFormation = :libFormation
			");

			// Filière : même approche
			$stmtFiliere = $pdo->prepare("
				INSERT INTO Filiere (libFiliere)
				VALUES (:libFiliere)
				ON CONFLICT DO NOTHING
			");
			$stmtGetFiliere = $pdo->prepare("
				SELECT idFiliere FROM Filiere WHERE libFiliere = :libFiliere
			");

			$stmtSerieDiplome = $pdo->prepare("
				INSERT INTO SerieDiplome (codeSerieDip, libSerieDip)
				VALUES (:codeSerieDip, :libSerieDip)
				ON CONFLICT (codeSerieDip) DO NOTHING
			");
			$stmtGetSerieDiplome = $pdo->prepare("
				SELECT idSerieDip FROM SerieDiplome WHERE codeSerieDip = :codeSerieDip
			");

			$stmtSpecialite = $pdo->prepare("
				INSERT INTO Specialite (libSpe) VALUES (:libSpe) ON CONFLICT DO NOTHING
			");
			$stmtGetSpe = $pdo->prepare("SELECT idSpe FROM Specialite WHERE libSpe = :libSpe");

			$stmtEnsSpe = $pdo->prepare("
				INSERT INTO EnseignementSpecialite (libEnsSpe) VALUES (:libEnsSpe) ON CONFLICT DO NOTHING
			");
			$stmtGetEns = $pdo->prepare("SELECT idEnsSpe FROM EnseignementSpecialite WHERE libEnsSpe = :libEnsSpe");


			$stmtCandidat = $pdo->prepare("
				INSERT INTO Candidat (
					idCand, codeCand, nomCand, prenomCand, civilite, profilCand,
					nvBoursCand, noteGlobale, noteFicheAvenir, noteLycee, noteDossier,
					anneeDeb, anneeFin, commentaire,
					idFormation, idFiliere, idTypeDip, idSerieDip, idSpe, idEtab
				)
				VALUES (
					:idCand, :codeCand, :nomCand, :prenomCand, :civilite, :profilCand,
					:nvBoursCand, :noteGlobale, :noteFicheAvenir, :noteLycee, :noteDossier,
					:anneeDeb, :anneeFin, :commentaire,
					:idFormation, :idFiliere, :idTypeDip, :idSerieDip, :idSpe, :idEtab
				)
				ON CONFLICT (idCand) DO UPDATE SET nomCand = EXCLUDED.nomCand
			");

			$stmtCandEnsSpecialite = $pdo->prepare("
				INSERT INTO Candidat_EnseignementSpecialite (idCand, idEnsSpe, abandonnee)
				VALUES (:idCand, :idEnsSpe, :abandonnee)
				ON CONFLICT (idCand, idEnsSpe) DO NOTHING
			");

			// ---- Boucle sur chaque ligne Excel ----

			foreach ($excelData as $row) {

				// 1. Localisation
				$commune = $row['Commune Etablissement origine - Libellé 2024/2025']     ?? 'Inconnue';
				$dept    = $row['Département Etablissement origine - Libellé 2024/2025'] ?? 'Inconnu';
				$pays    = $row['Pays Etablissement origine - Libellé 2024/2025']         ?? 'France';

				$locKey = "$commune|$dept|$pays";
				if (!isset($locMap[$locKey])) {
					$locMap[$locKey] = $locCounter++;
					$stmtLocalisation->execute([
						':idLoc'    => $locMap[$locKey],
						':nomCommu' => $commune,
						':nomDept'  => $dept,
						':pays'     => $pays,
					]);
				}
				$idLoc = $locMap[$locKey];

				// 2. Etablissement
				$nomEtab  = $row['Nom Etablissement origine 2024/2025']                  ?? 'Inconnu';
				$codePost = $row['Commune Etablissement origine - CodePostal 2024/2025'] ?? null;

				$etabKey = "$nomEtab|$codePost";
				if (!isset($etabMap[$etabKey])) {
					$etabMap[$etabKey] = $etabCounter++;
					$stmtEtablissement->execute([
						':idEtab'   => $etabMap[$etabKey],
						':nomEtab'  => $nomEtab,
						':codePost' => $codePost,
						':idLoc'    => $idLoc,
					]);
				}
				$idEtab = $etabMap[$etabKey];

				// 3. TypeDiplome
				$idTypeDip  = (int)($row['Type Diplôme - Code']    ?? 0);
				$libTypeDip =       $row['Type Diplôme - Libellé'] ?? 'Inconnu';
				$stmtTypeDiplome->execute([':idTypeDip' => $idTypeDip, ':libTypeDip' => $libTypeDip]);

				// 4. Formation
				// CORRECTION : la colonne Excel s'appelle 'Formation - Libellé (Saisie manuelle) 2024/2025'
				//              il n'existe pas de 'Formation - Code' dans le fichier
				$libFormation = $row['Formation - Libellé (Saisie manuelle) 2024/2025'] ?? 'Inconnue';
				if (!isset($formationMap[$libFormation])) {
					$stmtFormation->execute([':libFormation' => $libFormation]);
					$stmtGetFormation->execute([':libFormation' => $libFormation]);
					$formationMap[$libFormation] = (int)$stmtGetFormation->fetchColumn();
				}
				$idFormation = $formationMap[$libFormation];

				// 5. Filière
				// CORRECTION : la colonne Excel s'appelle 'Filiere (pour scolarité du supérieur)- Libellé 2024/2025'
				//              il n'existe pas de 'Filière - Code' dans le fichier
				$libFiliere = $row['Filiere (pour scolarité du supérieur)- Libellé 2024/2025'] ?? 'Inconnue';
				if (!isset($filiereMap[$libFiliere])) {
					$stmtFiliere->execute([':libFiliere' => $libFiliere]);
					$stmtGetFiliere->execute([':libFiliere' => $libFiliere]);
					$filiereMap[$libFiliere] = (int)$stmtGetFiliere->fetchColumn();
				}
				$idFiliere = $filiereMap[$libFiliere];

				// 6. Spécialité
				// CORRECTION : la colonne Excel s'appelle 'Spécialité / Mention - Libellé  2024/2025'
				//              (pas 'Spécialité - Libellé' qui correspond à autre chose)
				$libSpe = $row['Spécialité / Mention - Libellé  2024/2025'] ?? 'Inconnue';
				if (!isset($speMap[$libSpe])) {
					$pdo->prepare("
						INSERT INTO Specialite (libSpe)
						VALUES (:libSpe)
						ON CONFLICT DO NOTHING
					")->execute([':libSpe' => $libSpe]);

					$stmtGetSpe = $pdo->prepare("SELECT idSpe FROM Specialite WHERE libSpe = :libSpe");
					$stmtGetSpe->execute([':libSpe' => $libSpe]);
					$speMap[$libSpe] = (int)$stmtGetSpe->fetchColumn();
				}
				$idSpe = $speMap[$libSpe];

				// 7. Enseignement Spécialité
				$libEnsSpe = $row['Combinaison des enseignements de spécialité en Terminale'] ?? 'Inconnu';
				if (!isset($ensMap[$libEnsSpe])) {
					$pdo->prepare("
						INSERT INTO EnseignementSpecialite (libEnsSpe)
						VALUES (:libEnsSpe)
						ON CONFLICT DO NOTHING
					")->execute([':libEnsSpe' => $libEnsSpe]);

					$stmtGetEns = $pdo->prepare("SELECT idEnsSpe FROM EnseignementSpecialite WHERE libEnsSpe = :libEnsSpe");
					$stmtGetEns->execute([':libEnsSpe' => $libEnsSpe]);
					$ensMap[$libEnsSpe] = (int)$stmtGetEns->fetchColumn();
				}
				$idEnsSpe = $ensMap[$libEnsSpe];

				// 8. Série Diplôme
				$codeSerieDip = $row['Série Diplôme - Code']    ?? 'Inconnu';
				$libSerieDip  = $row['Série Diplôme - Libellé'] ?? 'Inconnu';

				if (!isset($serieMap[$codeSerieDip])) {
					$stmtSerieDiplome->execute([
						':codeSerieDip' => $codeSerieDip,
						':libSerieDip'  => $libSerieDip,
					]);
					$stmtGetSerieDiplome->execute([':codeSerieDip' => $codeSerieDip]);
					$serieMap[$codeSerieDip] = (int)$stmtGetSerieDiplome->fetchColumn();
				}
				$idSerieDip = $serieMap[$codeSerieDip];

				// 9. Candidat
				// CORRECTION : noteDossier et commentaire ajoutés (présents dans l'Excel et en base)
				$currentCandId = $candCounter++;
				$stmtCandidat->execute([
					':idCand'          => $currentCandId,
					':codeCand'        => (int)   ($row['Candidat - Code']           ?? 0),
					':nomCand'         =>          $row['Candidat - Nom']            ?? '',
					':prenomCand'      =>          $row['Candidat - Prénom']         ?? '',
					':civilite'        =>          $row['Civilité']                  ?? '',
					':profilCand'      =>          $row['Profil Candidat - Libellé'] ?? '',
					':nvBoursCand'     => (int)   ($row['Candidat boursier - Code']  ?? 0),
					':noteGlobale'     => (float) ($row['Note Globale Calculée']     ?? 0),
					':noteFicheAvenir' => (float) ($row['Note Fiche Avenir']         ?? 0),
					':noteLycee'       => (float) ($row['Note Lycée calculée']       ?? 0),
					':noteDossier'     => isset($row['Note Dossier']) && $row['Note Dossier'] !== '' ? (float)$row['Note Dossier'] : null,
					':commentaire'     => $row['Commentaire'] ?? null,
					':anneeDeb'        => $anneeDeb,
					':anneeFin'        => $anneeFin,
					':idFormation'     => $idFormation ?: null,
					':idFiliere'       => $idFiliere   ?: null,
					':idTypeDip'       => $idTypeDip,
					':idSerieDip'      => $idSerieDip,
					':idSpe'           => $idSpe       ?: null,
					':idEtab'          => $idEtab,
				]);

				// 10. Candidat_EnseignementSpecialite
				// CORRECTION : la colonne 'Abandonnée - Code' n'existe pas dans l'Excel.
				//              La colonne réelle est 'Enseignement De spécialité abandonné en Première'
				//              qui contient le libellé de la spécialité abandonnée (ou vide si aucune).
				$abandonneeLib = $row['Enseignement De spécialité abandonné en Première'] ?? '';
				$abandonnee = !empty(trim((string)$abandonneeLib));

				$stmtCandEnsSpecialite->execute([
					':idCand'     => $currentCandId,
					':idEnsSpe'   => $idEnsSpe,
					':abandonnee' => (int)$abandonnee,
				]);
			}

			$pdo->commit();

			return [
				'success' => true,
				'message' => count($excelData) . " candidats importés avec succès pour la période $anneeDeb-$anneeFin."
			];

		} catch (Exception $e) {
			if (isset($pdo) && $pdo->inTransaction()) {
				$pdo->rollBack();
			}
			return ['success' => false, 'error' => $e->getMessage()];
		}
	}
}