# Application MVC PHP

Application web développée en PHP selon l'architecture **MVC (Modèle-Vue-Contrôleur)**.

> **Note** : La couche `services/` est **optionnelle**. Pour les projets simples, les contrôleurs peuvent appeler les repositories directement, sans passer par un service intermédiaire.

---

## Architecture du projet

```
projet/
├── app/
│   ├── controllers/          # Contrôleurs (logique métier)
│   │   └── ExampleController.php
│   ├── core/                 # Classes de base
│   │   ├── Controller.php
│   │   └── Repository.php
│   ├── entities/             # Entités (modèles de données)
│   │   └── ExampleEntity.php
│   ├── repositories/         # Accès base de données
│   │   └── ExampleRepository.php
│   ├── services/             # Services (optionnel — logique métier découplée)
│   │   └── ExampleService.php
│   └── views/                # Vues Twig (affichage)
│       ├── _template/
│       │   ├── header.html.twig
│       │   └── footer.html.twig
│       └── example.html.twig
├── config/
│   └── config.php            # Configuration (base de données, constantes)
├── public/                   # Dossier public (accessible web)
│   ├── style.css             # Styles CSS
│   └── index.php             # Point d'entrée
├── vendor/                   # Dépendances Composer (non versionné)
├── composer.json
├── INSTALL.md
└── GIT.md
```

---

## Le Pattern MVC

### Principe de base

L'architecture MVC sépare l'application en 3 couches :

1. **Modèle** : Gestion des données (entités, repositories, services)
2. **Vue** : Affichage et présentation
3. **Contrôleur** : Coordination entre modèle et vue

```
Utilisateur → Point d'entrée (public/*.php)
                    ↓
              Contrôleur (traite la demande)
                    ↓
         ┌──────────┴──────────┐
         │ Avec service        │ Sans service (simple)
         ↓                     ↓
      Service              Repository
         ↓                     ↓
      Repository          Entités
         ↓
      Entités
         └──────────┬──────────┘
                    ↓
              Vue (affiche les données)
                    ↓
              Navigateur (rendu HTML)
```

---

## Détail des composants

### 1. Core

#### `app/core/Controller.php`

Classe abstraite dont héritent tous les contrôleurs.

**Méthodes principales** :

##### `view(string $viewName, string $title, array $data)`

Charge une vue Twig et lui transmet des données.

```php
$this->view('example', 'Titre de la page', [
    'items' => $items,
]);
```

**Fonctionnement** :
1. Crée un `FilesystemLoader` pointant sur `app/views/`
2. Instancie `\Twig\Environment` avec ce loader
3. Appelle `$twig->render('example.html.twig', $data + ['title' => $title])`
4. Les clés du tableau deviennent des variables Twig dans le template

```php
// Dans le contrôleur
$this->view('example', 'Titre', ['name' => 'Alice']);

// Dans la vue example.html.twig
<h1>{{ name }}</h1>  {# Affiche "Alice" #}
```

##### `json($data, int $status)`

Retourne des données au format JSON.

```php
$this->json(['items' => $items]);
```

##### `redirectTo(string $url)`

Redirige vers une autre URL.

```php
$this->redirectTo('index.php');
```

---

#### `app/core/Repository.php`

Singleton gérant la connexion PDO unique à la base de données. Toutes les classes repository en héritent.

```php
// Récupération de la connexion dans un repository
$this->pdo = Repository::getInstance()->getPDO();
```

---

### 2. Entités (`app/entities/`)

Les entités sont de simples objets PHP représentant les données métier. Elles n'ont aucune logique d'accès à la base de données.

```php
class ExampleEntity
{
    public function __construct(
        private int $id,
        private string $name,
        private ?string $description
    ) {}

    public function getId(): int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getDescription(): ?string { return $this->description; }
}
```

---

### 3. Repositories (`app/repositories/`)

Les repositories encapsulent les requêtes SQL. Ils reçoivent et retournent des entités.

