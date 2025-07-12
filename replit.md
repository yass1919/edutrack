# EduTrack - Lesson Progress Tracking System

## Overview

EduTrack is a comprehensive educational management system designed to track lesson progressions for teachers, inspectors, and founders in French academic institutions. The application provides role-based dashboards for monitoring academic progress, validating lesson completions, and generating insights across different educational levels (collège and lycée).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: Simple session-based authentication (production-ready implementation needed)
- **API Design**: RESTful endpoints with role-based access control

### Database Architecture
- **Primary Database**: PostgreSQL (Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection Pooling**: Neon connection pooling for serverless optimization

### Academic Structure (18 niveaux)
- **Maternelle (3 niveaux)** : PS, MS, GS
- **Primaire (7 niveaux)** : CP, CE1, CE2, CE3, CE4, CE5, CE6
- **Collège (3 niveaux)** : 1AC, 2AC, 3AC
- **Lycée (5 niveaux)** : TC, BAC1_SP, BAC1_SM, BAC2_SP, BAC2_SM

## Key Components

### Authentication System
- Role-based access control (teacher, inspector, founder)
- Session-based authentication with simplified implementation
- Protected routes based on user roles
- User profile management with French localization

### Academic Structure Management
- **Users**: Teachers, inspectors, and founders with profile information
- **Educational Hierarchy**: Subjects, levels (6ème-Terminale), classes, and academic years
- **Teacher Assignments**: Many-to-many relationship between teachers, classes, and subjects
- **Curriculum Structure**: Chapters and lessons organized by subject and level

### Lesson Progress Tracking
- **Lesson Planning**: Scheduled lessons with expected duration and dates
- **Progress Recording**: Actual completion dates, duration, and notes
- **Validation Workflow**: Inspector validation of completed lessons
- **Progress Analytics**: Statistical insights and progress visualization

### Dashboard Interfaces
- **Teacher Dashboard**: Personal class management, lesson tracking, quick lesson entry, anomaly reporting
- **Inspector Dashboard**: Validation interface, progress monitoring across teachers, anomaly review
- **Founder Dashboard**: System-wide analytics, comprehensive reporting with charts, anomaly overview
- **Surveillant Général Dashboard**: Session validation, teacher evaluations, presence tracking, incident reporting
- **Admin Dashboard**: Complete system administration with user, curriculum, and data management

## Data Flow

### Teacher Workflow
1. Teacher logs in and views assigned classes and subjects
2. Selects specific class-subject combination to view lessons
3. Marks lessons as completed with actual dates and duration
4. Adds optional notes about lesson execution
5. Views progress statistics and completion rates

### Inspector Workflow
1. Inspector accesses pending validations across all teachers
2. Reviews completed lessons with details and notes
3. Validates or rejects lesson progressions
4. Monitors system-wide progress and identifies delays

### Founder Workflow
1. Founder views comprehensive analytics dashboard
2. Analyzes progress trends across subjects, levels, and teachers
2. Reviews validation statistics and system usage metrics
4. Accesses detailed reporting with interactive charts

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form
- **UI Components**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS, class-variance-authority for component variants
- **Date Handling**: date-fns with French locale support
- **Icons**: Lucide React icon library

### Backend Dependencies
- **Web Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM, @neondatabase/serverless, PostgreSQL types
- **Development**: tsx for TypeScript execution, esbuild for production builds
- **Validation**: Zod for schema validation, drizzle-zod for type-safe schemas

### Development Tools
- **Build System**: Vite with React plugin and Replit integration
- **TypeScript**: Strict mode configuration with path aliases
- **Code Quality**: ESM modules, modern JavaScript features
- **Replit Integration**: Runtime error overlay, cartographer plugin

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon serverless PostgreSQL with environment variable configuration
- **Asset Serving**: Vite handles static assets and client-side routing
- **API Proxying**: Express serves API routes while Vite handles frontend

### Production Build
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database Migrations**: Drizzle Kit handles schema changes and migrations
- **Environment Variables**: DATABASE_URL required for PostgreSQL connection

### Hosting Considerations
- **Serverless Ready**: Neon PostgreSQL and Express.js compatible with serverless platforms
- **Static Assets**: Frontend assets can be served from CDN
- **Database Scaling**: Neon provides automatic scaling for PostgreSQL workloads

## Documentation Complète pour IA

### Architecture Frontend (client/)

#### Fichiers Principaux
- **`client/src/App.tsx`** : Point d'entrée de l'application React avec routage principal et gestion d'authentification
- **`client/src/main.tsx`** : Configuration React avec React Query et injection dans le DOM
- **`client/src/index.css`** : Styles globaux Tailwind CSS avec variables CSS pour le thème

#### Pages (client/src/pages/)
- **`login.tsx`** : Interface de connexion avec validation Zod, gestion d'erreurs et lien vers l'inscription
- **`register.tsx`** : Page d'inscription publique limitée aux rôles teacher/inspector/sg avec validation complète
- **`admin-dashboard.tsx`** : Interface d'administration complète avec gestion des utilisateurs, leçons, logs d'audit
- **`teacher-dashboard.tsx`** : Tableau de bord professeur avec gestion des classes, progressions de leçons
- **`inspector-dashboard-new.tsx`** : Interface inspecteur pour validation des progressions par matière assignée
- **`founder-dashboard-new.tsx`** : Vue d'ensemble fondateur avec analytics et gestion des tarifs horaires
- **`sg-dashboard.tsx`** : Interface surveillant général pour validation de sessions et évaluations

#### Composants (client/src/components/)
- **`header.tsx`** : En-tête avec navigation, notifications et informations utilisateur
- **`lesson-tracking-table-readonly.tsx`** : Tableau de progression académique en lecture seule avec codes couleur
- **`lessons-table.tsx`** : Table interactive de gestion des leçons avec édition/suppression
- **`quick-lesson-modal.tsx`** : Modal de saisie rapide de séances avec sélection d'éléments de chapitre

#### Logique Frontend
- **State Management** : TanStack Query pour l'état serveur, hooks React pour l'état local
- **Authentification** : Tokens Bearer stockés localement, middleware de protection des routes
- **Validation** : Schemas Zod partagés entre frontend/backend pour cohérence
- **UI/UX** : Composants Shadcn/ui avec Radix UI primitives, design système cohérent

### Architecture Backend (server/)

#### Fichiers Serveur
- **`server/index.ts`** : Serveur Express principal avec middleware d'authentification et logging
- **`server/routes.ts`** : Routes API complètes avec validation Zod et contrôle d'accès par rôle
- **`server/storage.ts`** : Couche d'abstraction base de données avec interface IStorage
- **`server/db.ts`** : Configuration Drizzle ORM avec Neon PostgreSQL serverless
- **`server/vite.ts`** : Configuration serveur de développement avec proxy API

#### Logique Backend
- **Authentification** : Système de tokens en mémoire avec Map<token, userId>
- **Autorisation** : Middlewares requireAuth et requireAdmin/requireFounder/requireSG
- **Base de Données** : ORM Drizzle avec migrations automatiques via drizzle-kit
- **Validation** : Schemas Zod partagés pour validation stricte des entrées

### Base de Données (shared/schema.ts)

#### Tables Principales
- **`users`** : Utilisateurs avec rôles (admin, teacher, inspector, founder, sg) et tarifs horaires
- **`subjects`** : Matières (Mathématiques, Physique-Chimie) avec codes uniques
- **`levels`** : Niveaux scolaires (1AC-3AC college, TC-BAC2 lycée) avec catégories
- **`classes`** : Classes par niveau et année académique
- **`chapters`** : Chapitres de programme par matière et niveau
- **`lessons`** : Leçons planifiées avec durées et objectifs
- **`lessonProgressions`** : Progressions réelles avec validation inspecteur

#### Tables d'Assignation
- **`teacherAssignments`** : 1 professeur = 1 matière, multiple classes
- **`inspectorAssignments`** : 1 inspecteur = 1 matière (voit tous les profs de cette matière)
- **`sgAssignments`** : 1 SG = 1 cycle (college/lycée)

#### Tables Fonctionnelles
- **`auditLogs`** : Logs d'audit pour traçabilité des actions admin
- **`notifications`** : Système de notifications avec lecture/non-lecture
- **`anomalyReports`** : Rapports d'anomalies curriculaires par professeurs
- **`sgReports`** : Rapports de validation et évaluation par SG

### Règles Métier Implémentées

#### Contraintes d'Accès
1. **Professeur** : Voit uniquement ses classes assignées pour sa matière
2. **Inspecteur** : Voit tous les professeurs de sa matière assignée
3. **SG** : Voit uniquement les classes de son cycle (college/lycée)
4. **Fondateur** : Vision globale + gestion tarifs horaires
5. **Admin** : Gestion complète du système

#### Workflow de Progression
1. Professeur marque leçon comme terminée avec date/durée réelle
2. Inspecteur valide ou rejette la progression
3. SG peut créer des rapports de validation de session
4. Système de notifications automatiques pour chaque étape

### Configuration et Déploiement

#### Fichiers de Configuration
- **`package.json`** : Dépendances npm avec scripts dev/build
- **`vite.config.ts`** : Configuration Vite avec proxy API et aliases
- **`tailwind.config.ts`** : Configuration Tailwind avec thème personnalisé
- **`drizzle.config.ts`** : Configuration migrations base de données
- **`tsconfig.json`** : Configuration TypeScript stricte

#### Variables d'Environnement
- **`DATABASE_URL`** : URL PostgreSQL Neon serverless
- **`NODE_ENV`** : Environment (development/production)

### Sécurité et Authentification

#### Système d'Auth
- Tokens Bearer générés aléatoirement
- Store en mémoire Map<token, userId> (production: Redis recommandé)
- Middleware de vérification par route
- Contrôle d'accès granulaire par rôle

#### Validation des Données
- Schemas Zod partagés frontend/backend
- Validation stricte des entrées utilisateur
- Sanitisation automatique des données

### Fonctionnalités Avancées

#### Système de Notifications
- Composant NotificationBell avec compteur
- Notifications temps réel pour validations
- Marquage lu/non-lu avec persistance

#### Rapports et Analytics
- Dashboard fondateur avec graphiques Recharts
- Exports PDF avec jsPDF et jsPDF-AutoTable
- Analytics de progression par matière/niveau

#### Interface Responsive
- Design mobile-first avec Tailwind
- Composants adaptatifs Radix UI
- Navigation contextuelle par rôle

## Changelog

```
Changelog:
- June 29, 2025. Initial setup with complete PostgreSQL database
- June 29, 2025. Added sample data for testing (users, classes, lessons, progressions)
- June 30, 2025. Added admin role and comprehensive administration dashboard
- June 30, 2025. Implemented admin APIs for user management and audit logging
- June 30, 2025. Fixed authentication middleware for role-based access control
- July 01, 2025. Enhanced QuickLessonModal with chapter elements selection
- July 01, 2025. Added official Physics-Chemistry curriculum for grades 6-8 (1AC-3AC)
- July 01, 2025. Created detailed chapter elements based on Moroccan education programs
- July 01, 2025. Complete database restructuring: College/Lycee levels, Math/Physics only, 2-semester system
- July 01, 2025. Implemented authentic curriculum content from official Moroccan education programs
- July 02, 2025. Implemented comprehensive notification system with real-time updates
- July 02, 2025. Added functional NotificationBell component with badge counts and popover interface
- July 02, 2025. Created anomaly reporting system for curriculum issues (content, hours, schedule)
- July 02, 2025. Added Surveillant Général (SG) role with session validation and teacher evaluation capabilities
- July 02, 2025. Implemented SG dashboard with validation tabs, anomaly management, and report creation
- July 02, 2025. Complete API integration for anomaly reports and SG reports with role-based access control
- July 02, 2025. Major restructuring: implemented strict role-based data access according to business rules
- July 02, 2025. Added inspector-subject assignments (1 inspector = 1 subject, sees only teachers of that subject)
- July 02, 2025. Added SG-cycle assignments (1 SG = 1 cycle, sees only classes of that cycle: college/lycee)
- July 02, 2025. Fixed teacher assignments to enforce 1 teacher = 1 subject, multiple classes constraint
- July 02, 2025. Added logout button to inspector dashboard, completed new inspector interface
- July 05, 2025. Added public user registration system with role limitations (teacher/inspector/sg only)
- July 05, 2025. Created complete registration workflow with form validation and API integration
- July 05, 2025. Enhanced authentication debugging with comprehensive server-side logging
- July 07, 2025. Fixed teacher assignments API and corrected Drizzle schema references in storage.ts
- July 07, 2025. Restored proper teacher assignment logic to show only specifically assigned classes (not all classes)
- July 07, 2025. Teacher dashboard QuickLessonModal now properly respects assignment constraints
- July 09, 2025. Fixed level deletion functionality: proper dependency checking, cache invalidation, and page refresh
- July 09, 2025. Enhanced admin dashboard with comprehensive level management and deletion constraints
- July 09, 2025. Created SQL cleanup scripts for local database synchronization and testing
- July 11, 2025. Implemented intelligent academic year system with automatic detection and creation
- July 11, 2025. Added automatic "Nouvelle année académique" option for admin users
- July 11, 2025. Created automatic class duplication system for new academic years
- July 11, 2025. Added date-based academic year detection (September-June school year)
- July 11, 2025. Problème critique résolu : Les inspecteurs peuvent maintenant voir leurs professeurs assignés
- July 11, 2025. Synchronisation complète base de données : toutes les colonnes manquantes ajoutées
- July 11, 2025. Migration terminée vers academic_year_id pour toutes les tables
- July 11, 2025. Correction du modal de signalement d'anomalies : classes chargées selon rôle, inspecteurs ne peuvent plus s'envoyer de signalements
- July 11, 2025. Ajout hook useAuth et configuration QueryClientProvider pour corriger les erreurs d'authentification
- July 11, 2025. Restauration des mots de passe utilisateurs : mot de passe "password" pour tous les comptes test
- July 12, 2025. Implémentation complète onglet Progression SG : tableau 5 colonnes (Professeur, Matière, Classes, Avancement, Contrôles)
- July 12, 2025. Correction méthode getTeachersBySgCycle pour filtrer strictement par cycle SG (college/lycée uniquement)
- July 12, 2025. Ajout système de notifications automatiques : rapports SG notifient fondateur pour validation
- July 12, 2025. Correction erreurs SQL dans getAllSgReports et getSgReportsBySg avec approche Promise.all simplifiée
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```