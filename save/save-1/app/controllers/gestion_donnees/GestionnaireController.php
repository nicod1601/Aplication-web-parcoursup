<?php
// app/controllers/GestionnaireController.php

require_once '../app/core/Controller.php';

class GestionnaireController extends Controller
{
	public function index(): void
	{
		$this->view('gestionnaire');
	}
}
