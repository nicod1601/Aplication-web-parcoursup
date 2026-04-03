<?php
// app/controllers/FiltrerController.php

require_once '../app/core/Controller.php';
require_once '../app/services/DonneesService.php';

class FiltrerController extends Controller
{
    private DonneesService $donneesService;

    public function __construct()
    {
        $this->donneesService = new DonneesService();
    }

	public function filtrer()
	{
        if ($_SERVER['REQUEST_METHOD'] === 'POST')
        {
            $body    = file_get_contents('php://input');
            $filtres = json_decode($body, true);

            $candidats = $this->donneesService->getDonneesFromFiltres($filtres);

            if ( empty($candidats) )
            {
                $this->json(['erreur' => 'Aucun candidat ne correspond aux filtres.']);
                return;
            }

            // Stocker en session pour tableau.php
            $_SESSION['candidats'] = $candidats;
            $_SESSION['filtres']   = $filtres;

            $this->json(['succes' => true, 'total' => count($candidats)]);
            return;
        }

        $this->view('filtrer', 'Filtrer');
    }

    public function recupererDonneesFromAnnee()
    {
        $anneeDeb = $_SESSION['anneeCourante']['anneeDeb'];
        $anneeFin = $_SESSION['anneeCourante']['anneeFin'];

        $data = $this->donneesService->getDonneesFromAnnee($anneeDeb, $anneeFin);

        $this->json($data);
    }

    public function recupererDonneesFromTypeBac()
    {
        $typeBac = $_GET['typeBac'];

        $data = $this->donneesService->getDonneesFromTypeBac( $typeBac );

        $this->json($data);
    }
}
