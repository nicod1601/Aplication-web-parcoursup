<?php

require_once '../app/core/Controller.php';
require_once '../app/repositories/GroupeRepository.php';

class GroupeController extends Controller
{
	private GroupeRepository $groupeRepository;

	public function __construct()
	{
		$this->groupeRepository = new GroupeRepository();
	}

	public function groupe()
	{
		$annee = $_GET['annee'] ?? null;

		if (!$annee) {
			$this->json(['success' => false, 'error' => 'Année manquante'], 400);
			return;
		}

		$parts = explode('-', $annee);
		$anneeDeb = (int)$parts[0];
		$anneeFin = (int)$parts[1];

		$data = $this->groupeRepository->getAllGroupes($anneeDeb, $anneeFin);

		$groupes = [];
		foreach ($data as $row) {
			$serie = $row['Série de bac réformé'];
			if (!isset($groupes[$serie])) {
				$groupes[$serie] = [
					'serie' => $serie,
					'combinaisons' => [],
					'total' => 0,
					'filles' => 0,
					'garcons' => 0,
					'boursiers' => 0,
					'nonBoursiers' => 0,

				];
			}

			$groupes[$serie]['combinaisons'][] = [
				'combinaison'  => $row['Combinaison des enseignements de spécialités'],
				'total'        => (int)$row["Total des voeux de l'année N"],
				'filles'       => (int)$row['Filles'],
				'garcons'      => (int)$row['Garçons'],
				'boursiers'    => (int)$row['Boursiers certifiés des lycées'],
				'nonBoursiers' => (int)$row['Non Boursiers certifiés des lycées'],
			];

			$groupes[$serie]['total']         += (int)$row["Total des voeux de l'année N"];
			$groupes[$serie]['filles']        += (int)$row['Filles'];
			$groupes[$serie]['garcons']       += (int)$row['Garçons'];
			$groupes[$serie]['boursiers']     += (int)$row['Boursiers certifiés des lycées'];
			$groupes[$serie]['nonBoursiers']  += (int)$row['Non Boursiers certifiés des lycées'];
		}

		$this -> json(['success' => true, 'groupes' => array_values($groupes)]);
	}
}