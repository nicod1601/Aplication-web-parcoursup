<?php

require_once __DIR__ . '/../../vendor/autoload.php';

abstract class Controller {

	protected function view(string $viewName, string $title = 'Titre de la page', array $data = [], $status = 200): void
	{
		$loader = new \Twig\Loader\FilesystemLoader(__DIR__ . '/../views');
		$twig   = new \Twig\Environment($loader, [
			'cache' => false, // Mettre __DIR__ . '/../../cache' en production
			'debug' => true,
		]);

		http_response_code($status);
		echo $twig->render($viewName . '.html.twig', array_merge($data, [
			'title' => $title,
		]));
	}

	protected function json($data, $status = 200) {
	   header('Content-Type: application/json');
	   http_response_code($status);
	   echo json_encode($data);
	   exit();
   }

	protected function redirectTo($url) {
		header("Location: $url");
		exit();
	}
}
