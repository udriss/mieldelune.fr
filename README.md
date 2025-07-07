# MielDeLune - Portfolio Photographie

## 📝 Description
Un site web professionnel pour présenter des services de photographie haut de gamme, principalement axés sur les mariages et autres événements prestigieux.

## ✨ Fonctions Principales
- Galerie photo dynamique
- Réservation et paiement en ligne
- Gestion de blog
- Interface d’administration sécurisée
- Optimisation SEO
- Responsive design

## 🏗 Technologies
- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, PostgreSQL
- **Authentification**: NextAuth.js
- **Hébergement & Stockage**: Vercel + Vercel Blob
- **Gestion des dépendances**: npm

## Structure du Projet

### Répertoires Principaux
- 📁 `app/` - Pages et routes Next.js 
- 📁 `components/` - Composants React réutilisables
- 📁 `hooks/` - Hooks React personnalisés
- 📁 `lib/` - Utilitaires et configurations
- 📁 `public/` - Assets statiques (images, fonts)
- 📁 `styles/` - Stylesheets globaux

### Fichiers de Configuration
- 📄 `.env` - Variables d'environnement locales
- 📄 `.env.production` - Variables d'environnement production
- 📄 `.env.development` - Variables d'environnement développement
- 📄 `next.config.js` - Configuration Next.js
- 📄 `package.json` - Dépendances et scripts
- 📄 `tsconfig.json` - Configuration TypeScript
- 📄 `tailwind.config.ts` - Configuration TailwindCSS


### API Routes
#### Authentication
- /api/admin: Gestion de l'authentification admin
#### Images & Media
- /api/upload: Upload d'images
- /api/uploadProfil: Upload de l'image de profil
- /api/images: Récupération des images
- /api/generate-thumbnail: Génération de miniatures
- /api/addUrl: Ajout d'URL d'images externes
#### Gestion des Mariages
- /api/mariages: Liste tous les mariages
- /api/mariage/[id]: Opérations CRUD sur un mariage spécifique
- /api/newEvent: Création d'un nouvel événement
- /api/deleteEvent: Suppression d'un événement
- /api/updateOrder: Mise à jour de l'ordre des mariages
- /api/updateImagesOrder: Mise à jour de l'ordre des images
- /api/updateVisibility: Toggle visibilité d'un mariage
- /api/updateInputs: Mise à jour des champs d'un mariage
#### Configuration du Site
- /api/siteSettings: Paramètres généraux du site
- /api/profile: Gestion du profil photographe
- /api/getSocialMediaInfo: Informations réseaux sociaux
- /api/contact: Envoi de formulaire de contact
#### Système de Fichiers
- /api/files/[...filePath]: Gestion des fichiers statiques
- /api/update: Mise à jour des fichiers/images

Chaque route utilise les méthodes HTTP appropriées (GET, POST, PUT) et inclut la gestion d'erreurs et les validations nécessaires.

## 🎛 Variables d’Environnement
SECRET_KEY=
STORED_HASH=


SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_TO=

NODE_ENV=
NEXT_PUBLIC_DEPLOYMENT_DOMAIN=

## License
LICENCE LOGICIELLE PROPRIÉTAIRE ET ACCORD DE CONFIDENTIALITÉ

Copyright (c) 2024 MielDeLune

TERMES ET CONDITIONS

1. PROPRIÉTÉ
Ce logiciel et sa documentation sont la propriété exclusive de M. I. Sekrane.
Tous droits réservés. Toute utilisation non autorisée est strictement interdite.

2. RESTRICTIONS
Il est strictement interdit de :
- Copier, modifier ou distribuer le code source
- Décompiler ou désassembler le logiciel
- Utiliser le code à des fins commerciales
- Transférer les droits à des tiers
- Créer des œuvres dérivées

3. CONFIDENTIALITÉ
Toutes les informations contenues dans ce logiciel sont confidentielles.
Les utilisateurs s'engagent à :
- Maintenir la confidentialité du code
- Ne pas divulguer les informations techniques
- Protéger la propriété intellectuelle

4. VIOLATIONS
Toute violation de ces termes entraînera :
- La révocation immédiate des droits d'utilisation
- Des poursuites juridiques
- Des dommages et intérêts

5. GARANTIE
Le logiciel est fourni "tel quel" sans garantie d'aucune sorte.

CONTACT LÉGAL
Pour toute autorisation : admin@sekrane.fr

Tous droits réservés © 2025 Idriss Sekrane


