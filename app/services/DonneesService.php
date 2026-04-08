<?php
// app/controllers/StatsService.php

require_once '../app/repositories/SerieDiplomeRepository.php';
require_once '../app/repositories/CandidatRepository.php';
require_once '../app/repositories/SpecialiteRepository.php';
require_once '../app/repositories/EnseignementSpecialiteRepository.php';
require_once '../app/repositories/EtablissementRepository.php';
require_once '../app/repositories/LocalisationRepository.php';

class DonneesService
{
    private SerieDiplomeRepository $serieDiplomeRepository;
    private CandidatRepository $candidatRepository;
    private SpecialiteRepository $specialiteRepository;
    private EnseignementSpecialiteRepository $enseignementSpecialiteRepository;
    private EtablissementRepository $etablissementRepository;
    private LocalisationRepository $localisationRepository;

    public function __construct()
    {
        $this->serieDiplomeRepository = new SerieDiplomeRepository();
        $this->candidatRepository = new CandidatRepository();
        $this->specialiteRepository  = new SpecialiteRepository();
        $this->enseignementSpecialiteRepository = new EnseignementSpecialiteRepository();
        $this->etablissementRepository = new EtablissementRepository();
        $this->localisationRepository = new LocalisationRepository();
    }

    public function getDonneesFromAnnee($anneeDeb, $anneeFin): ?array
    {
        $data['baccalaureats'] = [
            'typeBac' => $this->serieDiplomeRepository->getCodeSeriesDiplomesFromAnnee($anneeDeb, $anneeFin),
        ];

        $data['civilites'] = [
            'civilite' => $this->candidatRepository->getGenresFromAnnee($anneeDeb, $anneeFin),
            'bourse' => $this->candidatRepository->getNiveauxBourseFromAnnee($anneeDeb, $anneeFin)
        ];

        $data['etablissements'] = [
            'etablissement' => $this->etablissementRepository->getNomEtablissementsFromAnnee($anneeDeb, $anneeFin),
            'commune' => $this->localisationRepository->getNomCommuneFromAnnee($anneeDeb, $anneeFin),
            'departement' => $this->localisationRepository->getNomDepartementFromAnnee($anneeDeb, $anneeFin),
            'pays' => $this->localisationRepository->getNomPaysFromAnnee($anneeDeb, $anneeFin)
        ];

        return $data;
    }

    public function getDonneesFromTypeBac( $typeBac ): ?array
    {
        $data = [];
        $specialites              = $this->specialiteRepository->getLibSpecialitesFromTypeBac( $typeBac );
        $enseignementsSpecialites = $this->enseignementSpecialiteRepository->getLibEnseignementSpecialiteFromTypeBac( $typeBac );

        if ( ! empty( $specialites ) )
            $data['baccalaureats']['specialites'] = $specialites;

        if ( ! empty( $enseignementsSpecialites ) )
            $data['baccalaureats']['enseignementsSpecialites'] = $enseignementsSpecialites;

        return $data;
    }

    public function getDonneesFromFiltres(array $filtres): ?array
    {
        $anneeDeb = $_SESSION['anneeCourante']['anneeDeb'];
        $anneeFin = $_SESSION['anneeCourante']['anneeFin'];

        $candidats = $this->candidatRepository->getCandidatsFiltres(
            $anneeDeb,
            $anneeFin,
            $filtres
        );

        return ! empty($candidats) ? $candidats : null;
    }

    public function getDonneesFromEtablissement(array $filtres): array
    {
        $anneeDeb = $_SESSION['anneeCourante']['anneeDeb'];
        $anneeFin = $_SESSION['anneeCourante']['anneeFin'];
        $data = [];

        if (!empty($filtres['etablissement'])) {
            $data['communes'] = $this->localisationRepository
                ->getCommunesFromEtablissement($anneeDeb, $anneeFin, $filtres['etablissement']);
        }

        if (!empty($filtres['commune'])) {
            $data['departements'] = $this->localisationRepository
                ->getDepartementsFromCommune($anneeDeb, $anneeFin, $filtres['commune']);
        }

        if (!empty($filtres['departement'])) {
            $data['pays'] = $this->localisationRepository
                ->getPaysFromDepartement($anneeDeb, $anneeFin, $filtres['departement']);
        }

        return $data;
    }

    public function getSeriesDiplomeFromAnnee($anneeDeb, $anneeFin): ?array
    {
        return $this->serieDiplomeRepository->getCodeSeriesDiplomesFromAnnee($anneeDeb, $anneeFin);
    }

    public function getCandidatsFromCodeSerieDip($codeSerieDip): ?array
    {
        $anneeDeb = $_SESSION['anneeCourante']['anneeDeb'];
        $anneeFin = $_SESSION['anneeCourante']['anneeFin'];

        return $this->candidatRepository->getCandidatsFromCodeSerieDip($codeSerieDip, $anneeDeb, $anneeFin);
    }

    public function updateNoteDossierFromCodeSerieDip($note, $codeSerieDip)
    {
        $anneeDeb = $_SESSION['anneeCourante']['anneeDeb'];
        $anneeFin = $_SESSION['anneeCourante']['anneeFin'];

        $this->candidatRepository->updateNoteDossierFromCodeSerieDip($note, $codeSerieDip, $anneeDeb, $anneeFin);
    }
}