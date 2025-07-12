# Déploiement EduTrack sur Railway.app

## Étape 1: Préparer le Projet

### 1.1 Créer un compte Railway
1. Allez sur https://railway.app
2. Cliquez sur "Login" puis "Sign up with GitHub"
3. Autorisez Railway à accéder à votre compte GitHub

### 1.2 Préparer le repository
1. Créez un nouveau repository GitHub (public ou privé)
2. Uploadez tous les fichiers du projet EduTrack
3. Assurez-vous que les fichiers suivants sont présents :
   - `package.json`
   - `server/` (dossier backend)
   - `client/` (dossier frontend)
   - `shared/` (dossier partagé)
   - `drizzle.config.ts`

## Étape 2: Configuration du Projet

### 2.1 Modifier package.json pour Railway
Ajoutez ces scripts dans package.json :

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "node dist/index.js",
    "railway:build": "npm run build && npm run db:push",
    "railway:start": "npm start"
  }
}
```

### 2.2 Créer railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run railway:build"
  },
  "deploy": {
    "startCommand": "npm run railway:start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## Étape 3: Déploiement sur Railway

### 3.1 Créer un nouveau projet
1. Connectez-vous à https://railway.app
2. Cliquez sur "New Project"
3. Sélectionnez "Deploy from GitHub repo"
4. Choisissez votre repository EduTrack
5. Cliquez sur "Deploy Now"

### 3.2 Ajouter une base de données PostgreSQL
1. Dans votre projet Railway, cliquez sur "New Service"
2. Sélectionnez "Database" → "PostgreSQL"
3. Railway créera automatiquement une base PostgreSQL
4. Notez l'URL de connexion générée

### 3.3 Configurer les variables d'environnement
1. Cliquez sur votre service web (Node.js)
2. Allez dans l'onglet "Variables"
3. Ajoutez ces variables :

```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=${{PORT}}
```

Note: Railway remplace automatiquement les variables avec `${{}}`.

## Étape 4: Configuration Avancée

### 4.1 Domaine personnalisé (optionnel)
1. Dans l'onglet "Settings" de votre service web
2. Allez à "Domains"
3. Cliquez sur "Custom Domain"
4. Ajoutez votre domaine personnalisé

### 4.2 Surveillance et logs
1. Onglet "Deployments" : voir l'historique des déploiements
2. Onglet "Logs" : voir les logs en temps réel
3. Onglet "Metrics" : surveiller les performances

## Étape 5: Initialisation de la Base de Données

### 5.1 Première connexion
1. Attendez que le déploiement soit terminé
2. Votre app sera accessible via l'URL Railway (ex: `https://votre-app.railway.app`)
3. La base de données sera automatiquement initialisée grâce à `npm run db:push`

### 5.2 Ajouter les données de test
1. Dans Railway, allez dans votre service PostgreSQL
2. Cliquez sur "Connect" pour obtenir les informations de connexion
3. Utilisez un client PostgreSQL (pgAdmin, DBeaver) pour vous connecter
4. Exécutez le contenu du fichier `seed.sql` pour ajouter les données de test

## Étape 6: Comptes par Défaut

Une fois déployé, vous pouvez vous connecter avec :

**Administrateur :**
- Nom : `admin`
- Mot de passe : `password`

**Fondateur :**
- Nom : `founder`
- Mot de passe : `password`

**Professeurs :**
- Noms : `PC1`, `PC2`, `PC3`, `PC4`, `PL1`, `PL2`, `PL3`, `PL4`
- Mot de passe : `password`

**Inspecteurs :**
- Noms : `IMATH`, `IPC`
- Mot de passe : `password`

**Surveillants Généraux :**
- Noms : `SG1`, `SG2`
- Mot de passe : `password`

## Étape 7: Maintenance

### 7.1 Redéploiement
- Chaque push sur GitHub redéploie automatiquement
- Ou cliquez sur "Redeploy" dans Railway

### 7.2 Surveillance
- Logs en temps réel dans Railway
- Métriques de performance
- Alertes automatiques en cas de problème

### 7.3 Sauvegardes
- Railway sauvegarde automatiquement PostgreSQL
- Sauvegardes manuelles disponibles dans l'onglet PostgreSQL

## Coûts Railway

- **Hobby Plan** : 5$ par mois
- **Pro Plan** : 20$ par mois
- Inclut : Base de données, déploiement, domaine personnalisé, SSL

## Dépannage

### Erreur de build
- Vérifiez les logs dans l'onglet "Deployments"
- Assurez-vous que `package.json` contient tous les scripts

### Problème de base de données
- Vérifiez que `DATABASE_URL` est correctement configurée
- Testez la connexion depuis l'onglet PostgreSQL

### Application inaccessible
- Vérifiez que le port est bien configuré avec `PORT=${{PORT}}`
- Vérifiez les logs d'erreur dans l'onglet "Logs"

## URL Final

Votre application sera accessible à :
`https://votre-projet-name.railway.app`

Changez immédiatement tous les mots de passe par défaut en production !