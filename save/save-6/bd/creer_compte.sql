-- @author  : Groupe 10 - FLEM Anthony, AZENHA NASCIMENTO Marta, DELPECH Nicolas, FRERET Alexandre
-- @date    : Le 30 mars 2026
-- @version : 1.0

/* ============================================================ */
/*  Script d'insertion de la base de données pour les comptes  */
/* ============================================================ */

-- Suppression des tables de la base de données
drop table if exists Compte cascade;

-- Création de la table Compte
create table Compte(
    idCompte     serial          primary key        ,
    nomCompte    varchar(50)  not null              ,
    prenomCompte varchar(50)  not null              ,
    emailCompte  varchar(100) not null              ,
    passCompte   text         not null              ,
    isAdmin        boolean      default false not null
);