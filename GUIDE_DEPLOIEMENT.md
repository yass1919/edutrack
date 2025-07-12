# Guide de Déploiement EduTrack

## Prérequis

1. **Base de données PostgreSQL** - Créer une base de données PostgreSQL accessible depuis internet
2. **Serveur Node.js** - Serveur supportant Node.js 18+ (Ubuntu, CentOS, VPS, etc.)
3. **Nom de domaine** (optionnel) - Pour accès via URL personnalisée

## Étapes de Déploiement

### 1. Préparation du Serveur

```bash
# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2 pour la gestion des processus
sudo npm install -g pm2

# Créer un utilisateur pour l'application
sudo adduser edutrack
sudo usermod -aG sudo edutrack
```

### 2. Configuration Base de Données

```bash
# Créer base de données PostgreSQL
sudo -u postgres createdb edutrack
sudo -u postgres createuser edutrack_user -P
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE edutrack TO edutrack_user;"
```

### 3. Déploiement de l'Application

```bash
# Télécharger le code source
git clone <URL_REPO> /home/edutrack/app
cd /home/edutrack/app

# Installer les dépendances
npm install

# Créer le fichier de configuration
cat > .env << EOF
DATABASE_URL=postgresql://edutrack_user:MOT_DE_PASSE@localhost:5432/edutrack
NODE_ENV=production
PORT=3000
EOF

# Construire l'application
npm run build

# Initialiser la base de données
npm run db:push
```

### 4. Importation des Données

```bash
# Importer le schéma et les données de base
psql -U edutrack_user -d edutrack -f seed.sql
```

### 5. Configuration PM2

```bash
# Créer la configuration PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'edutrack',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log'
  }]
};
EOF

# Créer le dossier logs
mkdir -p logs

# Démarrer l'application
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 6. Configuration Nginx (Reverse Proxy)

```bash
# Installer Nginx
sudo apt-get install nginx

# Créer la configuration
sudo tee /etc/nginx/sites-available/edutrack << EOF
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Activer le site
sudo ln -s /etc/nginx/sites-available/edutrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL avec Let's Encrypt (Optionnel)

```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d votre-domaine.com
```

## Configuration des Comptes Utilisateurs

L'application est livrée avec des comptes par défaut :

### Comptes Administrateurs
- **admin** / password - Administrateur système
- **founder** / password - Fondateur

### Comptes Professeurs
- **PC1, PC2, PC3, PC4** / password - Professeurs Collège
- **PL1, PL2, PL3, PL4** / password - Professeurs Lycée

### Comptes Inspecteurs
- **IMATH, IPC** / password - Inspecteurs Maths et Physique-Chimie

### Comptes Surveillants Généraux
- **SG1, SG2** / password - Surveillants Généraux

## Maintenance

### Sauvegarde Base de Données
```bash
# Sauvegarde quotidienne
pg_dump -U edutrack_user edutrack > backup_$(date +%Y%m%d).sql

# Script de sauvegarde automatique
echo "0 2 * * * pg_dump -U edutrack_user edutrack > /home/edutrack/backups/backup_\$(date +\%Y\%m\%d).sql" | crontab -
```

### Surveillance des Logs
```bash
# Voir les logs en temps réel
pm2 logs edutrack

# Monitoring
pm2 monit
```

### Mise à Jour
```bash
# Télécharger les nouvelles versions
git pull origin main
npm install
npm run build
pm2 restart edutrack
```

## Sécurité

1. **Firewall** - Ouvrir uniquement les ports 80, 443, 22
2. **Mots de passe** - Changer TOUS les mots de passe par défaut
3. **Base de données** - Utiliser des mots de passe forts
4. **Sauvegardes** - Automatiser les sauvegardes quotidiennes
5. **Certificats SSL** - Utiliser HTTPS en production

## Support

- Port par défaut : 3000
- Logs application : `/home/edutrack/app/logs/`
- Logs Nginx : `/var/log/nginx/`
- Configuration : `/home/edutrack/app/.env`