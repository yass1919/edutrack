#!/bin/bash

# Script de déploiement EduTrack
# Usage: ./deploy.sh

set -e

echo "🚀 Déploiement EduTrack - Début"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Variables
APP_DIR="/home/edutrack/app"
SERVICE_NAME="edutrack"

echo "📦 Installation des dépendances..."
npm install --production

echo "🏗️ Construction de l'application..."
npm run build

echo "🗄️ Vérification de la base de données..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Variable DATABASE_URL non définie"
    echo "Créez un fichier .env avec DATABASE_URL=postgresql://user:password@host:port/dbname"
    exit 1
fi

echo "🔄 Synchronisation du schéma de base de données..."
npm run db:push

echo "📋 Import des données de base..."
if [ -f "seed.sql" ]; then
    echo "Importation du fichier seed.sql..."
    # Extraire les informations de connexion depuis DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | grep -oP '(?<=@)[^:]+')
    DB_PORT=$(echo $DATABASE_URL | grep -oP '(?<=:)[0-9]+(?=/)')
    DB_NAME=$(echo $DATABASE_URL | grep -oP '(?<=/)[^?]+')
    DB_USER=$(echo $DATABASE_URL | grep -oP '(?<=://)[^:]+')
    DB_PASS=$(echo $DATABASE_URL | grep -oP '(?<=:)[^@]+(?=@)')
    
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f seed.sql
else
    echo "⚠️ Fichier seed.sql non trouvé, création des données de base..."
fi

echo "🔧 Configuration PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Installation de PM2..."
    npm install -g pm2
fi

# Créer la configuration PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000,
      DATABASE_URL: process.env.DATABASE_URL
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};
EOF

# Créer le dossier logs
mkdir -p logs

echo "🚀 Démarrage du service..."
pm2 delete $SERVICE_NAME 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "✅ Déploiement terminé avec succès!"
echo ""
echo "📊 Statut du service:"
pm2 status $SERVICE_NAME
echo ""
echo "📋 Commandes utiles:"
echo "  - Voir les logs: pm2 logs $SERVICE_NAME"
echo "  - Redémarrer: pm2 restart $SERVICE_NAME"
echo "  - Arrêter: pm2 stop $SERVICE_NAME"
echo "  - Monitoring: pm2 monit"
echo ""
echo "🌐 Application accessible sur http://localhost:3000"