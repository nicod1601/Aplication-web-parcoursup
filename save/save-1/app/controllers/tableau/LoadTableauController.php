<?php
// app/controllers/tableau/LoadTableauController.php

require_once '../app/core/Controller.php';
require_once '../app/services/StatsService.php';

class LoadTableauController extends Controller
{
	private StatsService $statService;

	public function __construct()
	{
		$this->statService = new StatsService();
	}

	public function load()
	{
		$data['annees'] = $this->statService->getAllAnnees();

		$this->json($data);
	}
}

