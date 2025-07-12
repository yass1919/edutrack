# EduTrack - Déploiement Serveur Externe

## Résumé Rapide

EduTrack est une application web complète prête pour le déploiement. Elle nécessite :
- **Node.js 18+** 
- **PostgreSQL**
- **Serveur Linux** (Ubuntu/CentOS/Debian)

## Déploiement Automatique

### 1. Préparer le Serveur

```bash
# Télécharger l'application
git clone <URL_REPO> /opt/edutrack
cd /opt/edutrack

# Créer la configuration
cp .env.example .env
nano .env  # Modifier DATABASE_URL
```

### 2. Lancer le Déploiement

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Déployer automatiquement
./deploy.sh
```

**C'est tout !** L'application sera accessible sur `http://votre-serveur:3000`

## Configuration Requise

### Base de Données PostgreSQL

```bash
# Exemple de configuration DATABASE_URL
DATABASE_URL=postgresql://edutrack:motdepasse@localhost:5432/edutrack
```

### Comptes par Défaut

| Rôle | Nom d'utilisateur | Mot de passe |
|------|------------------|--------------|
| Admin | admin | password |
| Fondateur | founder | password |
| Professeur | PC1, PC2, PC3, PC4 | password |
| Professeur | PL1, PL2, PL3, PL4 | password |
| Inspecteur | IMATH, IPC | password |
| SG | SG1, SG2 | password |

**⚠️ Changez TOUS les mots de passe en production !**

## Serveurs Compatibles

- **VPS** : DigitalOcean, Linode, Vultr
- **Cloud** : AWS EC2, Google Cloud, Azure
- **Hébergement** : Hostinger, OVH, Infomaniak
- **Serveur dédié** : Tout serveur Linux

## Proxy Inverse (Optionnel)

Pour utiliser un nom de domaine :

```bash
# Installer Nginx
sudo apt install nginx

# Configuration simple
sudo tee /etc/nginx/sites-available/edutrack << 'EOF'
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Activer
sudo ln -s /etc/nginx/sites-available/edutrack /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## Maintenance

```bash
# Voir les logs
pm2 logs edutrack

# Redémarrer
pm2 restart edutrack

# Sauvegarder la DB
pg_dump -U edutrack edutrack > backup.sql

# Surveiller
pm2 monit
```

## Sécurité Production

1. **Changer tous les mots de passe**
2. **Configurer le firewall** (ports 80, 443, 22 seulement)
3. **Utiliser HTTPS** avec Let's Encrypt
4. **Sauvegardes automatiques** de la base de données
5. **Monitoring** avec PM2

## Architecture Déployée

```
Internet → Nginx (80/443) → Node.js (3000) → PostgreSQL (5432)
```

## Taille et Performance

- **Taille app** : ~200 MB
- **RAM minimum** : 1 GB
- **Utilisateurs simultanés** : 100+ (selon serveur)
- **Base de données** : Évolutive selon besoins

## Support

- **Port par défaut** : 3000
- **Logs** : `pm2 logs edutrack`
- **Config** : `.env`
- **Base de données** : Via `DATABASE_URL`

L'application est **prête pour la production** avec authentification, base de données, et interface complète pour gestion scolaire.