# Documentation Détaillée de Chaque Fichier - EduTrack

## 📁 Structure du Projet

```
edutrack/
├── client/               # Frontend React TypeScript
├── server/              # Backend Express TypeScript  
├── shared/              # Code partagé frontend/backend
├── attached_assets/     # Fichiers joints utilisateur
└── fichiers config/     # Configuration build et déploiement
```

---

## 🎯 Frontend (client/)

### 📄 `client/src/App.tsx`
**Rôle** : Point d'entrée principal de l'application React
**Logique** :
- Gestion du routage principal avec wouter
- Authentification utilisateur avec hook `useAuth`
- Rendu conditionnel basé sur l'état d'authentification
- Routage pour pages publiques (login/register) vs dashboards protégés
- Providers globaux : QueryClientProvider, TooltipProvider, Toaster

**Composants clés** :
```typescript
// Routage authentifié par rôle
{user.role === 'teacher' && <TeacherDashboard />}
{user.role === 'admin' && <AdminDashboard />}
// Route publique d'inscription
<Route path="/register"><Register /></Route>
```

---

### 📄 `client/src/main.tsx`
**Rôle** : Bootstrap de l'application React
**Logique** :
- Configuration strictMode React 18
- Injection de l'App dans le DOM
- Import des styles globaux CSS

---

### 📄 `client/src/index.css`
**Rôle** : Styles globaux et variables CSS
**Logique** :
- Configuration Tailwind CSS avec directives @base, @components, @utilities
- Variables CSS pour thème clair/sombre : `--background`, `--foreground`, etc.
- Classes utilitaires personnalisées
- Styles pour composants shadcn/ui

---

## 📄 Pages (client/src/pages/)

### 📄 `login.tsx`
**Rôle** : Interface de connexion utilisateur
**Logique** :
- Formulaire avec validation Zod (`loginSchema`)
- Gestion d'état avec `react-hook-form`
- Authentification via API `/api/auth/login`
- Affichage/masquage mot de passe
- Lien vers page d'inscription
- Affichage comptes de test pour développement

**Fonctionnalités** :
```typescript
// Validation et soumission
const handleSubmit = async (data: LoginData) => {
  const user = await login(data);
  onLogin(user); // Callback vers App.tsx
}
```

---

### 📄 `register.tsx`
**Rôle** : Page d'inscription publique
**Logique** :
- Formulaire complet : nom, prénom, email, rôle, mot de passe
- Limitation aux rôles : teacher, inspector, sg (pas admin/founder)
- Validation Zod avec `registerSchema`
- API POST `/api/auth/register`
- Navigation de retour vers login après succès

**Restriction de sécurité** :
```typescript
role: z.enum(['teacher', 'inspector', 'sg']) // Rôles publics uniquement
```

---

### 📄 `admin-dashboard.tsx`
**Rôle** : Interface d'administration complète
**Logique** :
- **Onglets multiples** : Utilisateurs, Matières, Classes, Leçons, Logs
- **CRUD utilisateurs** : Création avec assignations automatiques
- **Gestion leçons** : Création/édition avec chapitres
- **Audit trail** : Visualisation logs d'actions
- **Validation stricte** : Schemas Zod pour chaque formulaire

**Fonctionnalités clés** :
```typescript
// Assignation automatique lors création utilisateur
if (userData.role === 'teacher' && userData.subjectId) {
  // Création assignation professeur-matière-classes
}
if (userData.role === 'inspector' && userData.subjectId) {
  // Assignation inspecteur-matière
}
```

---

### 📄 `teacher-dashboard.tsx`
**Rôle** : Tableau de bord professeur
**Logique** :
- **Données filtrées** : Uniquement classes assignées du professeur
- **Progression leçons** : Marquage terminé avec date/durée réelle
- **Modal rapide** : Saisie accélérée de séances
- **Statistiques** : Pourcentages de completion
- **Notifications** : Alertes validation inspecteur

**Restriction d'accès** :
```typescript
// API filtre automatiquement par professeur connecté
const { data: assignments } = useQuery({
  queryKey: ["/api/teacher/assignments"]
});
```

---

### 📄 `inspector-dashboard-new.tsx`
**Rôle** : Interface inspecteur pour validation
**Logique** :
- **Données par matière** : Uniquement matière assignée à l'inspecteur
- **Validation progressions** : Accepter/rejeter avec commentaires
- **Vue globale professeurs** : Tous les profs de sa matière
- **Suivi avancement** : Statistiques par classe/professeur

