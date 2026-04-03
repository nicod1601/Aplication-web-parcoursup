<?php
// app/controllers/StatsService.php

require_once '../app/repositories/SerieDiplomeRepository.php';
require_once '../app/repositories/CandidatRepository.php';
require_once '../app/repositories/SpecialiteRepository.php';
require_once '../app/repositories/EnseignementSpecialiteRepository.php';

class DonneesService
{
    private SerieDiplomeRepository $serieDiplomeRepository;
    private CandidatRepository $candidatRepository;
    private SpecialiteRepository $specialiteRepository;
    private EnseignementSpecialiteRepository $enseignementSpecialiteRepository;

    public function __construct()
    {
        $this->serieDiplomeRepository = new SerieDiplomeRepository();
        $this->candidatRepository = new CandidatRepository();
        $this->specialiteRepository  = new SpecialiteRepository();
        $this->enseignementSpecialiteRepository = new EnseignementSpecialiteRepository();

    }

    public function getDonnees($anneeDeb, $anneeFin): ?array
    {
        $data['baccalaureat'] = [
            'typeBac'                 => $this->serieDiplomeRepository->getCodeSeriesDiplomesFromAnnee($anneeDeb, $anneeFin),
            'specialite'              => $this->specialiteRepository->getLibSpecialitesFromAnnee($anneeDeb, $anneeFin),
            'enseignementsSpecialite' => $this->enseignementSpecialiteRepository->getLibEnseignementSpecialiteFromAnnee($anneeDeb, $anneeFin),
        ];

        $data['civilite'] = [
            'civilite' => $this->candidatRepository->getGenresFromAnnee($anneeDeb, $anneeFin),
            'bourse' => $this->candidatRepository->getNiveauxBourseFromAnnee($anneeDeb, $anneeFin)
        ];

        return $data;
    }
}