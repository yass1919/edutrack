// ====================================================================
// MODIFICATIONS ROUTES API : AJOUT CRÉATION MATIÈRES ET NIVEAUX
// ====================================================================
// À ajouter dans votre fichier server/routes.ts

// 1. AJOUT ROUTE GET /api/admin/levels (après la route subjects)
// Cherchez la ligne avec "app.get("/api/admin/subjects"..." et ajoutez après :

app.get("/api/admin/levels", requireAuth, requireAdmin, async (req, res) => {
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

// 2. AJOUT ROUTE POST /api/admin/subjects (après la route GET subjects)
// Ajoutez cette route après la route GET /api/admin/subjects :

app.post("/api/admin/subjects", requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log("Creating new subject:", req.body);
    const subjectData = req.body;
    
    if (!subjectData.name || !subjectData.code) {
      return res.status(400).json({ message: "Le nom et le code sont requis" });
    }

    const subject = await storage.createSubject({
      name: subjectData.name,
      code: subjectData.code,
      description: subjectData.description || ""
    });

    // Log the action
    await storage.createAuditLog({
      userId: req.user.id,
      action: 'create_subject',
      entityType: 'subject',
      entityId: subject.id,
      details: JSON.stringify({ name: subject.name, code: subject.code }),
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(400).json({ message: "Ce code de matière existe déjà" });
    }
    
    res.status(400).json({ message: "Erreur lors de la création de la matière" });
  }
});

// 3. AJOUT ROUTE POST /api/admin/levels (après la route GET levels)
// Ajoutez cette route après la route GET /api/admin/levels :

app.post("/api/admin/levels", requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log("Creating new level:", req.body);
    const levelData = req.body;
    
    if (!levelData.name || !levelData.code || !levelData.category) {
      return res.status(400).json({ message: "Le nom, le code et la catégorie sont requis" });
    }

    const level = await storage.createLevel({
      name: levelData.name,
      code: levelData.code,
      category: levelData.category
    });

    // Log the action
    await storage.createAuditLog({
      userId: req.user.id,
      action: 'create_level',
      entityType: 'level',
      entityId: level.id,
      details: JSON.stringify({ name: level.name, code: level.code, category: level.category }),
    });

    res.status(201).json(level);
  } catch (error) {
    console.error("Error creating level:", error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(400).json({ message: "Ce code de niveau existe déjà" });
    }
    
    res.status(400).json({ message: "Erreur lors de la création du niveau" });
  }
});

// ====================================================================
// MODIFICATIONS FRONTEND : AJOUT MODALS CRÉATION
// ====================================================================
// À ajouter dans votre fichier client/src/pages/admin-dashboard.tsx

// 1. AJOUT DES ÉTATS (au début du composant, avec les autres useState)
const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
const [showCreateLevelModal, setShowCreateLevelModal] = useState(false);
const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
const [levelForm, setLevelForm] = useState({ name: '', code: '', category: '' });

// 2. AJOUT DES MUTATIONS (avec les autres useMutation)
const createSubjectMutation = useMutation({
  mutationFn: async (subjectData) => {
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
  mutationFn: async (levelData) => {
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

// 3. AJOUT DES HANDLERS (avec les autres fonctions)
const handleCreateSubject = async (e) => {
  e.preventDefault();
  createSubjectMutation.mutate(subjectForm);
};

const handleCreateLevel = async (e) => {
  e.preventDefault();
  createLevelMutation.mutate(levelForm);
};

// 4. MODIFICATION DES DROPDOWNS
// Remplacez le dropdown matière par :
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

// Remplacez le dropdown niveau par :
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

// 5. AJOUT DES MODALS (à la fin du composant, avant la fermeture)
// Voir le fichier admin-dashboard-with-modals.tsx pour les modals complets