---

### 📄 `founder-dashboard-new.tsx`
**Rôle** : Vue d'ensemble fondateur
**Logique** :
- **Analytics globales** : Graphiques avec Recharts
- **Gestion tarifs** : Modification tarifs horaires professeurs
- **Exports** : Rapports PDF avec jsPDF
- **Vision transversale** : Toutes matières et niveaux

---

### 📄 `sg-dashboard.tsx`
**Rôle** : Interface Surveillant Général
**Logique** :
- **Données par cycle** : College OU lycée selon assignation SG
- **Validation sessions** : Contrôle qualité des cours
- **Évaluations professeurs** : Notes et commentaires
- **Rapports incidents** : Signalements disciplinaires

---

### 📄 `not-found.tsx`
**Rôle** : Page erreur 404
**Logique** : Page simple avec lien retour accueil

---

## 🧩 Composants (client/src/components/)

### 📄 `header.tsx`
**Rôle** : En-tête global de l'application
**Logique** :
- **Informations utilisateur** : Nom, rôle avec badge coloré
- **Notifications** : Cloche avec compteur non-lus
- **Navigation** : Bouton déconnexion
- **Responsive** : Adaptation mobile

---

### 📄 `lesson-tracking-table-readonly.tsx`
**Rôle** : Tableau de progression académique
**Logique** :
- **Affichage en lecture seule** : Pas d'édition
- **Codes couleur** : Vert clair (introduites), vert foncé (terminées)
- **Structure par chapitre** : Groupement logique des leçons
- **Calcul progression** : Pourcentages automatiques

---

### 📄 `lessons-table.tsx`
**Rôle** : Table interactive de gestion leçons
**Logique** :
- **CRUD complet** : Création, édition, suppression
- **Filtres** : Par matière, niveau, chapitre
- **Tri** : Colonnes cliquables
- **Actions bulk** : Opérations multiples

---

### 📄 `quick-lesson-modal.tsx`
**Rôle** : Saisie rapide de séances
**Logique** :
- **Formulaire simplifié** : Champs essentiels uniquement
- **Sélection éléments** : Checkboxes éléments de chapitre
- **Validation temps réel** : Contrôles Zod
- **Soumission optimisée** : API call unique

---

## 🔧 Utilitaires Frontend (client/src/)

### 📄 `lib/queryClient.ts`
**Rôle** : Configuration TanStack Query
**Logique** :
- **Client global** : Instance partagée
- **Fonction apiRequest** : Wrapper fetch avec gestion erreurs
- **Cache configuration** : Stratégies de mise en cache

---

### 📄 `lib/auth.ts`
**Rôle** : Logique d'authentification
**Logique** :
- **Fonctions login/logout** : Appels API auth
- **Gestion tokens** : Stockage localStorage
- **Types AuthUser** : Interfaces utilisateur

---

### 📄 `lib/utils.ts`
**Rôle** : Utilitaires génériques
**Logique** :
- **Fonction cn** : Merge classes CSS avec clsx et tailwind-merge
- **Helpers** : Fonctions communes réutilisables

---

### 📄 `hooks/use-auth.ts`
**Rôle** : Hook d'authentification React
**Logique** :
- **État utilisateur** : Gestion state global user
- **Vérification session** : API `/api/auth/me` au mount
- **Loading states** : Gestion états chargement

---

---

## ⚙️ Backend (server/)

### 📄 `server/index.ts`
**Rôle** : Serveur Express principal
**Logique** :
- **Configuration Express** : Middleware JSON, CORS
- **Store authentification** : Map<token, userId> en mémoire
- **Middleware requireAuth** : Vérification tokens Bearer
- **Logging requêtes** : Monitoring performance et erreurs
- **Gestion erreurs** : Catch global avec logging

**Architecture auth** :
```typescript
export const authStore = new Map<string, number>();
// Token → UserID mapping en mémoire
```

---

### 📄 `server/routes.ts`
**Rôle** : Définition de toutes les routes API
**Logique** :
- **50+ endpoints** : Couverture complète fonctionnalités
- **Validation Zod** : Tous les inputs validés
- **Middlewares protection** : requireAuth, requireAdmin, etc.
- **Gestion erreurs** : Try/catch avec messages explicites
- **Audit logging** : Traçabilité actions sensibles

