## Installer Composer (si non disponible)

Vérifie d'abord que Composer est installé :
```bash
composer --version
```

Si la commande n'existe pas, installe Composer **localement** (sans droits admin) :
```bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php -r "if (hash_file('sha384', 'composer-setup.php') === 'c8b085408188070d5f52bcfe4ecfbee5f727afa458b2573b8eaaf77b3419b0bf2768dc67c86944da1544f06fa544fd47') { echo 'Installer verified'.PHP_EOL; } else { echo 'Installer corrupt'.PHP_EOL; unlink('composer-setup.php'); exit(1); }"
php composer-setup.php
php -r "unlink('composer-setup.php');"
```

`composer.phar` est maintenant disponible à la racine du projet.
Utilise-le directement **sans installation globale** :
```bash
php composer.phar install
```

Pour ne pas retaper `php composer.phar` à chaque fois,
tu peux créer un alias dans ton terminal :
```bash
alias composer='php composer.phar'
```

> Cet alias est temporaire (valable pour la session en cours).
> Pour le rendre permanent, ajoute-le à ton `~/.bashrc` ou `~/.zshrc`.

## Installer les dépendances du projet
```bash
php composer.phar install
```

## Vérifier l'installation de Twig
```bash
php -r "require 'vendor/autoload.php'; echo (class_exists('Twig\Environment') ? 'Twig OK' : 'Twig manquant') . PHP_EOL;"
```