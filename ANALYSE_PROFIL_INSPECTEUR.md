# Analyse du Profil Inspecteur et Conditionnement des Données

## Vue d'ensemble du Système d'Inspection

Le profil inspecteur suit une règle métier stricte : **1 inspecteur = 1 matière = vision sur tous les professeurs de cette matière**.

## Architecture du Conditionnement

### 1. Table d'Assignation Inspector
```sql
-- Table: inspector_assignments
CREATE TABLE inspector_assignments (
  id SERIAL PRIMARY KEY,
  inspector_id INTEGER REFERENCES users(id),
  subject_id INTEGER REFERENCES subjects(id),
  academic_year VARCHAR(9)
);
```

**Principe** : Un inspecteur ne peut être assigné qu'à **UNE SEULE matière** par année académique.

### 2. Logique de Récupération des Données

#### Étape 1 : Récupération des Matières Assignées
```typescript
// Dans server/storage.ts - getTeachersByInspectorSubject()
const inspectorSubjects = await db
  .select()
  .from(schema.inspectorAssignments)
  .where(eq(schema.inspectorAssignments.inspectorId, inspectorId));

const subjectIds = inspectorSubjects.map(ia => ia.subjectId);
```

#### Étape 2 : Filtrage des Professeurs par Matière
```typescript
// Récupération uniquement des professeurs enseignant la matière de l'inspecteur
const teacherData = await db
  .select()
  .from(schema.teacherAssignments)
  .innerJoin(schema.users, eq(schema.teacherAssignments.teacherId, schema.users.id))
  .innerJoin(schema.classes, eq(schema.teacherAssignments.classId, schema.classes.id))
  .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
  .innerJoin(schema.subjects, eq(schema.teacherAssignments.subjectId, schema.subjects.id))
  .where(inArray(schema.teacherAssignments.subjectId, subjectIds));
```

#### Étape 3 : Groupement par Professeur
```typescript
// Création d'une Map pour regrouper les assignations par professeur
const teacherMap = new Map<number, User & { assignments: TeacherAssignment[] }>();

teacherData.forEach(row => {
  const teacherId = row.users.id;
  if (!teacherMap.has(teacherId)) {
    teacherMap.set(teacherId, {
      ...row.users,
      assignments: []
    });
  }
  teacherMap.get(teacherId)!.assignments.push({
    ...row.teacher_assignments,
    class: { ...row.classes, level: row.levels },
    subject: row.subjects
  });
});
```

## Interface Frontend - Conditionnement des Vues

### 1. Vue Principale - Liste des Professeurs
```typescript
// Requête filtrée automatiquement par l'API
const { data: teachers } = useQuery<TeacherWithAssignments[]>({
  queryKey: ["/api/inspector/teachers"], // Automatiquement filtrée côté serveur
});
```

**Résultat** : L'inspecteur ne voit que les professeurs de SA matière assignée.

### 2. Vue Détaillée - Progressions par Professeur
```typescript
// Progressions filtrées par professeur sélectionné
const { data: teacherProgressions } = useQuery<ProgressionWithDetails[]>({
  queryKey: ["/api/inspector/teacher", selectedTeacher?.id, "progressions"],
  enabled: !!selectedTeacher,
});
```

### 3. Vue par Classe - Progressions Spécifiques
```typescript
// Double filtrage : par professeur ET par classe
const { data: classProgressions } = useQuery<ProgressionWithDetails[]>({
  queryKey: ["/api/inspector/teacher", selectedTeacher?.id, "class", selectedClass, "progressions"],
  enabled: !!selectedTeacher && !!selectedClass,
});
```

## Flux de Données - Exemple Concret

### Scenario : Inspecteur de Mathématiques

1. **Inspecteur connecté** : `inspectorId = 2`
2. **Matière assignée** : `subjectId = 9` (Mathématiques)
3. **Professeurs visibles** : Tous les professeurs enseignant les Mathématiques
4. **Classes visibles** : Toutes les classes où ces professeurs enseignent les Mathématiques
5. **Progressions visibles** : Toutes les progressions de leçons de Mathématiques

### Données Conditionnées

```typescript
// Exemple de données retournées pour l'inspecteur de Mathématiques
{
  "teachers": [
    {
      "id": 3,
      "firstName": "Ahmed",
      "lastName": "Benali",
      "assignments": [
        {
          "classId": 1,
          "subjectId": 9, // Mathématiques uniquement
          "class": { "name": "1AC-A", "level": { "name": "1AC" } },
          "subject": { "name": "Mathématiques", "code": "MATH" }
        }
      ]
    }
  ]
}
```

## Validation et Workflow

### 1. Validation des Progressions
```typescript
// L'inspecteur peut valider les progressions des professeurs de sa matière
const validateMutation = useMutation({
  mutationFn: async (progressionId: number) => {
    return apiRequest("POST", `/api/inspector/progressions/${progressionId}/validate`);
  }
});
```

### 2. Statuts des Progressions
- **`completed`** : Leçon terminée par le professeur, en attente de validation
- **`validated`** : Leçon validée par l'inspecteur
- **`delayed`** : Leçon en retard par rapport à la date prévue

## Sécurité et Contrôle d'Accès

### 1. Middleware de Sécurité
```typescript
// Toutes les routes inspecteur passent par requireAuth
app.get("/api/inspector/teachers", requireAuth, async (req: any, res) => {
  const inspectorId = req.userId; // Récupération automatique de l'ID
  const teachers = await storage.getTeachersByInspectorSubject(inspectorId);
  res.json(teachers);
});
```

### 2. Isolation des Données
- **Pas de vision inter-matières** : Un inspecteur de Mathématiques ne voit jamais les progressions de Physique-Chimie
- **Pas de vision globale** : Contrairement au fondateur, l'inspecteur n'a qu'une vue partielle
- **Filtrage automatique** : Toutes les requêtes sont automatiquement filtrées par `inspectorId`

## Avantages du Conditionnement

1. **Sécurité** : Isolation stricte des données par matière
2. **Performance** : Requêtes optimisées avec filtrage en base
3. **Simplicité** : Interface épurée focalisée sur la matière assignée
4. **Contrôle** : Validation granulaire par matière
5. **Évolutivité** : Facilité d'ajout de nouvelles matières sans impact

## Règles Métier Respectées

✅ **1 inspecteur = 1 matière** : Assignation unique par année académique
✅ **Vision complète sur la matière** : Tous les professeurs de cette matière
✅ **Validation ciblée** : Progressions uniquement de sa matière
✅ **Isolation des données** : Aucune fuite entre matières
✅ **Traçabilité** : Logs d'audit pour toutes les validations

## Exemple d'Usage Complet

```typescript
// 1. Connexion de l'inspecteur
// 2. Récupération automatique des professeurs de sa matière
// 3. Sélection d'un professeur → vue des progressions
// 4. Sélection d'une classe → vue détaillée par classe
// 5. Validation des progressions terminées
// 6. Génération automatique de notifications
```

Ce système garantit un contrôle strict et une vision claire pour chaque inspecteur, tout en respectant la séparation des responsabilités par matière.