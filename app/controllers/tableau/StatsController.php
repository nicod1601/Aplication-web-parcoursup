<?php
// app/controllers/tableau/StatsController.php

require_once '../app/core/Controller.php';
require_once '../app/services/StatsService.php';

class StatsController extends Controller
{
	private StatsService $statsService;

	public function __construct()
	{
		$this->statsService = new StatsService();
	}

	public function stats()
	{
		$annee = $_GET["annee"];
		$anneeDeb = (int) explode("-", $annee)[0];
		$anneeFin = (int) explode("-", $annee)[1];

		$data["candidats"]    = $this->statsService->getCandidatsFromAnnee($anneeDeb, $anneeFin);
		$data["statistiques"] = $this->statsService->getStatistiques($anneeDeb, $anneeFin);

        /* Mise à jour de la session */
        $_SESSION['anneeCourante'] = [
            "anneeDeb" => $anneeDeb,
            "anneeFin" => $anneeFin
        ];
        $_SESSION['candidats']    = $data["candidats"   ];
        $_SESSION['statistiques'] = $data["statistiques"];

		$this->json($data);
	}
}