<?php

require_once '../app/core/Controller.php';

class PlatformeController extends Controller
{
	public function platforme(): void
	{
		$this->view('index');
	}
}