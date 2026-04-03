<?php

require_once '../app/core/Repository.php';
require_once '../app/entities/Compte.php';

class CompteRepository
{
	private $pdo;

	public function __construct()
	{
		$this->pdo = Repository::getInstance()->getPDO();
	}

    public function create(Compte $compte)
    {
        $sql = "INSERT INTO compte (nomCompte, prenomCompte, emailCompte, passCompte, isAdmin) 
        VALUES (:nomCompte, :prenomCompte, :emailCompte, :passCompte, :isAdmin) RETURNING idCompte";

        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':nomCompte', $compte->getNomCompte());
        $stmt->bindValue(':prenomCompte', $compte->getPrenomCompte());
        $stmt->bindValue(':emailCompte', $compte->getEmailCompte());
        $stmt->bindValue(':passCompte', $compte->getPasswordHashCompte());
        $stmt->bindValue(':isAdmin', $compte->isAdmin(), PDO::PARAM_BOOL);

        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row && isset($row['idCompte'])) {
            $compte->setId((int) $row['idCompte']);
        }

        return $compte;
    }

    public function createCompteFromRow(array $row)
	{
		return new Compte(
			isset($row['idcompte']) ? (int) $row['idcompte'] : (isset($row['id']) ? (int)$row['id'] : null),
			$row['nomcompte'] ?? $row['nomCompte'] ?? '',
			$row['prenomcompte'] ?? $row['prenomCompte'] ?? '',
			$row['emailcompte'] ?? $row['emailCompte'] ?? '',
			$row['passcompte'] ?? $row['passCompte'] ?? '',
			isset($row['isadmin']) ? (bool)$row['isadmin'] : (isset($row['isAdmin']) ? (bool)$row['isAdmin'] : false)
		);
	}

	public function findByEmail(string $email)
	{
		$sql = "SELECT * FROM compte WHERE emailCompte = :email";
		$stmt = $this->pdo->prepare($sql);
		$stmt->bindValue(':email', $email);
		$stmt->execute();

		$row = $stmt->fetch(PDO::FETCH_ASSOC);

		if ($row) {
			return $this->createCompteFromRow($row);
		}

		return null;
	}
}