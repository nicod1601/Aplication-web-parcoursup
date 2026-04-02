<?php

class Compte
{
	private ?int $id;
	private string $nomCompte;
	private string $prenomCompte;
	private string $emailCompte;
	private string $passwordHashCompte;
	private bool $isAdmin;

	public function __construct(?int $id, string $nomCompte, string $prenomCompte, string $emailCompte, string $passwordHashCompte, bool $isAdmin)
	{
		$this->id = $id;
		$this->nomCompte = $nomCompte;
		$this->prenomCompte = $prenomCompte;
		$this->emailCompte = $emailCompte;
		$this->passwordHashCompte = $passwordHashCompte;
		$this->isAdmin = $isAdmin;
	}

	public function getId(): ?int { return $this->id; }
	public function getNomCompte(): string { return $this->nomCompte; }
	public function getPrenomCompte(): string { return $this->prenomCompte; }
	public function getEmailCompte(): string { return $this->emailCompte; }
	public function getPasswordHashCompte(): string { return $this->passwordHashCompte; }
	public function isAdmin(): bool { return $this->isAdmin; }

	public function setId(int $id): void { $this->id = $id; }
}