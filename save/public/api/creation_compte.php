<?php
require_once __DIR__ . '/../../app/core/Repository.php';
header('Content-Type: application/json');

// Récupération des données JSON envoyées par le Fetch
$accounts = json_decode(file_get_contents('php://input'), true);

if (!$accounts || !is_array($accounts)) {
	echo json_encode(['success' => false, 'error' => 'Aucune donnée valide reçue']);
	exit;
}

try {
	$pdo = Repository::getInstance()->getPDO();
	$pdo->beginTransaction();

	// Récupération du dernier ID pour l'incrémenter manuellement
	$stmtId = $pdo->query("SELECT COALESCE(MAX(idCompte), 0) FROM Compte");
	$nextId = (int)$stmtId->fetchColumn();

	// Préparation de la requête avec les noms de colonnes SQL exacts
	$stmt = $pdo->prepare("
		INSERT INTO Compte (idCompte, nomCompte, prenomCompte, emailCompte, passCompte, isAdmin) 
		VALUES (?, ?, ?, ?, ?, ?)
	");

	foreach ($accounts as $user) {
		$nextId++;
		// Hachage sécurisé du mot de passe
		$hash = password_hash($user['passCompte'], PASSWORD_BCRYPT);

		$stmt->execute([
			$nextId,
			$user['nomCompte'],
			$user['prenomCompte'],
			$user['emailCompte'],
			$hash,
			isset($user['isAdmin']) && $user['isAdmin'] ? 'true' : 'false'
		]);
	}

	$pdo->commit();
	echo json_encode(['success' => true, 'count' => count($accounts)]);

} catch (Exception $e) {
	$pdo = Repository::getInstance()->getPDO();
	if ($pdo->inTransaction()) $pdo->rollBack();
	http_response_code(500);
	echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}