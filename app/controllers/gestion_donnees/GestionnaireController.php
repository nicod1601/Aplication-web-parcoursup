<?php
// app/controllers/GestionnaireController.php

require_once '../app/core/Controller.php';

class GestionnaireController extends Controller
{
	public function index(): void
	{
		$annees = [];
		
		// Génère les paires d'années de 2000-2001 à 2026-2027 (limite i à 2026)
		for ($i = 2000; $i <= 2026; $i++) {
			$debut = $i;
			$fin = $i + 1;
			$annees[] = [
				'value' => "$debut-$fin",
				'text'  => "$debut - $fin"
			];
		}

		$this->view('gestionnaire', 'Gestion des données', [
			'annees' => $annees
		]);
	}
}