```php
class ExampleRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Repository::getInstance()->getPDO();
    }

    private function createExampleFromRow(array $row): ExampleEntity
    {
        return new ExampleEntity(
            (int) $row['id'],
            $row['name'],
            $row['description']
        );
    }

    public function findAll(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM example ORDER BY name ASC');
        $items = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $items[] = $this->createExampleFromRow($row);
        }
        return $items;
    }

    public function findById(int $id): ?ExampleEntity
    {
        $stmt = $this->pdo->prepare('SELECT * FROM example WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->createExampleFromRow($row) : null;
    }
}
```

---

### 4. Services (`app/services/`) — optionnel

> La couche service est **optionnelle**. Pour les projets simples, le contrôleur peut appeler le repository directement.

Les services sont utiles quand la logique métier dépasse une simple lecture/écriture : règles de validation, agrégation de plusieurs repositories, calculs, etc.

```php
class ExampleService
{
    private ExampleRepository $repository;

    public function __construct()
    {
        $this->repository = new ExampleRepository();
    }

    public function getAllItems(): array
    {
        return $this->repository->findAll();
    }
}
```

---

### 5. Contrôleurs (`app/controllers/`)

Les contrôleurs reçoivent la requête HTTP, appellent les services (ou les repositories directement) et retournent une vue ou du JSON.

**Avec service** (logique métier découplée) :

```php
class ExampleController extends Controller
{
    private ExampleService $service;

    public function __construct()
    {
        $this->service = new ExampleService();
    }

    public function index(): void
    {
        $items = $this->service->getAllItems();

        $this->view('example', 'Liste des éléments', [
            'items' => $items
        ]);
    }
}
```

**Sans service** (projet simple — appel direct du repository) :

```php
class ExampleController extends Controller
{
    private ExampleRepository $repository;

    public function __construct()
    {
        $this->repository = new ExampleRepository();
    }

    public function index(): void
    {
        $items = $this->repository->findAll();

        $this->view('example', 'Liste des éléments', [
            'items' => $items
        ]);
    }
}
```

**Principe** :
- Le contrôleur **orchestre**, il ne contient pas de logique métier
- Aucune requête SQL dans un contrôleur
- Aucune logique d'affichage dans un contrôleur

---

### 6. Vues (`app/views/`)

Les vues sont des templates **Twig** (`.html.twig`). Elles ne contiennent aucun PHP.

#### Syntaxe Twig essentielle

| PHP natif | Twig |
|---|---|
| `<?= $var ?>` | `{{ var }}` |
| `<?= $var ?? 'défaut' ?>` | `{{ var\|default('défaut') }}` |
| `<?php foreach ($items as $item): ?>` | `{% for item in items %}` |
| `<?php endforeach; ?>` | `{% endfor %}` |
| `<?php if ($condition): ?>` | `{% if condition %}` |
| `<?php endif; ?>` | `{% endif %}` |
| `<!-- commentaire -->` | `{# commentaire #}` |

#### Templates : `header.html.twig` et `footer.html.twig`

**Emplacement** : `app/views/_template/`

**Rôle** : Éviter la duplication du squelette HTML.

```twig
{# header.html.twig #}
<!DOCTYPE html>
<html lang="fr">
<head>
    <title>{{ title|default('Mon Application') }}</title>
</head>
<body>
```

```twig
{# footer.html.twig #}
</body>
</html>
```

**Inclusion dans les vues** :
```twig
{% include '_template/header.html.twig' %}
<!-- Contenu de la page -->
{% include '_template/footer.html.twig' %}
```

#### Vue de liste : `example.html.twig`

```twig
{% if items is empty %}
    <div class="alert alert-info">
        Aucun élément disponible.
    </div>
{% else %}
    <div class="row">
        {% for item in items %}
            <div class="col-md-4">
                <div class="card">
                    <h5>{{ item.name }}</h5>
                    <p>{{ item.description }}</p>
                </div>
            </div>
        {% endfor %}
    </div>
{% endif %}
```

