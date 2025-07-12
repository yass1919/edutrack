# Instructions pour utiliser l'onglet Niveaux en local

## 🚀 Étapes d'installation

### 1. Configurer votre base de données locale
```bash
# Exécuter le script de configuration
psql -U yassine -d edutrack -f setup_local_levels_tab.sql
```

### 2. Démarrer l'application
```bash
# Dans votre dossier projet
npm run dev
```

### 3. Accéder à l'application
- URL: `http://localhost:5000`
- Username: `admin`
- Password: `123456`

## 📋 Utilisation de l'onglet Niveaux

### Accès
1. Connectez-vous avec le compte admin
2. Allez dans **Dashboard Admin**
3. Cliquez sur l'onglet **"Niveaux"** (3ème onglet)

### Fonctionnalités disponibles

#### ✅ **Créer un niveau**
1. Cliquez sur **"Nouveau niveau"**
2. Remplissez :
   - **Nom** : Ex: "1ère Année Collège"
   - **Code** : Ex: "1AC"
   - **Catégorie** : Collège ou Lycée
3. Cliquez sur **"Créer"**

#### ✏️ **Modifier un niveau**
1. Cliquez sur l'icône crayon à droite du niveau
2. Modifiez les champs
3. Cliquez sur **"Modifier"**

#### 🗑️ **Supprimer un niveau**
1. Cliquez sur l'icône poubelle
2. Confirmez la suppression

## 🔄 Auto-chargement des niveaux

Les niveaux créés apparaîtront automatiquement dans :

### Modal de création de leçon
- Dropdown "Niveau" avec liste complète
- Option "Créer nouveau niveau" pour création rapide

### Formulaires d'assignation utilisateur
- Sélection de niveau pour les assignations
- Filtrage par catégorie si nécessaire

### Tous les dropdowns de niveau
- Mise à jour automatique après création/modification
- Sélection automatique du niveau nouvellement créé

## 🔧 Fonctionnalités techniques

### Validation
- Champs obligatoires validés
- Codes uniques garantis
- Messages d'erreur explicites

### Audit et logs
- Toutes les actions sont enregistrées
- Visible dans l'onglet "Journaux"

### Synchronisation
- Cache automatique avec React Query
- Mutations optimistes pour une UX fluide
- Invalidation automatique du cache

## 🎯 Test complet

### Test de création
1. Créer un niveau "4ème Année Collège" avec code "4AC"
2. Vérifier qu'il apparaît dans le tableau
3. Aller dans l'onglet "Leçons" → "Créer une leçon"
4. Vérifier que le niveau "4AC" apparaît dans le dropdown

### Test de modification
1. Modifier le niveau créé
2. Vérifier la mise à jour dans le tableau
3. Vérifier la mise à jour dans les dropdowns

### Test de suppression
1. Supprimer le niveau de test
2. Vérifier sa disparition du tableau
3. Vérifier sa disparition des dropdowns

## 🏗️ Structure actuelle

L'onglet Niveaux est **entièrement fonctionnel** avec :
- ✅ Interface utilisateur complète
- ✅ Routes API serveur (GET, POST, PUT, DELETE)
- ✅ Gestion des erreurs
- ✅ Validation côté client et serveur
- ✅ Auto-chargement dans les formulaires
- ✅ Audit et logs
- ✅ Mutations React Query

## 🎨 Interface

### Tableau des niveaux
- Colonnes : Nom, Code, Catégorie, Actions
- Badges colorés pour les catégories
- Boutons d'action responsive

### Modals
- Modal de création avec formulaire complet
- Modal d'édition pré-rempli
- Validation temps réel

Votre onglet Niveaux est prêt à l'emploi ! 🚀