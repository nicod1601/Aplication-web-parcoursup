<?php
// app/controllers/StatsService.php

require_once '../app/repositories/CandidatRepository.php';
require_once '../app/repositories/SerieDiplomeRepository.php';
require_once '../app/repositories/GenreRepository.php';
require_once '../app/repositories/AnneeRepository.php';

class StatsService
{
	private CandidatRepository $candidatRepository;
	private SerieDiplomeRepository $serieDiplomeRepository;
	private GenreRepository $genreRepository;
	private AnneeRepository $anneeRepository;

	public function __construct()
	{
		$this->candidatRepository     = new CandidatRepository();
		$this->serieDiplomeRepository = new SerieDiplomeRepository();
		$this->genreRepository        = new GenreRepository();
		$this->anneeRepository        = new AnneeRepository();
	}

	public function getAllAnnees(): ?array
	{
		$annees = $this->anneeRepository->getAllAnnees();
		$annees = $this->formaterAnnees( $annees );

		return $annees;
	}

	public function getCandidatsFromAnnee($anneeDeb, $anneeFin): ?array
	{
		return $this->candidatRepository->getCandidatsFromAnnee($anneeDeb, $anneeFin);
	}

	public function getStatistiques($anneeDeb, $anneeFin): ?array
	{
		$data["totalCand"] = $this->candidatRepository->getNombreTotalFromAnnee($anneeDeb, $anneeFin);

		$data["diplomes"] = $this->serieDiplomeRepository->getSeriesDiplomesFromAnnee($anneeDeb, $anneeFin);
		$data["diplomes"] = $this->trierDiplomesStats( $data, "Générale", "STI2D", "STMG" );

		$data["genres"] = $this->genreRepository->getGenresFromAnnee($anneeDeb, $anneeFin);
		$data["genres"] = $this->trierGenreStats( $data, "M.", "Mme" );

		return $data;
	}

	private function formaterAnnees(array $annees): ?array
	{
		for ($cpt = 0; $cpt < count($annees); $cpt++)
		{
			$anneeDeb = $annees[$cpt]["anneedeb"];
			$anneeFin = $annees[$cpt]["anneefin"];
			$anneeFormatee = $anneeDeb . "-" . $anneeFin;

			$annees[$cpt] = [
				'value' => $anneeFormatee
			];
		}

		return $annees;
	}

	private function trierDiplomesStats(array $data, $dip1, $dip2, $dip3): ?array
	{
		$dataRet = [];
		$cptDipAutre = 0;

		foreach( $data["diplomes"] as $diplome )
		{
			if ( $diplome["codeseriedip"] !== $dip1 &&
				 $diplome["codeseriedip"] !== $dip2 &&
				 $diplome["codeseriedip"] !== $dip3    )
				$cptDipAutre+= $diplome["total"];
			else
				$dataRet[] = $diplome;
		}

		$dataRet[] = [
			"codeseriedip" => "Autres",
			"total" => $cptDipAutre,
		];

		return $dataRet;
	}

	private function trierGenreStats(array &$data, $gen1, $gen2): ?array
	{
		$dataRet = [];
		$cptGenreAutre = 0;

		foreach( $data["genres"] as $genre )
		{
			if ( $genre["civilite"] !== $gen1 &&
				 $genre["civilite"] !== $gen2    )
				$cptGenreAutre+= $genre["total"];
			else
				$dataRet[] = $genre;
		}

		$dataRet[] = [
			"civilite" => "Autres",
			"total" => $cptGenreAutre
		];

		return $dataRet;
	}
}