# Git — Commandes essentielles

## Initialisation

```bash
git init                        # Initialiser un dépôt
git clone <url>                 # Cloner un dépôt distant
```

## Configuration

```bash
git config --global user.name "Ton Nom"
git config --global user.email "ton@email.com"
```

## Workflow quotidien

```bash
git status                      # Voir l'état des fichiers
git add .                       # Stager tous les changements
git add <fichier>               # Stager un fichier précis
git commit -m "message"         # Committer avec un message
git push origin <branche>       # Pousser vers le dépôt distant
git pull origin <branche>       # Récupérer les derniers changements
```

## Branches

```bash
git branch                      # Lister les branches
git branch <nom>                # Créer une branche
git checkout <nom>              # Changer de branche
git checkout -b <nom>           # Créer et basculer sur une branche
git merge <nom>                 # Fusionner une branche dans la courante
git branch -d <nom>             # Supprimer une branche (locale)
```

## Historique & inspection

```bash
git log --oneline               # Historique condensé
git log --oneline --graph       # Historique avec arbre des branches
git diff                        # Voir les modifications non stagées
git diff --staged               # Voir les modifications stagées
```

## Annulation

```bash
git restore <fichier>           # Annuler les modifications d'un fichier
git restore --staged <fichier>  # Désindexer un fichier
git revert <commit>             # Créer un commit d'annulation
git reset --hard HEAD~1         # ⚠️ Supprimer le dernier commit (irréversible)
```

## Remote

```bash
git remote -v                           # Lister les dépôts distants
git remote add origin <url>             # Ajouter un remote
git remote set-url origin <url>         # Modifier l'URL du remote
```
