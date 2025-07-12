# Option 2 : Synchronisation avec scripts SQL et modifications manuelles

## Étape 1 : Exécuter le script SQL

Exécutez le fichier `modal_creation_updates.sql` sur votre base de données locale :

```bash
psql -U yassine -d edutrack -f modal_creation_updates.sql
```

Ce script va :
- Vérifier l'état actuel de vos matières et niveaux
- Ajouter les nouvelles matières : Français (ID 15) et Arabe (ID 16)
- Ajouter le nouveau niveau : CE6 (ID 28)
- Mettre à jour les séquences pour éviter les conflits d'IDs
- Afficher un rapport de vérification

## Étape 2 : Modifications côté serveur

Dans votre fichier `server/routes.ts`, ajoutez ces routes :

### Route GET pour récupérer les niveaux
Ajoutez après la route `app.get("/api/admin/subjects"...)` :

```typescript
app.get("/api/admin/levels", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    console.log("Fetching levels for admin user:", req.user?.id, req.user?.role);
    const levels = await storage.getAllLevels();
    console.log("Levels retrieved:", levels);
    res.json(levels);
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des niveaux" });
  }
});
```

### Route POST pour créer des matières
Ajoutez après la route GET subjects :

```typescript
app.post("/api/admin/subjects", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const subjectData = req.body;
    
    if (!subjectData.name || !subjectData.code) {
      return res.status(400).json({ message: "Le nom et le code sont requis" });
    }

    const subject = await storage.createSubject({
      name: subjectData.name,
      code: subjectData.code,
      description: subjectData.description || ""
    });

    await storage.createAuditLog({
      userId: req.user.id,
      action: 'create_subject',
      entityType: 'subject',
      entityId: subject.id,
      details: JSON.stringify({ name: subject.name, code: subject.code }),
    });

    res.status(201).json(subject);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ message: "Ce code de matière existe déjà" });
    }
    res.status(400).json({ message: "Erreur lors de la création de la matière" });
  }
});
```

### Route POST pour créer des niveaux
Ajoutez après la route GET levels :

```typescript
app.post("/api/admin/levels", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const levelData = req.body;
    
    if (!levelData.name || !levelData.code || !levelData.category) {
      return res.status(400).json({ message: "Le nom, le code et la catégorie sont requis" });
    }

    const level = await storage.createLevel({
      name: levelData.name,
      code: levelData.code,
      category: levelData.category
    });

    await storage.createAuditLog({
      userId: req.user.id,
      action: 'create_level',
      entityType: 'level',
      entityId: level.id,
      details: JSON.stringify({ name: level.name, code: level.code, category: level.category }),
    });

    res.status(201).json(level);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ message: "Ce code de niveau existe déjà" });
    }
    res.status(400).json({ message: "Erreur lors de la création du niveau" });
  }
});
```

## Étape 3 : Modifications côté client

Dans votre fichier `client/src/pages/admin-dashboard.tsx` :

### 1. Ajoutez les nouveaux états
Au début du composant, avec les autres `useState` :

```typescript
const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
const [showCreateLevelModal, setShowCreateLevelModal] = useState(false);
const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
const [levelForm, setLevelForm] = useState({ name: '', code: '', category: '' });
```

### 2. Ajoutez les mutations
Avec les autres `useMutation` :

```typescript
const createSubjectMutation = useMutation({
  mutationFn: async (subjectData: any) => {
    const response = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subjectData)
    });
    if (!response.ok) throw new Error('Erreur lors de la création');
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/subjects'] });
    setShowCreateSubjectModal(false);
    setSubjectForm({ name: '', code: '', description: '' });
    toast({ title: "Matière créée avec succès" });
  }
});

const createLevelMutation = useMutation({
  mutationFn: async (levelData: any) => {
    const response = await fetch('/api/admin/levels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(levelData)
    });
    if (!response.ok) throw new Error('Erreur lors de la création');
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/levels'] });
    setShowCreateLevelModal(false);
    setLevelForm({ name: '', code: '', category: '' });
    toast({ title: "Niveau créé avec succès" });
  }
});
```

### 3. Ajoutez les handlers
Avec les autres fonctions :

```typescript
const handleCreateSubject = async (e: React.FormEvent) => {
  e.preventDefault();
  createSubjectMutation.mutate(subjectForm);
};

const handleCreateLevel = async (e: React.FormEvent) => {
  e.preventDefault();
  createLevelMutation.mutate(levelForm);
};
```

### 4. Modifiez les dropdowns
Remplacez le dropdown matière par :

```typescript
<select
  value={lessonForm.subjectId || ''}
  onChange={(e) => {
    if (e.target.value === 'create_new') {
      setShowCreateSubjectModal(true);
    } else {
      setLessonForm({ ...lessonForm, subjectId: e.target.value });
    }
  }}
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
  required
>
  <option value="">Sélectionner une matière</option>
  {subjects?.map(subject => (
    <option key={subject.id} value={subject.id}>{subject.name}</option>
  ))}
  <option value="create_new">➕ Créer nouvelle matière</option>
</select>
```

Remplacez le dropdown niveau par :

```typescript
<select
  value={lessonForm.levelId || ''}
  onChange={(e) => {
    if (e.target.value === 'create_new') {
      setShowCreateLevelModal(true);
    } else {
      setLessonForm({ ...lessonForm, levelId: e.target.value });
    }
  }}
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
  required
>
  <option value="">Sélectionner un niveau</option>
  {levels?.map(level => (
    <option key={level.id} value={level.id}>{level.name}</option>
  ))}
  <option value="create_new">➕ Créer nouveau niveau</option>
</select>
```

### 5. Ajoutez les modaux
À la fin du composant, avant la fermeture `</div>`, copiez les modaux complets du fichier `admin-dashboard-with-modals.tsx` (lignes avec `{/* Create Subject Modal */}` et `{/* Create Level Modal */}`).

## Étape 4 : Test

1. Redémarrez votre serveur local
2. Connectez-vous en tant qu'admin
3. Allez dans "Leçons" → "Créer une leçon"
4. Testez les options "➕ Créer nouvelle matière" et "➕ Créer nouveau niveau"

## Fichiers de référence

- `modal_creation_updates.sql` : Script SQL à exécuter
- `code_updates_routes.js` : Référence complète des modifications
- `admin-dashboard-with-modals.tsx` : Version complète du composant avec modaux

La fonctionnalité sera identique à celle qui fonctionne déjà sur cette version de développement.