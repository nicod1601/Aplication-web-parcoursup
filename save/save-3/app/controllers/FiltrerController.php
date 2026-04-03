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
        $data = [];

        if ( $_SERVER['REQUEST_METHOD'] == 'POST' )
        {
            $data    = [];
            $filtres = $_POST['filtres'];

            /* Requête SQL qui renvoie le tableau de candidats en fonction des filtres */

            if ( $data['candidats'] )
                $this->json( $data );
            else
            {
                $errors[] = "Aucun filtre n'est appliqué";
                $data['errors'] = $errors;
            }
        }

		$this->view('filtrer', '', $data );
	}

    public function recupererDonnees()
    {
        $anneeDeb = $_SESSION['anneeCourante']['anneeDeb'];
        $anneeFin = $_SESSION['anneeCourante']['anneeFin'];

        $data = $this->donneesService->getDonnees($anneeDeb, $anneeFin);

        $this->json($data);
    }
}
