<?php

require_once '../app/core/Controller.php';
require_once '../app/services/DonneesService.php';

class GroupeController extends Controller
{
    private DonneesService $donneesService;

	public function __construct()
	{
        $this->donneesService = new DonneesService();
	}

	public function groupe()
    {
        if ( $_SERVER['REQUEST_METHOD'] == 'GET' && ! empty($_GET['codeSerieDip']) )
        {
            $data['groupe'] = $_GET['codeSerieDip'];

            $this->view( 'groupe_detail', '', $data );
            exit;
        }

        $this->view( 'groupe' );
    }

    public function data()
    {
        $anneeDeb = $_SESSION['anneeCourante']['anneeDeb'];
        $anneeFin = $_SESSION['anneeCourante']['anneeFin'];

        $data['groupes'] = $this->donneesService->getSeriesDiplomeFromAnnee($anneeDeb, $anneeFin);

        $this->json($data);
    }

    public function getDonnesFromSerieDiplome()
    {
        $codeSerieDip = $_GET['codeSerieDip'] ?? null;

        if (!$codeSerieDip) {
            echo json_encode(['candidats' => []]);
            exit;
        }

        $data['candidats'] = $this->donneesService->getCandidatsFromCodeSerieDip($codeSerieDip);

        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    public function updateNoteDossierFromCodeSerieDip()
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        error_log("DATA reçue : " . print_r($data, true));
        error_log("SESSION : " . print_r($_SESSION['anneeCourante'], true));

        $note         = floatval($data['noteDossierGroupe']);
        $codeSerieDip = $data['codeSerieDip'];

        $this->donneesService->updateNoteDossierFromCodeSerieDip($note, $codeSerieDip);
    }
}