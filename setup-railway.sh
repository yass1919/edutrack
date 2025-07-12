#!/bin/bash

# Script de préparation pour Railway.app
# Ce script prépare les fichiers pour le déploiement

echo "🚀 Préparation du projet EduTrack pour Railway.app"

# Créer le fichier railway.json si pas existant
if [ ! -f "railway.json" ]; then
    echo "📝 Création du fichier railway.json..."
    cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build && npm run db:push"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF
fi

# Créer un fichier .env.example pour Railway
echo "📋 Création du fichier .env.example pour Railway..."
cat > .env.railway << 'EOF'
# Variables d'environnement pour Railway
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=${{PORT}}
EOF

# Créer un README pour Railway
echo "📚 Création du README pour Railway..."
cat > README.md << 'EOF'
# EduTrack - Application de Gestion Scolaire

## Déploiement sur Railway

### Étapes Rapides
1. Fork ce repository
2. Créer un projet sur Railway.app
3. Connecter le repository GitHub
4. Ajouter une base PostgreSQL
5. Configurer les variables d'environnement

### Variables d'Environnement
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=${{PORT}}
```

### Comptes par Défaut
- **Admin**: admin / password
- **Fondateur**: founder / password
- **Professeur**: PC1 / password
- **Inspecteur**: IMATH / password
- **SG**: SG1 / password

⚠️ **Changez tous les mots de passe en production !**

### Fonctionnalités
- Gestion des utilisateurs multi-rôles
- Suivi des progressions de cours
- Tableaux de bord spécialisés
- Système de notifications
- Rapports et analytics

### Support
- Node.js 18+
- PostgreSQL
- Interface responsive
- Prêt pour production
EOF

# Créer un fichier .gitignore si pas existant
if [ ! -f ".gitignore" ]; then
    echo "🚫 Création du fichier .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.production
.env.development

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp

# Coverage
coverage/
EOF
fi

echo "✅ Préparation terminée !"
echo ""
echo "📋 Fichiers créés :"
echo "   - railway.json (configuration Railway)"
echo "   - .env.railway (variables d'environnement)"
echo "   - README.md (documentation)"
echo "   - .gitignore (fichiers à ignorer)"
echo ""
echo "🚀 Prochaines étapes :"
echo "1. Créer un repository GitHub"
echo "2. Uploader tous les fichiers"
echo "3. Déployer sur Railway.app"
echo "4. Configurer PostgreSQL"
echo "5. Tester l'application"
echo ""
echo "📚 Consultez RAILWAY_GUIDE_PRATIQUE.md pour les étapes détaillées"