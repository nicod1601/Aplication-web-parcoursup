<?php
// app/controllers/GestionnaireController.php

require_once '../app/core/Controller.php';
require_once '../app/repositories/FichierRepository.php';

class GestionnaireController extends Controller
{

	private FichierRepository $fichierRepository;

	public function __construct()
	{
		$this->fichierRepository = new FichierRepository();
	}

	public function index(): void
	{
		$annees = [];

		for ($i = 2000; $i <= 2026; $i++) {
			$debut = $i;
			$fin = $i + 1;
			$annees[] = [
				'value' => "$debut-$fin",
				'text'  => "$debut - $fin"
			];
		}

		$fichiers = $this->fichierRepository->getAllFichiers();

		$this->view('gestionnaire', 'Gestion des données', [
			'annees' => $annees,
			'fichiers' => $fichiers
		]);
	}
}
