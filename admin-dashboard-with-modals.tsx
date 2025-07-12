// Version complète du fichier admin-dashboard.tsx avec les modaux de création
// Remplacez votre fichier client/src/pages/admin-dashboard.tsx par ce contenu

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/use-toast';

// Types et interfaces (gardez vos types existants)
interface User {
  id: number;
  username: string;
  role: 'admin' | 'teacher' | 'inspector' | 'founder' | 'sg';
  fullName: string;
  email: string;
  hourlyRate?: number;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface Level {
  id: number;
  name: string;
  code: string;
  category: string;
}

// États pour les modaux de création (AJOUTEZ ces états à votre composant existant)
const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
const [showCreateLevelModal, setShowCreateLevelModal] = useState(false);
const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
const [levelForm, setLevelForm] = useState({ name: '', code: '', category: '' });

// Mutations pour créer matière et niveau (AJOUTEZ ces mutations à votre composant existant)
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

// Handlers pour les formulaires de création (AJOUTEZ ces handlers à votre composant existant)
const handleCreateSubject = async (e: React.FormEvent) => {
  e.preventDefault();
  createSubjectMutation.mutate(subjectForm);
};

const handleCreateLevel = async (e: React.FormEvent) => {
  e.preventDefault();
  createLevelMutation.mutate(levelForm);
};

// MODIFIEZ vos dropdowns existants pour ajouter l'option "Créer nouvelle"
// Dans le dropdown matière :
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

// Dans le dropdown niveau :
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

// AJOUTEZ ces modaux à la fin de votre composant, avant la fermeture :

{/* Create Subject Modal */}
{showCreateSubjectModal && createPortal(
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
    style={{ zIndex: 99999 }}
  >
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Créer une nouvelle matière</h2>
        <button 
          onClick={() => setShowCreateSubjectModal(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleCreateSubject} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de la matière *</label>
          <input
            type="text"
            value={subjectForm.name}
            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ex: Mathématiques"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Code de la matière *</label>
          <input
            type="text"
            value={subjectForm.code}
            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ex: MATH"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={subjectForm.description}
            onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Description de la matière..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button 
            type="button"
            onClick={() => setShowCreateSubjectModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          <button 
            type="submit"
            disabled={createSubjectMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {createSubjectMutation.isPending ? "Création..." : "Créer"}
          </button>
        </div>
      </form>
    </div>
  </div>,
  document.body
)}

{/* Create Level Modal */}
{showCreateLevelModal && createPortal(
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
    style={{ zIndex: 99999 }}
  >
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Créer un nouveau niveau</h2>
        <button 
          onClick={() => setShowCreateLevelModal(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleCreateLevel} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom du niveau *</label>
          <input
            type="text"
            value={levelForm.name}
            onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ex: 1ère Année Collège"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Code du niveau *</label>
          <input
            type="text"
            value={levelForm.code}
            onChange={(e) => setLevelForm({ ...levelForm, code: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ex: 1AC"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Catégorie *</label>
          <select
            value={levelForm.category}
            onChange={(e) => setLevelForm({ ...levelForm, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Sélectionner une catégorie</option>
            <option value="collège">Collège</option>
            <option value="lycée">Lycée</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button 
            type="button"
            onClick={() => setShowCreateLevelModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          <button 
            type="submit"
            disabled={createLevelMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {createLevelMutation.isPending ? "Création..." : "Créer"}
          </button>
        </div>
      </form>
    </div>
  </div>,
  document.body
)}