<?php
// app/controllers/importController.php

require_once '../app/core/Controller.php';
require_once '../app/repositories/ImportRepository.php';

class ImportController extends Controller
{
	private ImportRepository $importRepository;
	private FichierRepository $fichierRepository;

	public function __construct()
	{
		$this->importRepository = new ImportRepository();
		$this->fichierRepository = new FichierRepository();
	}

	public function import(): void
	{
		header('Content-Type: application/json');
		echo json_encode($this->importRepository->getAllDataFromExcel());
	}
}