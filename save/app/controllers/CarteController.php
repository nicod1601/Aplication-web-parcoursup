<?php
// app/controllers/CarteController.php

require_once '../app/core/Controller.php';
require_once '../app/repositories/CarteRepository_nominatim.php';
require_once '../app/repositories/AnneeRepository.php';

class CarteController extends Controller
{
    private CarteRepository $carteRepository;
    private AnneeRepository $anneeRepository;

    public function __construct()
    {
        $this->carteRepository = new CarteRepository();
        $this->anneeRepository = new AnneeRepository();
    }

    public function index(): void
    {
        $this->view('carte');
    }

    /**
     * API : retourne les candidats géolocalisés pour une année donnée.
     * GET /carte_data.php?annee=2024-2025
     */
    public function data(): void
    {
        $annee = $_GET['annee'] ?? null;

        if (!$annee) {
            $this->json(['success' => false, 'error' => 'Paramètre annee manquant'], 400);
            return;
        }

        $parts    = explode('-', $annee);
        $anneeDeb = (int)($parts[0] ?? 0);
        $anneeFin = (int)($parts[1] ?? 0);

        if (!$anneeDeb || !$anneeFin) {
            $this->json(['success' => false, 'error' => 'Format annee invalide'], 400);
            return;
        }

        $candidats = $this->carteRepository->getCandidatsForCarte($anneeDeb, $anneeFin);
        $series    = $this->carteRepository->getSeriesForAnnee($anneeDeb, $anneeFin);
        $annees    = $this->anneeRepository->getAllAnnees();

        // Formater les années
        $anneesFormatees = array_map(fn($a) => $a['anneedeb'] . '-' . $a['anneefin'], $annees);

        $this->json([
            'success'   => true,
            'candidats' => $candidats,
            'series'    => $series,
            'annees'    => $anneesFormatees,
        ]);
    }

    /**
     * API : retourne uniquement les années disponibles.
     * GET /carte_annees.php
     */
    public function annees(): void
    {
        $annees = $this->anneeRepository->getAllAnnees();
        $anneesFormatees = array_map(fn($a) => $a['anneedeb'] . '-' . $a['anneefin'], $annees);
        $this->json(['success' => true, 'annees' => $anneesFormatees]);
    }
}