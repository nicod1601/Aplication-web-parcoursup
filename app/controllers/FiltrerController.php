<?php
// app/controllers/FiltrerController.php

require_once '../app/core/Controller.php';

class FiltrerController extends Controller
{
	public function index(): void
	{
		$this->view('filtrer');
	}
}