**Structure par domaine** :
```typescript
// Auth routes
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

// Admin routes (requireAdmin)
GET /api/admin/users
POST /api/admin/users
// ... etc

// Teacher routes (requireAuth + teacher)
GET /api/teacher/assignments
// ... etc
```

---

### 📄 `server/storage.ts`
**Rôle** : Couche d'abstraction base de données
**Logique** :
- **Interface IStorage** : Contrat pour toutes opérations DB
- **Implémentation DatabaseStorage** : Utilise Drizzle ORM
- **Méthodes CRUD** : Pour chaque entité (User, Lesson, etc.)
- **Requêtes complexes** : Jointures et filtres métier
- **Gestion transactions** : Pour opérations atomiques

**Pattern Repository** :
```typescript
interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  // ... toutes les opérations
}
```

---

### 📄 `server/db.ts`
**Rôle** : Configuration Drizzle ORM
**Logique** :
- **Connexion Neon** : PostgreSQL serverless
- **Pool de connexions** : Optimisation performance
- **Schema import** : Types partagés
- **WebSocket config** : Pour Neon serverless

---

### 📄 `server/vite.ts`
**Rôle** : Serveur de développement
**Logique** :
- **Proxy API** : Redirection `/api/*` vers Express
- **Serve statique** : Assets en production
- **HMR** : Hot Module Replacement en dev

---

## 📊 Base de Données (shared/)

### 📄 `shared/schema.ts`
**Rôle** : Schéma unifié base de données et validation
**Logique** :
- **Tables Drizzle** : Définition structure DB PostgreSQL
- **Relations** : Foreign keys et jointures
- **Schemas Zod** : Validation frontend/backend
- **Types TypeScript** : Inférence automatique

**Architecture en couches** :
```typescript
// 1. Définition table Drizzle
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // ...
});

// 2. Schema validation Zod
export const insertUserSchema = createInsertSchema(users);

// 3. Types TypeScript
export type User = typeof users.$inferSelect;
```

---

## 📋 Configuration

### 📄 `package.json`
**Rôle** : Configuration projet npm
**Logique** :
- **Dépendances** : React, Express, Drizzle, Tailwind, etc.
- **Scripts** : dev, build, db:push
- **Type module** : ES modules

---

### 📄 `vite.config.ts`
**Rôle** : Configuration build Vite
**Logique** :
- **Aliases** : @/ vers client/src/, @shared/ etc.
- **Plugins** : React, Replit integration
- **Build config** : Optimisations production

---

### 📄 `tailwind.config.ts`
**Rôle** : Configuration Tailwind CSS
**Logique** :
- **Thème personnalisé** : Couleurs, espacements
- **Plugins** : Typography, animations
- **Dark mode** : Support classe dark

---

### 📄 `drizzle.config.ts`
**Rôle** : Configuration migrations DB
**Logique** :
- **Connexion DB** : URL depuis env
- **Dossier migrations** : ./drizzle
- **Schema source** : shared/schema.ts

---

### 📄 `tsconfig.json`
**Rôle** : Configuration TypeScript
**Logique** :
- **Mode strict** : Vérifications maximales
- **Paths mapping** : Alias imports
- **Target ES2022** : Fonctionnalités modernes

---

## 📎 Fichiers Spéciaux

### 📄 `replit.md`
**Rôle** : Documentation projet et préférences
**Logique** : Guide pour IA futures, changelog, architecture

### 📄 `seed.sql`
**Rôle** : Données initiales base de données
**Logique** : Script d'insertion utilisateurs test, matières, niveaux

### 📄 `.gitignore`
**Rôle** : Fichiers exclus du versioning
**Logique** : node_modules, .env, dist/, logs

---

## 🎯 Résumé Architectural

**Frontend** : React 18 + TypeScript + TanStack Query + Tailwind + Shadcn/ui
**Backend** : Express + TypeScript + Drizzle ORM + PostgreSQL
**Auth** : Tokens Bearer + Middlewares de protection par rôle
**Validation** : Schemas Zod partagés frontend/backend
**Build** : Vite + esbuild pour optimisations
**DB** : PostgreSQL Neon serverless avec migrations Drizzle

Chaque fichier a un rôle précis dans cette architecture modulaire et type-safe.