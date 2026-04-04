<?php
// app/controllers/tableau/TableauController.php

require_once '../app/core/Controller.php';
require_once '../app/services/StatsService.php';

class TableauController extends Controller
{
	public function tableau(): void
	{
		$this->view('tableau');
	}
}