<?php
// app/controllers/CarteController.php

require_once '../app/core/Controller.php';

class CarteController extends Controller
{
	public function index(): void
	{
		$this->view('carte');
	}
}
