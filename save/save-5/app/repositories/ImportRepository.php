<?php
require_once '../app/core/Repository.php';

set_time_limit(900);

class ImportRepository
{
	private const VALEURS_VIDES = ['', 'inconnu', 'inconnue', 'inconnus', 'inconnues',
									'n/a', 'na', 'null', 'none', '-', '—', '?'];

	public function getAllDataFromExcel()
	{
		$jsonData = file_get_contents('php://input');
		$data     = json_decode($jsonData, true);

		if (!$data || !isset($data['excelData'])) {
			return ['success' => false, 'error' => 'Données invalides'];
		}

		$excelData = $data['excelData'];

		$anneeSelection = $data['annee'] ?? date('Y') . '-' . (date('Y') + 1);
		$years    = explode('-', $anneeSelection);
		$anneeDeb = (int)$years[0];
		$anneeFin = (int)($years[1] ?? ($anneeDeb + 1));

		$suffix = str_replace('-', '/', $anneeSelection);

		try {
			$pdo = Repository::getInstance()->getPDO();
			$pdo->beginTransaction();

			$locMap       = [];
			$etabMap      = [];
			$serieMap     = [];
			$speMap       = [];
			$ensMap       = [];
			$filiereMap   = [];
			$formationMap = [];

			$maxIdCand   = (int)$pdo->query("SELECT COALESCE(MAX(idCand), 0) FROM Candidat")->fetchColumn();
			$candCounter = $maxIdCand + 1;
			$locCounter  = (int)$pdo->query("SELECT COALESCE(MAX(idLoc),  0) FROM Localisation")->fetchColumn() + 1;
			$etabCounter = (int)$pdo->query("SELECT COALESCE(MAX(idEtab), 0) FROM Etablissement")->fetchColumn() + 1;

			$lignesIgnorees  = [];
			$lignesImportees = 0;

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
			$stmtFormation = $pdo->prepare("
				INSERT INTO Formation (libFormation) VALUES (:libFormation)
				ON CONFLICT DO NOTHING
			");
			$stmtGetFormation = $pdo->prepare("
				SELECT idFormation FROM Formation WHERE libFormation = :libFormation
			");
			$stmtFiliere = $pdo->prepare("
				INSERT INTO Filiere (libFiliere) VALUES (:libFiliere)
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
			$stmtCandidat = $pdo->prepare("
				INSERT INTO Candidat (
					idCand, codeCand, nomCand, prenomCand, civilite, profilCand,
					nvBoursCand, noteGlobale, noteFicheAvenir, noteLycee, noteDossier,
					anneeDeb, anneeFin, commentaire,
					idFormation, idFiliere, idTypeDip, idSerieDip, idSpe, idEtab
				) VALUES (
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

			foreach ($excelData as $numeroLigne => $row) {

				$erreurs = $this->validerLigne($row, $numeroLigne + 2, $suffix);
				if (!empty($erreurs)) {
					$lignesIgnorees[] = [
						'ligne'   => $numeroLigne + 2,
						'erreurs' => $erreurs,
						'nom'     => trim($row['Candidat - Nom'] ?? '') ?: '(inconnu)',
					];
					continue;
				}

				// 1. Localisation
				$commune = $this->getCol($row, 'Commune Etablissement origine - Libellé', $suffix);
				$dept    = $this->getCol($row, 'Département Etablissement origine - Libellé', $suffix);
				$pays    = $this->getCol($row, 'Pays Etablissement origine - Libellé', $suffix);

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

				// 2. Établissement
				$nomEtab  = $this->getCol($row, 'Nom Etablissement origine', $suffix);
				$codePost = $this->getCol($row, 'Commune Etablissement origine - CodePostal', $suffix);
				$codePost = $codePost === '' ? null : $codePost;

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
				$idTypeDip  = (int)$row['Type Diplôme - Code'];
				$libTypeDip = trim($row['Type Diplôme - Libellé']);
				$stmtTypeDiplome->execute([':idTypeDip' => $idTypeDip, ':libTypeDip' => $libTypeDip]);

				// 4. Formation (optionnelle)
				$libFormation = $this->getCol($row, 'Formation - Libellé (Saisie manuelle)', $suffix);
				$idFormation  = null;
				if (!$this->estVide($libFormation)) {
					if (!isset($formationMap[$libFormation])) {
						$stmtFormation->execute([':libFormation' => $libFormation]);
						$stmtGetFormation->execute([':libFormation' => $libFormation]);
						$formationMap[$libFormation] = (int)$stmtGetFormation->fetchColumn();
					}
					$idFormation = $formationMap[$libFormation] ?: null;
				}

				// 5. Filière (optionnelle)
				$libFiliere = $this->getCol($row, 'Filiere (pour scolarité du supérieur)- Libellé', $suffix);
				$idFiliere  = null;
				if (!$this->estVide($libFiliere)) {
					if (!isset($filiereMap[$libFiliere])) {
						$stmtFiliere->execute([':libFiliere' => $libFiliere]);
						$stmtGetFiliere->execute([':libFiliere' => $libFiliere]);
						$filiereMap[$libFiliere] = (int)$stmtGetFiliere->fetchColumn();
					}
					$idFiliere = $filiereMap[$libFiliere] ?: null;
				}

				// 6. Spécialité (optionnelle)
				$libSpe = $this->getCol($row, 'Spécialité / Mention - Libellé', $suffix);
				$idSpe  = null;
				if (!$this->estVide($libSpe)) {
					if (!isset($speMap[$libSpe])) {
						$pdo->prepare("INSERT INTO Specialite (libSpe) VALUES (:libSpe) ON CONFLICT DO NOTHING")
							->execute([':libSpe' => $libSpe]);
						$s = $pdo->prepare("SELECT idSpe FROM Specialite WHERE libSpe = :libSpe");
						$s->execute([':libSpe' => $libSpe]);
						$speMap[$libSpe] = (int)$s->fetchColumn();
					}
					$idSpe = $speMap[$libSpe] ?: null;
				}

				// 7. Enseignement Spécialité
				$combinaison   = trim($row['Combinaison des enseignements de spécialité en Terminale'] ?? '');
				$abandonneeLib = trim($row['Enseignement De spécialité abandonné en Première'] ?? '');
				$idsEnsSpe     = [];

				if (!$this->estVide($combinaison)) {
					$specialites = preg_split('/[\/|,]/', $combinaison, -1, PREG_SPLIT_NO_EMPTY);
					$specialites = array_map('trim', $specialites);
					$specialites = array_filter($specialites, fn($s) => !$this->estVide($s));

					foreach ($specialites as $libSpe) {
						if ($this->estVide($libSpe)) continue;
						if (!isset($ensMap[$libSpe])) {
							$pdo->prepare("
								INSERT INTO EnseignementSpecialite (libEnsSpe)
								VALUES (:libEnsSpe)
								ON CONFLICT DO NOTHING
							")->execute([':libEnsSpe' => $libSpe]);
							$s = $pdo->prepare("SELECT idEnsSpe FROM EnseignementSpecialite WHERE libEnsSpe = :libEnsSpe");
							$s->execute([':libEnsSpe' => $libSpe]);
							$ensMap[$libSpe] = (int)$s->fetchColumn();
						}
						if ($ensMap[$libSpe]) {
							$idsEnsSpe[] = $ensMap[$libSpe];
						}
					}
				}

				// 8. Série Diplôme
				$codeSerieDip = trim($row['Série Diplôme - Code']);
				$libSerieDip  = trim($row['Série Diplôme - Libellé']);
				if (!isset($serieMap[$codeSerieDip])) {
					$stmtSerieDiplome->execute([
						':codeSerieDip' => $codeSerieDip,
						':libSerieDip'  => $libSerieDip,
					]);
					$stmtGetSerieDiplome->execute([':codeSerieDip' => $codeSerieDip]);
					$serieMap[$codeSerieDip] = (int)$stmtGetSerieDiplome->fetchColumn();
				}
				$idSerieDip = $serieMap[$codeSerieDip];

				// 9. Candidat — notes : tiret ou vide = null (pas d'erreur)
				$noteGlobale = null;
				$rawGlobale  = $row['Note Globale Calculée'] ?? '';
				if (!$this->estVide($rawGlobale) && is_numeric($rawGlobale)) {
					$noteGlobale = (float)$rawGlobale;
				}

				$noteFicheAvenir = null;
				$rawFicheAvenir  = $row['Note Fiche Avenir'] ?? '';
				if (!$this->estVide($rawFicheAvenir) && is_numeric($rawFicheAvenir)) {
					$noteFicheAvenir = (float)$rawFicheAvenir;
				}

				$noteLycee = null;
				$rawLycee  = $row['Note Lycée calculée'] ?? '';
				if (!$this->estVide($rawLycee) && is_numeric($rawLycee)) {
					$noteLycee = (float)$rawLycee;
				}

				$noteDossier = null;
				$rawDossier  = $row['Note Dossier'] ?? '';
				if (!$this->estVide($rawDossier) && is_numeric($rawDossier)) {
					$noteDossier = (float)$rawDossier;
				}

				$currentCandId = $candCounter++;
				$stmtCandidat->execute([
					':idCand'          => $currentCandId,
					':codeCand'        => (int)$row['Candidat - Code'],
					':nomCand'         => trim($row['Candidat - Nom']),
					':prenomCand'      => trim($row['Candidat - Prénom']),
					':civilite'        => trim($row['Civilité']),
					':profilCand'      => trim($row['Profil Candidat - Libellé']),
					':nvBoursCand'     => (int)($row['Candidat boursier - Code'] ?? 0),
					':noteGlobale'     => $noteGlobale,
					':noteFicheAvenir' => $noteFicheAvenir,
					':noteLycee'       => $noteLycee,
					':noteDossier'     => $noteDossier,
					':anneeDeb'        => $anneeDeb,
					':anneeFin'        => $anneeFin,
					':commentaire'     => $row['Commentaire'] ?? null,
					':idFormation'     => $idFormation,
					':idFiliere'       => $idFiliere,
					':idTypeDip'       => $idTypeDip,
					':idSerieDip'      => $idSerieDip,
					':idSpe'           => $idSpe,
					':idEtab'          => $idEtab,
				]);

				// 10. Candidat_EnseignementSpecialite
				foreach ($idsEnsSpe as $idEnsSpe) {
					$estAbandonnee = false;
					if (!$this->estVide($abandonneeLib)) {
						$libCette = array_search($idEnsSpe, $ensMap);
						if ($libCette !== false) {
							$estAbandonnee = stripos($abandonneeLib, $libCette) !== false;
						}
					}
					$stmtCandEnsSpecialite->execute([
						':idCand'     => $currentCandId,
						':idEnsSpe'   => $idEnsSpe,
						':abandonnee' => (int)$estAbandonnee,
					]);
				}

				$lignesImportees++;
			}

			$pdo->commit();

			return [
				'success'         => true,
				'message'         => "$lignesImportees candidats importés pour $anneeDeb-$anneeFin.",
				'lignesImportees' => $lignesImportees,
				'lignesIgnorees'  => $lignesIgnorees,
				'nbIgnorees'      => count($lignesIgnorees),
			];

		} catch (Exception $e) {
			if (isset($pdo) && $pdo->inTransaction()) {
				$pdo->rollBack();
			}
			return ['success' => false, 'error' => $e->getMessage()];
		}
	}

	private function getCol(array $row, string $baseName, string $suffix = ''): string
	{
		$exactMatch = trim($baseName . ' ' . $suffix);
		if (isset($row[$exactMatch])) return trim((string)$row[$exactMatch]);
		if (isset($row[$baseName]))   return trim((string)$row[$baseName]);
		foreach ($row as $key => $value) {
			if (stripos($key, $baseName) !== false) return trim((string)$value);
		}
		return '';
	}

	private function validerLigne(array $row, int $numeroLigne, string $suffix): array
	{
		$erreurs = [];

		$champsObligatoires = [
			'Candidat - Code'           => 'Code candidat',
			'Candidat - Nom'            => 'Nom',
			'Candidat - Prénom'         => 'Prénom',
			'Civilité'                  => 'Civilité',
			'Profil Candidat - Libellé' => 'Profil candidat',
		];
		foreach ($champsObligatoires as $colonne => $label) {
			if ($this->estVide($row[$colonne] ?? '')) {
				$erreurs[] = "$label manquant ou invalide";
			}
		}

		if (!empty($row['Candidat - Code']) && !is_numeric($row['Candidat - Code'])) {
			$erreurs[] = 'Code candidat non numérique : ' . $row['Candidat - Code'];
		}

		if ($this->estVide($row['Série Diplôme - Code'] ?? '')) {
			$erreurs[] = 'Série diplôme manquante';
		}
		if ($this->estVide($row['Série Diplôme - Libellé'] ?? '')) {
			$erreurs[] = 'Libellé série diplôme manquant';
		}

		$idTypeDip = $row['Type Diplôme - Code'] ?? '';
		if ($this->estVide($idTypeDip) || !is_numeric($idTypeDip)) {
			$erreurs[] = 'Type diplôme invalide ou manquant';
		}

		return $erreurs;
	}
	private function estVide($valeur): bool
	{
		if ($valeur === null || $valeur === false) return true;
		$str = strtolower(trim((string)$valeur));
		return $str === '' || in_array($str, self::VALEURS_VIDES, true);
	}
}