# Guide d'utilisation - Onglet Niveaux

## 🚀 Installation et Configuration Locale

### 1. Prérequis
- PostgreSQL installé et configuré
- Base de données `edutrack` créée
- Serveur local démarré avec `npm run dev`

### 2. Configuration initiale
```bash
# Exécuter le script de configuration
psql -U yassine -d edutrack -f setup_local_levels_tab.sql
```

### 3. Connexion
- URL: `http://localhost:5000`
- Username: `admin`
- Password: `123456`

## 📋 Fonctionnalités de l'Onglet Niveaux

### Accès
1. Connectez-vous en tant qu'admin
2. Allez dans le **Dashboard Admin**
3. Cliquez sur l'onglet **"Niveaux"**

### Gestion CRUD Complète

#### ✅ **Créer un niveau**
1. Cliquez sur **"Nouveau niveau"**
2. Remplissez le formulaire :
   - **Nom** : Ex: "1ère Année Collège"
   - **Code** : Ex: "1AC" (automatiquement en majuscules)
   - **Catégorie** : Collège ou Lycée
3. Cliquez sur **"Créer"**

#### ✏️ **Modifier un niveau**
1. Cliquez sur l'icône **crayon** dans la colonne Actions
2. Modifiez les champs souhaités
3. Cliquez sur **"Modifier"**

#### 🗑️ **Supprimer un niveau**
1. Cliquez sur l'icône **poubelle** dans la colonne Actions
2. Confirmez la suppression dans la popup

### Tableau des niveaux
- **Nom** : Nom complet du niveau
- **Code** : Code unique du niveau
- **Catégorie** : Badge coloré (Collège/Lycée)
- **Actions** : Boutons Modifier/Supprimer

## 🔄 Auto-chargement dans les Formulaires

Les niveaux créés apparaîtront automatiquement dans :

### Modal de création de leçon
- Dropdown "Niveau" avec tous les niveaux disponibles
- Option "Créer nouveau niveau" pour création rapide

### Formulaires d'assignation utilisateur
- Dropdown de sélection de niveau pour les assignations
- Filtrage par catégorie (collège/lycée)

### Tous les formulaires avec sélection de niveau
- Auto-refresh après création/modification
- Sélection automatique du niveau nouvellement créé

## 🔧 Validation et Sécurité

### Validation côté client
- Champs obligatoires marqués avec *
- Validation en temps réel
- Messages d'erreur explicites

### Validation côté serveur
- Vérification des données requises
- Contraintes d'unicité sur le code
- Gestion des erreurs de base de données

### Audit et logs
- Toutes les actions sont loggées
- Traçabilité complète des modifications
- Visible dans l'onglet "Journaux"

## 🏗️ Structure technique

### Routes API
- `GET /api/admin/levels` - Lister tous les niveaux
- `POST /api/admin/levels` - Créer un niveau
- `PUT /api/admin/levels/:id` - Modifier un niveau
- `DELETE /api/admin/levels/:id` - Supprimer un niveau

### Modèle de données
```typescript
interface Level {
  id: number;
  name: string;
  code: string;
  category: 'college' | 'lycee';
  createdAt: Date;
  updatedAt: Date;
}
```

### Gestion d'état
- React Query pour le cache et la synchronisation
- Mutations optimistes pour une UX fluide
- Invalidation automatique du cache

## 🎯 Cas d'usage typiques

### Administrateur système
1. Créer la structure des niveaux de l'établissement
2. Maintenir la cohérence des codes de niveau
3. Gérer les catégories collège/lycée

### Intégration avec les autres modules
- **Leçons** : Associer les leçons à des niveaux
- **Classes** : Créer des classes par niveau
- **Professeurs** : Assigner des professeurs à des niveaux
- **Inspecteurs** : Superviser par cycle/niveau

## 🔍 Dépannage

### Erreurs communes
- **"Code déjà existant"** : Changer le code du niveau
- **"Champs obligatoires manquants"** : Vérifier tous les champs
- **"Niveau non trouvé"** : Rafraîchir la page

### Vérification en base
```sql
-- Vérifier les niveaux
SELECT * FROM levels ORDER BY category, name;

-- Vérifier les logs d'audit
SELECT * FROM audit_logs WHERE entity_type = 'level' ORDER BY created_at DESC;
```

## 📊 Statistiques et métriques

L'onglet Niveaux permet de :
- Voir le nombre total de niveaux par catégorie
- Identifier les niveaux les plus utilisés
- Maintenir la structure académique

## 🎨 Interface utilisateur

### Design responsive
- Adaptation mobile et desktop
- Tableau scrollable sur petits écrans
- Modals centrées et accessibles

### Retours utilisateur
- Toasts de confirmation
- États de chargement
- Messages d'erreur clairs

Votre onglet Niveaux est maintenant prêt à l'emploi ! 🚀