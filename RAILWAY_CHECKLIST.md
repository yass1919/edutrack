# ✅ Checklist Railway - EduTrack

## Étape 1: GitHub (5 min)
- [ ] Créer un compte GitHub (si pas déjà fait)
- [ ] Créer un nouveau repository public
- [ ] Uploader TOUS les fichiers de ce projet Replit
- [ ] Vérifier que ces fichiers sont présents :
  - [ ] `package.json`
  - [ ] `railway.json`
  - [ ] `server/` (dossier)
  - [ ] `client/` (dossier)
  - [ ] `shared/` (dossier)
  - [ ] `seed.sql`

## Étape 2: Railway (10 min)
- [ ] Aller sur https://railway.app
- [ ] Se connecter avec GitHub
- [ ] Cliquer "New Project"
- [ ] Sélectionner "Deploy from GitHub repo"
- [ ] Choisir votre repository EduTrack
- [ ] Cliquer "Deploy Now"

## Étape 3: PostgreSQL (3 min)
- [ ] Dans Railway, cliquer "New Service"
- [ ] Sélectionner "Database" → "PostgreSQL"
- [ ] Attendre que la base soit créée

## Étape 4: Configuration (5 min)
- [ ] Cliquer sur le service web (Node.js)
- [ ] Aller dans "Variables"
- [ ] Ajouter ces 3 variables :
  ```
  NODE_ENV=production
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  PORT=${{PORT}}
  ```

## Étape 5: Attendre le Déploiement (10 min)
- [ ] Aller dans "Deployments"
- [ ] Attendre le statut "Success"
- [ ] Si échec, vérifier les logs

## Étape 6: Tester (2 min)
- [ ] Copier l'URL publique (dans Settings)
- [ ] Ouvrir dans le navigateur
- [ ] Tester la connexion admin/password

## Étape 7: Importer les Données (10 min)
- [ ] Télécharger pgAdmin ou DBeaver
- [ ] Se connecter à la base PostgreSQL Railway
- [ ] Importer le fichier `seed.sql`
- [ ] Vérifier que les données sont présentes

## Étape 8: Sécurité (5 min)
- [ ] Changer TOUS les mots de passe par défaut
- [ ] Créer vos vrais comptes administrateurs
- [ ] Tester tous les rôles

## ✅ Terminé !
Votre application est maintenant en ligne et accessible via l'URL Railway.

## 🔗 URLs Utiles
- Railway Dashboard: https://railway.app/dashboard
- Documentation: https://docs.railway.app
- Support: https://railway.app/help

## 💰 Coût
- 5$ par mois pour le plan Starter
- Inclut PostgreSQL + déploiement + SSL