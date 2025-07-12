# Guide Pratique - Déploiement EduTrack sur Railway

## ✅ Étapes Détaillées

### 1. Préparer le Code (5 minutes)

**1.1 Créer un Repository GitHub**
1. Allez sur https://github.com
2. Cliquez "New repository"
3. Nom : `edutrack-app`
4. Cochez "Public" (ou Private si vous avez un compte pro)
5. Cliquez "Create repository"

**1.2 Uploader le Code**
1. Téléchargez TOUS les fichiers de ce projet Replit
2. Créez un ZIP avec tous les fichiers
3. Sur GitHub, cliquez "uploading an existing file"
4. Glissez-déposez tous les fichiers
5. Ajoutez un message : "Initial commit - EduTrack app"
6. Cliquez "Commit changes"

### 2. Déployer sur Railway (10 minutes)

**2.1 Créer un Compte**
1. Allez sur https://railway.app
2. Cliquez "Login" → "Sign up with GitHub"
3. Autorisez Railway à accéder à votre GitHub

**2.2 Créer le Projet**
1. Cliquez "New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Choisissez votre repository `edutrack-app`
4. Cliquez "Deploy Now"

**2.3 Ajouter PostgreSQL**
1. Dans votre projet, cliquez "New Service"
2. Sélectionnez "Database" → "PostgreSQL"
3. Railway créera automatiquement une base de données
4. Attendez 2-3 minutes que ce soit prêt

### 3. Configuration (5 minutes)

**3.1 Variables d'Environnement**
1. Cliquez sur votre service web (Node.js)
2. Allez dans l'onglet "Variables"
3. Ajoutez ces 3 variables :

```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=${{PORT}}
```

**3.2 Attendre le Déploiement**
1. Allez dans l'onglet "Deployments"
2. Attendez que le statut soit "Success" (5-10 minutes)
3. Si échec, regardez les logs d'erreur

### 4. Tester l'Application (2 minutes)

**4.1 Accéder à l'App**
1. Dans l'onglet "Settings" de votre service web
2. Copiez l'URL publique (ex: `https://edutrack-app-production.railway.app`)
3. Ouvrez l'URL dans votre navigateur

**4.2 Premiers Tests**
1. Vous devriez voir la page de connexion
2. Connectez-vous avec :
   - **Nom** : `admin`
   - **Mot de passe** : `password`
3. Vous devriez accéder au dashboard admin

### 5. Initialiser les Données (10 minutes)

**5.1 Connecter à la Base de Données**
1. Dans Railway, cliquez sur votre service PostgreSQL
2. Cliquez sur "Connect" pour voir les informations
3. Utilisez un client PostgreSQL (recommandé : pgAdmin)

**5.2 Importer les Données**
1. Dans pgAdmin, créez une nouvelle connexion avec les infos Railway
2. Ouvrez l'outil Query
3. Copiez-collez le contenu du fichier `seed.sql` (de ce projet)
4. Exécutez la requête

### 6. Vérification Finale (2 minutes)

**6.1 Tester Tous les Rôles**
Testez la connexion avec :
- **Admin** : `admin` / `password`
- **Fondateur** : `founder` / `password`
- **Professeur** : `PC1` / `password`
- **Inspecteur** : `IMATH` / `password`
- **SG** : `SG1` / `password`

**6.2 Domaine Personnalisé (Optionnel)**
1. Dans "Settings" → "Domains"
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions

## 🎯 Résultat Final

Votre app sera accessible à :
`https://votre-projet.railway.app`

## 💰 Coûts

- **Starter Plan** : 5$ par mois
- Inclut : PostgreSQL, déploiement, SSL automatique
- Support jusqu'à 100 utilisateurs simultanés

## 🔧 Maintenance

### Redéploiement
- Chaque modification sur GitHub redéploie automatiquement
- Ou cliquez "Redeploy" dans Railway

### Surveillance
- Logs en temps réel dans l'onglet "Logs"
- Métriques dans l'onglet "Metrics"
- Alertes automatiques par email

### Sauvegardes
- PostgreSQL sauvegardé automatiquement par Railway
- Sauvegardes manuelles disponibles

## ⚠️ Sécurité

**IMMÉDIATEMENT après le déploiement :**
1. Changez TOUS les mots de passe par défaut
2. Créez vos vrais comptes administrateurs
3. Supprimez les comptes de test si nécessaire

## 🆘 Problèmes Courants

### Build Failed
- Vérifiez les logs dans "Deployments"
- Assurez-vous que tous les fichiers sont bien uploadés

### App Inaccessible
- Vérifiez que `PORT=${{PORT}}` est configuré
- Regardez les logs d'erreur

### Base de Données Vide
- Importez le fichier `seed.sql` via pgAdmin
- Vérifiez que `DATABASE_URL` est correctement configurée

## 📞 Support

Si vous avez des problèmes :
1. Vérifiez les logs Railway
2. Testez en local d'abord
3. Vérifiez la configuration des variables

Votre application EduTrack sera opérationnelle en 30 minutes maximum !