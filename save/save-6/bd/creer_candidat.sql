-- @author  : Groupe 10 - FLEM Anthony, AZENHA NASCIMENTO Marta, DELPECH Nicolas, FRERET Alexandre
-- @date    : Le 30 mars 2026
-- @version : 1.3

/* ============================================================ */
/*  Script d'insertion de la base de données des données excel  */
/* ============================================================ */

-- Suppression des tables de la base de données
drop table if exists Candidat_EnseignementSpecialite cascade;
drop table if exists Candidat                        cascade;
drop table if exists SerieDiplome                    cascade;
drop table if exists Formation                       cascade;
drop table if exists Filiere                         cascade;
drop table if exists TypeDiplome                     cascade;
drop table if exists Specialite                      cascade;
drop table if exists EnseignementSpecialite          cascade;
drop table if exists Etablissement                   cascade;
drop table if exists Localisation                    cascade;


-- Création de la table Localisation
create table Localisation (
	idLoc       int             primary key,
	nomCommu    varchar(100)    not null,
	nomDept     varchar(100)    not null,
	pays        varchar(100)    not null
);

-- Création de la table Etablissement
create table Etablissement (
	idEtab      int             primary key,
	nomEtab     varchar(150)    not null,
	codePost    varchar(10),
	idLoc       int             not null references Localisation(idLoc)
);

-- Création de la table Formation
create table Formation (
	idFormation  serial          primary key,
	libFormation varchar(200)   not null unique
);

-- Création de la table Filiere
create table Filiere (
	idFiliere   serial          primary key,
	libFiliere  varchar(200)    not null unique
);

-- Création de la table TypeDiplome
create table TypeDiplome (
	idTypeDip   int             primary key,
	libTypeDip  varchar(100)    not null
);

-- Création de la table Specialite
create table Specialite (
	idSpe       serial          primary key,
	libSpe      varchar(150)    not null unique
);

-- Création de la table EnseignementSpecialite
create table EnseignementSpecialite (
	idEnsSpe    serial          primary key,
	libEnsSpe   varchar(150)    not null unique
);

-- Création de la table SerieDiplome
create table SerieDiplome (
	idSerieDip   serial          primary key,
    codeSerieDip varchar(50)     not null unique,
	libSerieDip  varchar(100)    not null
);

-- Création de la table Candidat
create table Candidat (
	idCand          int             primary key,
	codeCand        int             not null,
	nomCand         varchar(100)    not null,
	prenomCand      varchar(100)    not null,
	civilite        varchar(10)     not null,
	profilCand      varchar(50)     not null,
	nvBoursCand     int             not null,
	noteGlobale     float           ,
	noteFicheAvenir float           ,
	noteLycee       float           ,
	noteDossier     float,
	anneeDeb        int             not null,
	anneeFin        int             not null,
	commentaire     text,
	idFormation     int             references Formation    (idFormation),
	idFiliere       int             references Filiere      (idFiliere  ),
	idTypeDip       int             not null references TypeDiplome  (idTypeDip),
	idSerieDip      int             not null references SerieDiplome (idSerieDip),
	idSpe           int             references Specialite   (idSpe      ),
	idEtab          int             references Etablissement(idEtab     )
);

-- Création de la table Candidat_EnseignementSpecialite
create table Candidat_EnseignementSpecialite (
	idCand      int             not null references Candidat(idCand),
	idEnsSpe    int             not null references EnseignementSpecialite(idEnsSpe),
	abandonnee  boolean         not null,
	primary key (idCand, idEnsSpe)
);