> **Accès aux getters** : Twig appelle automatiquement `getName()` via `item.name` (résolution automatique getter/propriété publique).

---

### 7. Points d'entrée (`public/`)

Les fichiers de `public/` sont les seuls accessibles depuis le navigateur. Chacun instancie un contrôleur et appelle une méthode.

```php
// public/index.php
<?php
require_once '../app/controllers/ExampleController.php';

$controller = new ExampleController();
$controller->index();
```

> L'autoload Composer (`vendor/autoload.php`) est chargé une seule fois dans `app/core/Controller.php`, ce qui évite de le répéter dans chaque point d'entrée.

---

## Flux de données complet

```
1. Utilisateur demande : http://localhost:8000/index.php

2. Serveur exécute : public/index.php
   ↓
   require_once ExampleController.php

3. Instanciation : $controller = new ExampleController()
   ↓
   Le constructeur instancie ExampleService (ou ExampleRepository directement)

4. Appel méthode : $controller->index()

   Avec service :
   ↓
   Appel $this->service->getAllItems()
   ↓
   Le service appelle $this->repository->findAll()
   ↓
   Le repository exécute la requête SQL et retourne des entités

   Sans service (projet simple) :
   ↓
   Appel $this->repository->findAll()
   ↓
   Le repository exécute la requête SQL et retourne des entités

5. Appel vue : $this->view('example', 'Titre', ['items' => $items])
   ↓
   Twig\Environment::render('example.html.twig', $data)
   Les clés du tableau deviennent des variables Twig

6. Rendu : app/views/example.html.twig
   ↓
   {% include '_template/header.html.twig' %}
   Rendu du HTML avec la syntaxe Twig ({{ }}, {% %})
   {% include '_template/footer.html.twig' %}

7. Réponse HTML envoyée au navigateur
```

---

## Concepts clés

### Séparation des responsabilités

| Composant | Responsabilité | Ne doit PAS contenir |
|---|---|---|
| **Contrôleur** | Coordination, réception de la requête | HTML, requêtes SQL |
| **Service** *(optionnel)* | Logique métier complexe, orchestration | HTML, accès direct PDO |
| **Repository** | Requêtes SQL, hydratation | Logique métier, HTML |
| **Entité** | Structure des données | Requêtes SQL, logique métier |
| **Vue** | Affichage, présentation | Logique métier, accès BDD |

### Transmission de données contrôleur → vue

Le contrôleur transmet des données via un tableau associatif. Twig les expose comme des variables dans le template.

```php
// Dans le contrôleur
$this->view('example', 'Titre', [
    'name' => 'Alice',
    'count' => 42
]);
```

```twig
{# Dans example.html.twig #}
{{ name }}   {# Alice #}
{{ count }}  {# 42 #}
```

`title` est automatiquement ajouté au contexte Twig par la méthode `view()`.

### Boucles dans les vues

```twig
{% for item in items %}
    <div>{{ item.name }}</div>
{% endfor %}
```

> Twig résout `item.name` en appelant automatiquement `$item->getName()`, `$item->isName()` ou en accédant à la propriété publique `$item->name`, dans cet ordre.

### Gestion des cas vides

```twig
{% if items is empty %}
    <p>Aucun élément disponible.</p>
{% else %}
    {# Affichage des éléments #}
{% endif %}
```

Ou avec le bloc `else` du `for` (syntaxe Twig native) :

```twig
{% for item in items %}
    <div>{{ item.name }}</div>
{% else %}
    <p>Aucun élément disponible.</p>
{% endfor %}
```

---

## Stack technique

- **PHP** >= 8.0
- **Twig** ^3.0 (moteur de templates)
- **Bootstrap** 5.3.8
- **Composer** (gestion des dépendances)

## Installation

Voir [INSTALL.md](INSTALL.md).

## Documentation Git

Voir [GIT.md](GIT.md).

## Usage

> À compléter

## Contributing

> À compléter
