# HorizonBIA Quiz

Application SPA prête à être déposée sur un sous-domaine comme `https://quiz.horizonbia.com/`.

## Structure livrée
```
/quiz.horizonbia.com/
├── index.html              # SPA élève
├── assets/                 # JS/CSS React chargés via CDN ESM
├── api/
│   ├── quizzes/            # Quiz JSON
│   │   ├── aero-1.json
│   │   ├── histoire-1.json
│   │   ├── navigation-1.json
│   │   └── index.json
│   └── upload.php          # Import CSV ↦ JSON + liste/suppression
└── admin/
    ├── index.html          # Interface React admin
    ├── admin.js
    └── admin.css
```

## Installation
1. Déposez tous les fichiers sur votre hébergement (Hostinger/FTP). Assurez-vous que PHP 8 est actif pour `/api/upload.php`.
2. Accédez à `https://quiz.horizonbia.com/` pour l'interface élève.
3. L'espace admin est disponible via `https://quiz.horizonbia.com/admin/`.

## Déploiement et règles de dépôt
- Le déploiement se fait via l'outil d'extraction de ChatGPT : fournissez simplement le dépôt sans empaquetage manuel.
- Aucune archive ZIP ou autre binaire (images, vidéos, PDF, etc.) ne doit être commise ici. Seuls des fichiers texte (HTML, JS, CSS, PHP, JSON, Markdown, `.htaccess`, etc.) sont autorisés dans le dépôt.
- Si un contenu statique devait être ajouté ultérieurement, privilégiez des formats texte (SVG, JSON) et évitez tout upload binaire.

## Import CSV
- Colonnes attendues (séparateur `;`) : `question;choix1;choix2;choix3;choix4;bonne_reponse(1-4);explication`.
- Le script `upload.php` crée automatiquement un fichier JSON `{categorie}-{n}.json` dans `api/quizzes/`.

## Développement (optionnel, Vite)
- Le code front est fourni en ES modules React prêts à l'emploi sans build. Pour un flux Vite :
  ```bash
  npm install
  npm run dev
  npm run build
  ```
- Ajustez `vite.config.js` pour vos besoins (multi-entrée index/admin).
