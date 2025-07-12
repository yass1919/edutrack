import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AuthUser } from "@/lib/auth";
import { Users, BookOpen, Settings, Activity, Plus, Edit, Trash2, GraduationCap, RefreshCw, Calendar, Wand2 } from "lucide-react";
import { LessonsTable } from "@/components/lessons-table";
import { useAcademicYear } from "@/lib/academic-year-context";
import { AcademicYearWizard } from "@/components/academic-year-wizard";
import ClassesTable from "@/components/classes-table";

interface AdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("users");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "",
    firstName: "",
    lastName: "",
    email: "",
    // Assignment fields based on role
    subjectId: "", // for teacher and inspector
    cycle: "", // for SG (surveillant général)
    selectedClasses: [] as number[] // for teacher - multiple classes
  });
  
  const { selectedYear, setSelectedYear, availableYears } = useAcademicYear();
  const queryClient = useQueryClient();

  // Gestion spéciale pour les nouvelles années académiques
  const handleYearChange = async (year: string) => {
    if (year.startsWith('+')) {
      // Demander confirmation avant de créer une nouvelle année
      const confirmCreate = confirm(
        `Créer une nouvelle année académique ?\n\nCela va dupliquer toutes les classes existantes pour la nouvelle année. Cette action est irréversible.`
      );
      
      if (confirmCreate) {
        try {
          const response = await apiRequest('/api/admin/set-academic-year', {
            method: 'POST',
            body: { academicYear: year }
          });
          
          if (response.isNewYear) {
            toast({
              title: "Nouvelle année créée",
              description: `L'année académique ${response.academicYear} a été créée avec succès.`,
            });
            
            // Mettre à jour l'année sélectionnée et recharger les données
            setSelectedYear(response.academicYear);
            queryClient.invalidateQueries();
          }
        } catch (error: any) {
          toast({
            title: "Erreur",
            description: error.message || "Erreur lors de la création de l'année académique",
            variant: "destructive",
          });
        }
      }
    } else {
      // Année existante, changement normal
      setSelectedYear(year);
      queryClient.invalidateQueries();
    }
  };

  // Lesson management states
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    objectives: "",
    plannedDate: "",
    plannedDurationMinutes: "",
    chapterId: "",
    subjectId: "",
    levelId: "",
    chapterName: ""
  });

  // Subject creation states
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [showCreateLevelModal, setShowCreateLevelModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    description: ""
  });
  const [levelForm, setLevelForm] = useState({
    name: "",
    code: "",
    category: ""
  });

  // Level management states
  const [showEditLevelModal, setShowEditLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [showAcademicYearWizard, setShowAcademicYearWizard] = useState(false);
  const { toast } = useToast();

  // Queries
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: activeTab === "users"
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["/api/admin/lessons"],
    enabled: activeTab === "lessons"
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["/api/admin/chapters"],
    enabled: showCreateLessonModal || showEditLessonModal
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["/api/admin/logs"],
    enabled: activeTab === "logs"
  });

  // Query for subjects to display in assignment dropdowns
  const { data: subjects = [], isLoading: subjectsLoading, error: subjectsError } = useQuery({
    queryKey: ["/api/admin/subjects"]
  });

  // Query for levels to display in level dropdowns
  const { data: levels = [] } = useQuery({
    queryKey: ["/api/admin/levels"]
  });

  // Query for classes to display in teacher assignments
  const { data: classes = [] } = useQuery({
    queryKey: ["/api/admin/classes"],
    enabled: showCreateUserModal || showEditUserModal
  });

  // Debug: log subjects and chapters data
  console.log("Subjects data:", subjects, "Loading:", subjectsLoading, "Error:", subjectsError);
  console.log("Chapters data:", chapters, "Create modal open:", showCreateLessonModal, "Edit modal open:", showEditLessonModal);

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowCreateUserModal(false);
      setUserForm({ username: "", password: "", role: "", firstName: "", lastName: "", email: "", subjectId: "", cycle: "", selectedClasses: [] });
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number; userData: any }) => {
      return apiRequest("PUT", `/api/admin/users/${userId}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowEditUserModal(false);
      setEditingUser(null);
      setUserForm({ username: "", password: "", role: "", firstName: "", lastName: "", email: "", subjectId: "", cycle: "", selectedClasses: [] });
      toast({
        title: "Utilisateur modifié",
        description: "L'utilisateur a été modifié avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification de l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'utilisateur.",
        variant: "destructive"
      });
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.password || !userForm.role || !userForm.firstName || !userForm.lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }
    if (userForm.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive"
      });
      return;
    }
    if (userForm.username.length < 3) {
      toast({
        title: "Erreur",
        description: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
        variant: "destructive"
      });
      return;
    }

    // Validation spécifique pour les professeurs
    if (userForm.role === "teacher" && userForm.selectedClasses.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une classe pour le professeur.",
        variant: "destructive"
      });
      return;
    }

    createUserMutation.mutate(userForm);
  };

  const handleEditUser = (userData: any) => {
    setEditingUser(userData);
    setUserForm({
      username: userData.username,
      password: "", // Don't pre-fill password for security
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email || "",
      subjectId: "", // TODO: Get from existing assignments
      cycle: "", // TODO: Get from existing assignments
      selectedClasses: [] // TODO: Get from existing assignments
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!userForm.username || !userForm.role || !userForm.firstName || !userForm.lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    if (userForm.username.length < 3) {
      toast({
        title: "Erreur",
        description: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
        variant: "destructive"
      });
      return;
    }

    if (userForm.password && userForm.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive"
      });
      return;
    }

    // Only include password if it's being changed
    const updateData: any = { ...userForm };
    if (!updateData.password) {
      delete updateData.password;
    }

    updateUserMutation.mutate({ userId: editingUser.id, userData: updateData });
  };

  // Function to handle class selection for teachers
  const handleClassToggle = (classId: number) => {
    const currentClasses = userForm.selectedClasses;
    if (currentClasses.includes(classId)) {
      // Remove class
      setUserForm({
        ...userForm,
        selectedClasses: currentClasses.filter(id => id !== classId)
      });
    } else {
      // Add class
      setUserForm({
        ...userForm,
        selectedClasses: [...currentClasses, classId]
      });
    }
  };

  const handleDeleteUser = (userData: any) => {
    if (userData.id === user.id) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas supprimer votre propre compte.",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userData.username}" ? Cette action est irréversible.`)) {
      deleteUserMutation.mutate(userData.id);
    }
  };

  // Lesson mutations
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      console.log("createLessonMutation called with:", lessonData);
      return apiRequest("POST", "/api/admin/lessons", lessonData);
    },
    onSuccess: (data) => {
      console.log("Lesson created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      setShowCreateLessonModal(false);
      setLessonForm({ title: "", objectives: "", plannedDate: "", plannedDurationMinutes: "", chapterId: "", subjectId: "", levelId: "", chapterName: "" });
      toast({
        title: "Leçon créée",
        description: "La leçon a été créée avec succès."
      });
    },
    onError: (error: any) => {
      console.error("Error creating lesson:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la création de la leçon.",
        variant: "destructive"
      });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ lessonId, lessonData }: { lessonId: number; lessonData: any }) => {
      return apiRequest("PUT", `/api/admin/lessons/${lessonId}`, lessonData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      setShowEditLessonModal(false);
      setEditingLesson(null);
      setLessonForm({ title: "", objectives: "", plannedDate: "", plannedDurationMinutes: "", chapterId: "", subjectId: "", levelId: "", chapterName: "" });
      toast({
        title: "Leçon modifiée",
        description: "La leçon a été modifiée avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification de la leçon.",
        variant: "destructive"
      });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest("DELETE", `/api/admin/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      toast({
        title: "Leçon supprimée",
        description: "La leçon a été supprimée avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de la leçon.",
        variant: "destructive"
      });
    }
  });

  // Subject mutations
  const createSubjectMutation = useMutation({
    mutationFn: async (subjectData: any) => {
      return apiRequest("POST", "/api/admin/subjects", subjectData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      setShowCreateSubjectModal(false);
      setSubjectForm({ name: "", code: "", description: "" });
      // Sélectionner automatiquement la nouvelle matière
      setLessonForm({ ...lessonForm, subjectId: data.id.toString() });
      toast({
        title: "Matière créée",
        description: "La matière a été créée avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la création de la matière.",
        variant: "destructive"
      });
    }
  });

  // Level mutations
  const createLevelMutation = useMutation({
    mutationFn: async (levelData: any) => {
      return apiRequest("POST", "/api/admin/levels", levelData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/levels"] });
      setShowCreateLevelModal(false);
      setLevelForm({ name: "", code: "", category: "" });
      // Sélectionner automatiquement le nouveau niveau
      setLessonForm({ ...lessonForm, levelId: data.id.toString() });
      toast({
        title: "Niveau créé",
        description: "Le niveau a été créé avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la création du niveau.",
        variant: "destructive"
      });
    }
  });

  const updateLevelMutation = useMutation({
    mutationFn: async ({ levelId, levelData }: { levelId: number; levelData: any }) => {
      return apiRequest("PUT", `/api/admin/levels/${levelId}`, levelData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/levels"] });
      setShowEditLevelModal(false);
      setEditingLevel(null);
      setLevelForm({ name: "", code: "", category: "" });
      toast({
        title: "Niveau modifié",
        description: "Le niveau a été modifié avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la modification du niveau.",
        variant: "destructive"
      });
    }
  });

  const deleteLevelMutation = useMutation({
    mutationFn: async (levelId: number) => {
      console.log("Attempting to delete level with ID:", levelId);
      const response = await apiRequest("DELETE", `/api/admin/levels/${levelId}`);
      console.log("Delete response:", response);
      return response;
    },
    onSuccess: async (data, levelId) => {
      console.log("Delete successful for level ID:", levelId, "Response:", data);
      
      // 1. Remove from cache immediately for instant UI update
      queryClient.setQueryData(["/api/admin/levels"], (oldData: any) => {
        if (oldData) {
          const filtered = oldData.filter((level: any) => level.id !== levelId);
          console.log("Filtered levels:", filtered);
          return filtered;
        }
        return oldData;
      });
      
      // 2. Clear all caches related to levels
      queryClient.removeQueries({ queryKey: ["/api/admin/levels"] });
      
      // 3. Force invalidation and refetch with fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/levels"] });
      
      // 4. Force refetch with no-cache headers
      try {
        await queryClient.refetchQueries({ 
          queryKey: ["/api/admin/levels"],
          type: 'active' 
        });
      } catch (error) {
        console.error("Error refetching levels:", error);
      }
      
      // 5. Force page reload for local environments as fallback (only if cache update fails)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(() => {
          // Check if the level is still in the DOM
          const levelRows = document.querySelectorAll('[data-level-id]');
          const stillExists = Array.from(levelRows).some(row => 
            row.getAttribute('data-level-id') === levelId.toString()
          );
          
          if (stillExists) {
            window.location.reload();
          }
        }, 1000);
      }
      
      toast({
        title: "Niveau supprimé",
        description: "Le niveau a été supprimé avec succès."
      });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la suppression du niveau.",
        variant: "destructive"
      });
    }
  });

  // Lesson handlers
  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("handleCreateLesson called with form data:", lessonForm);

    if (!lessonForm.title || !lessonForm.subjectId || !lessonForm.levelId || !lessonForm.chapterName || !lessonForm.plannedDurationMinutes) {
      console.log("Validation failed - missing required fields:", {
        title: !!lessonForm.title,
        subjectId: !!lessonForm.subjectId,
        levelId: !!lessonForm.levelId,
        chapterName: !!lessonForm.chapterName,
        plannedDurationMinutes: !!lessonForm.plannedDurationMinutes
      });
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    const durationMinutes = parseInt(lessonForm.plannedDurationMinutes);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      console.log("Duration validation failed:", { durationMinutes, isNaN: isNaN(durationMinutes) });
      toast({
        title: "Erreur",
        description: "La durée doit être un nombre valide en minutes.",
        variant: "destructive"
      });
      return;
    }

    const payload = {
      title: lessonForm.title,
      objectives: lessonForm.objectives,
      plannedDate: lessonForm.plannedDate || null,
      plannedDurationMinutes: durationMinutes,
      subjectId: parseInt(lessonForm.subjectId),
      levelId: parseInt(lessonForm.levelId),
      chapterName: lessonForm.chapterName
    };
    console.log("Sending lesson creation payload:", payload);

    createLessonMutation.mutate(payload);
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.code) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }
    createSubjectMutation.mutate(subjectForm);
  };

  const handleCreateLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelForm.name || !levelForm.code || !levelForm.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }
    createLevelMutation.mutate(levelForm);
  };

  const handleEditLevel = (levelData: any) => {
    setEditingLevel(levelData);
    setLevelForm({
      name: levelData.name,
      code: levelData.code,
      category: levelData.category
    });
    setShowEditLevelModal(true);
  };

  const handleUpdateLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLevel) return;

    if (!levelForm.name || !levelForm.code || !levelForm.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    updateLevelMutation.mutate({ levelId: editingLevel.id, levelData: levelForm });
  };

  const handleDeleteLevel = (levelData: any) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le niveau "${levelData.name}" ?\n\nATTENTION: Cette action est irréversible et ne sera possible que si le niveau n'est pas utilisé par des chapitres ou des classes.`;
    
    if (confirm(confirmMessage)) {
      deleteLevelMutation.mutate(levelData.id);
    }
  };

  const handleEditLesson = (lessonData: any) => {
    setEditingLesson(lessonData);
    setLessonForm({
      title: lessonData.title,
      objectives: lessonData.objectives || "",
      plannedDate: lessonData.plannedDate ? lessonData.plannedDate.split('T')[0] : "",
      plannedDurationMinutes: lessonData.plannedDurationMinutes.toString(),
      chapterId: lessonData.chapterId.toString(),
      subjectId: lessonData.chapter?.subjectId?.toString() || "",
      levelId: lessonData.chapter?.levelId?.toString() || "",
      chapterName: lessonData.chapter?.name || ""
    });
    setShowEditLessonModal(true);
  };

  const handleUpdateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    if (!lessonForm.title || !lessonForm.chapterId || !lessonForm.plannedDurationMinutes) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    const durationMinutes = parseInt(lessonForm.plannedDurationMinutes);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      toast({
        title: "Erreur",
        description: "La durée doit être un nombre valide en minutes.",
        variant: "destructive"
      });
      return;
    }

    updateLessonMutation.mutate({ 
      lessonId: editingLesson.id, 
      lessonData: {
        ...lessonForm,
        plannedDurationMinutes: durationMinutes,
        chapterId: parseInt(lessonForm.chapterId)
      }
    });
  };

  const handleDeleteLesson = (lessonData: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la leçon "${lessonData.title}" ? Cette action est irréversible.`)) {
      deleteLessonMutation.mutate(lessonData.id);
    }
  };

  const handleAcademicYearCreated = (newYear: string) => {
    // Actualiser la liste des années disponibles
    queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
    // Définir la nouvelle année comme active
    setSelectedYear(newYear);
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "destructive",
      founder: "default",
      inspector: "secondary",
      teacher: "outline",
      sg: "default"
    } as const;
    
    const labels = {
      admin: "Administrateur",
      founder: "Fondateur",
      inspector: "Inspecteur",
      teacher: "Professeur",
      sg: "Surveillant Général"
    };
    
    return <Badge variant={variants[role as keyof typeof variants]}>{labels[role as keyof typeof labels]}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={onLogout} />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tableau de bord Administrateur</h1>
              <p className="text-muted-foreground">Gestion complète du système EduTrack</p>
            </div>
            
            {/* Sélecteur d'année académique pour l'admin */}
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowAcademicYearWizard(true)}
                className="flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Assistant année scolaire
              </Button>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Année académique" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year.startsWith('+') ? (
                          <span className="text-blue-600 font-medium">{year}</span>
                        ) : (
                          year
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">Année active</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Leçons
            </TabsTrigger>
            <TabsTrigger value="levels" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Niveaux
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Journaux
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestion des Utilisateurs</CardTitle>
                <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvel utilisateur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Créer un utilisateur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">Prénom *</Label>
                          <Input
                            id="firstName"
                            value={userForm.firstName}
                            onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Nom *</Label>
                          <Input
                            id="lastName"
                            value={userForm.lastName}
                            onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="username">Nom d'utilisateur * (min. 3 caractères)</Label>
                        <Input
                          id="username"
                          value={userForm.username}
                          onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                          required
                          minLength={3}
                          placeholder="Minimum 3 caractères"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Mot de passe * (min. 6 caractères)</Label>
                        <Input
                          id="password"
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          required
                          minLength={6}
                          placeholder="Minimum 6 caractères"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Rôle *</Label>
                        <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teacher">Professeur</SelectItem>
                            <SelectItem value="inspector">Inspecteur</SelectItem>
                            <SelectItem value="sg">Surveillant Général</SelectItem>
                            <SelectItem value="founder">Fondateur</SelectItem>
                            <SelectItem value="admin">Administrateur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        />
                      </div>
                      
                      {/* Champs d'assignation conditionnels selon le rôle */}
                      {(userForm.role === "teacher" || userForm.role === "inspector") && (
                        <div>
                          <Label htmlFor="subjectId">Matière assignée *</Label>
                          <Select value={userForm.subjectId} onValueChange={(value) => setUserForm({ ...userForm, subjectId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une matière" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects && Array.isArray(subjects) && subjects.map((subject: any) => (
                                <SelectItem key={subject.id} value={subject.id.toString()}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {userForm.role === "sg" && (
                        <div>
                          <Label htmlFor="cycle">Cycle assigné *</Label>
                          <Select value={userForm.cycle} onValueChange={(value) => setUserForm({ ...userForm, cycle: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un cycle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="maternelle">Maternelle</SelectItem>
                              <SelectItem value="primaire">Primaire</SelectItem>
                              <SelectItem value="college">Collège</SelectItem>
                              <SelectItem value="lycee">Lycée</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {userForm.role === "teacher" && (
                        <div>
                          <Label>Classes assignées * (Sélectionnez une ou plusieurs classes)</Label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                            {classes && Array.isArray(classes) && classes.map((classItem: any) => (
                              <div key={classItem.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`class-${classItem.id}`}
                                  checked={userForm.selectedClasses.includes(classItem.id)}
                                  onChange={() => handleClassToggle(classItem.id)}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor={`class-${classItem.id}`} className="text-sm">
                                  {classItem.name} ({classItem.level.name})
                                </label>
                              </div>
                            ))}
                          </div>
                          {userForm.selectedClasses.length === 0 && (
                            <p className="text-sm text-red-500 mt-1">Veuillez sélectionner au moins une classe</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 pt-4 border-t bg-white sticky bottom-0">
                        <Button type="button" variant="outline" onClick={() => setShowCreateUserModal(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={createUserMutation.isPending}>
                          {createUserMutation.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit User Modal */}
                <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Modifier l'utilisateur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editFirstName">Prénom *</Label>
                          <Input
                            id="editFirstName"
                            value={userForm.firstName}
                            onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="editLastName">Nom *</Label>
                          <Input
                            id="editLastName"
                            value={userForm.lastName}
                            onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="editUsername">Nom d'utilisateur * (min. 3 caractères)</Label>
                        <Input
                          id="editUsername"
                          value={userForm.username}
                          onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                          required
                          minLength={3}
                          placeholder="Minimum 3 caractères"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editPassword">Nouveau mot de passe (optionnel, min. 6 caractères)</Label>
                        <Input
                          id="editPassword"
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          minLength={6}
                          placeholder="Laissez vide pour conserver le mot de passe actuel"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editRole">Rôle *</Label>
                        <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teacher">Professeur</SelectItem>
                            <SelectItem value="inspector">Inspecteur</SelectItem>
                            <SelectItem value="sg">Surveillant Général</SelectItem>
                            <SelectItem value="founder">Fondateur</SelectItem>
                            <SelectItem value="admin">Administrateur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="editEmail">Email</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        />
                      </div>
                      
                      {/* Champs d'assignation conditionnels selon le rôle */}
                      {(userForm.role === "teacher" || userForm.role === "inspector") && (
                        <div>
                          <Label htmlFor="editSubjectId">Matière assignée *</Label>
                          <Select value={userForm.subjectId} onValueChange={(value) => setUserForm({ ...userForm, subjectId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une matière" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects && Array.isArray(subjects) && subjects.map((subject: any) => (
                                <SelectItem key={subject.id} value={subject.id.toString()}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {userForm.role === "sg" && (
                        <div>
                          <Label htmlFor="editCycle">Cycle assigné *</Label>
                          <Select value={userForm.cycle} onValueChange={(value) => setUserForm({ ...userForm, cycle: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un cycle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="maternelle">Maternelle</SelectItem>
                              <SelectItem value="primaire">Primaire</SelectItem>
                              <SelectItem value="college">Collège</SelectItem>
                              <SelectItem value="lycee">Lycée</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 pt-4 border-t bg-white sticky bottom-0">
                        <Button type="button" variant="outline" onClick={() => setShowEditUserModal(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={updateUserMutation.isPending}>
                          {updateUserMutation.isPending ? "Modification..." : "Modifier"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>



                {/* Edit Lesson Modal */}
                <Dialog open={showEditLessonModal} onOpenChange={setShowEditLessonModal}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Modifier la leçon</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateLesson} className="space-y-4">
                      <div>
                        <Label htmlFor="editLessonTitle">Titre de la leçon *</Label>
                        <Input
                          id="editLessonTitle"
                          value={lessonForm.title}
                          onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                          required
                          placeholder="Ex: Introduction aux équations du second degré"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editLessonObjectives">Objectifs de la leçon</Label>
                        <Input
                          id="editLessonObjectives"
                          value={lessonForm.objectives}
                          onChange={(e) => setLessonForm({ ...lessonForm, objectives: e.target.value })}
                          placeholder="Ex: Comprendre la forme générale d'une équation du second degré"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editLessonChapter">Chapitre *</Label>
                          <Select value={lessonForm.chapterId} onValueChange={(value) => setLessonForm({ ...lessonForm, chapterId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un chapitre" />
                            </SelectTrigger>
                            <SelectContent>
                              {chapters.map((chapter: any) => (
                                <SelectItem key={chapter.id} value={chapter.id.toString()}>
                                  {chapter.name} - {chapter.subject.name} ({chapter.level.name})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="editLessonDuration">Durée prévue (minutes) *</Label>
                          <Input
                            id="editLessonDuration"
                            type="number"
                            min="1"
                            value={lessonForm.plannedDurationMinutes}
                            onChange={(e) => setLessonForm({ ...lessonForm, plannedDurationMinutes: e.target.value })}
                            required
                            placeholder="55"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="editLessonDate">Date prévue (optionnel)</Label>
                        <Input
                          id="editLessonDate"
                          type="date"
                          value={lessonForm.plannedDate}
                          onChange={(e) => setLessonForm({ ...lessonForm, plannedDate: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowEditLessonModal(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={updateLessonMutation.isPending}>
                          {updateLessonMutation.isPending ? "Modification..." : "Modifier"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                        <TableHead className="w-auto min-w-32 text-xs font-semibold border-r border-gray-200 dark:border-gray-700 py-2 whitespace-nowrap">Nom</TableHead>
                        <TableHead className="text-xs font-semibold border-r border-gray-200 dark:border-gray-700 py-2">Nom d'utilisateur</TableHead>
                        <TableHead className="text-xs font-semibold border-r border-gray-200 dark:border-gray-700 py-2">Rôle</TableHead>
                        <TableHead className="text-xs font-semibold border-r border-gray-200 dark:border-gray-700 py-2">Matière</TableHead>
                        <TableHead className="text-xs font-semibold border-r border-gray-200 dark:border-gray-700 py-2">Cycle</TableHead>
                        <TableHead className="text-xs font-semibold border-r border-gray-200 dark:border-gray-700 py-2">Classes</TableHead>
                        <TableHead className="text-xs font-semibold border-r border-gray-200 dark:border-gray-700 py-2">Email</TableHead>
                        <TableHead className="text-xs font-semibold border-r border-gray-200 dark:border-gray-700 py-2 whitespace-nowrap">Créé le</TableHead>
                        <TableHead className="text-xs font-semibold py-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userRow: any, index: number) => (
                        <TableRow 
                          key={userRow.id} 
                          className={`h-12 border-b border-gray-200 dark:border-gray-700 ${
                            index % 2 === 0 
                              ? 'bg-white dark:bg-gray-900' 
                              : 'bg-gray-50 dark:bg-gray-800'
                          } hover:bg-blue-50 dark:hover:bg-blue-900/20`}
                        >
                          <TableCell className="text-xs py-2 border-r border-gray-200 dark:border-gray-700 font-medium whitespace-nowrap">
                            {userRow.firstName} {userRow.lastName}
                          </TableCell>
                          <TableCell className="text-xs py-2 border-r border-gray-200 dark:border-gray-700">
                            {userRow.username}
                          </TableCell>
                          <TableCell className="text-xs py-2 border-r border-gray-200 dark:border-gray-700">
                            {getRoleBadge(userRow.role)}
                          </TableCell>
                          <TableCell className="text-xs py-2 border-r border-gray-200 dark:border-gray-700">
                            {(userRow.role === 'teacher' || userRow.role === 'inspector') && userRow.assignedSubject ? (
                              <Badge variant="outline" className="text-xs">{userRow.assignedSubject}</Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-xs py-2 border-r border-gray-200 dark:border-gray-700">
                            {userRow.assignedCycle ? (
                              <Badge variant="outline" className="text-xs">
                                {userRow.role === 'sg' 
                                  ? (userRow.assignedCycle === 'maternelle' ? 'Maternelle' :
                                     userRow.assignedCycle === 'primaire' ? 'Primaire' :
                                     userRow.assignedCycle === 'college' ? 'Collège' : 'Lycée')
                                  : userRow.assignedCycle
                                }
                              </Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-xs py-2 border-r border-gray-200 dark:border-gray-700">
                            {userRow.role === 'teacher' && userRow.teacherClasses ? (
                              <div className="flex flex-wrap gap-1">
                                {userRow.teacherClasses.map((tc: any, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tc.className}
                                  </Badge>
                                ))}
                              </div>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-xs py-2 border-r border-gray-200 dark:border-gray-700">
                            {userRow.email || "—"}
                          </TableCell>
                          <TableCell className="text-xs py-2 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {formatDate(userRow.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={() => handleEditUser(userRow)}
                                title="Modifier l'utilisateur"
                              >
                                <Edit className="h-2 w-2" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="h-7 w-7 p-0"
                                onClick={() => handleDeleteUser(userRow)}
                                disabled={userRow.id === user.id}
                                title="Supprimer l'utilisateur"
                              >
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Gestion des Leçons
                  <Button
                    onClick={() => {
                      console.log("Créer une leçon clicked");
                      console.log("Current modal state:", showCreateLessonModal);
                      setShowCreateLessonModal(true);
                      console.log("Modal state after set:", true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Créer une leçon
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LessonsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="levels">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestion des Niveaux</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      queryClient.removeQueries({ queryKey: ["/api/admin/levels"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/admin/levels"] });
                      queryClient.refetchQueries({ queryKey: ["/api/admin/levels"] });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                  <Button onClick={() => setShowCreateLevelModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau niveau
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {levels.map((level: any) => (
                        <TableRow key={level.id}>
                          <TableCell className="font-medium">{level.name}</TableCell>
                          <TableCell>{level.code}</TableCell>
                          <TableCell>
                            <Badge variant={
                              level.category === 'maternelle' ? 'outline' :
                              level.category === 'primaire' ? 'secondary' :
                              level.category === 'college' ? 'default' : 'destructive'
                            }>
                              {level.category === 'maternelle' ? 'Maternelle' :
                               level.category === 'primaire' ? 'Primaire' :
                               level.category === 'college' ? 'Collège' : 'Lycée'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditLevel(level)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteLevel(level)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <ClassesTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Système</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Paramètres système en cours de développement...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Journal d'Audit</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                        <TableCell>
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Système"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.entityType || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.details || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Lesson Modal avec Portal - EN DEHORS DES ONGLETS */}
      {showCreateLessonModal && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Créer une nouvelle leçon</h2>
              <button 
                onClick={() => setShowCreateLessonModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Matière *</label>
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
                    {subjects.map((subject: any) => (
                      <option key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </option>
                    ))}
                    <option value="create_new" className="text-blue-600 font-medium">
                      + Créer nouvelle matière
                    </option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Niveau *</label>
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
                    {levels.map((level: any) => (
                      <option key={level.id} value={level.id.toString()}>
                        {level.name} ({level.category})
                      </option>
                    ))}
                    <option value="create_new" className="text-blue-600 font-medium">
                      + Créer nouveau niveau
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titre de la leçon *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ex: Introduction aux équations du second degré"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Chapitre *</label>
                <input
                  type="text"
                  value={lessonForm.chapterName || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, chapterName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ex: Algèbre et équations"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Durée prévue (minutes) *</label>
                <input
                  type="number"
                  min="1"
                  value={lessonForm.plannedDurationMinutes}
                  onChange={(e) => setLessonForm({ ...lessonForm, plannedDurationMinutes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="55"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateLessonModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={createLessonMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createLessonMutation.isPending ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Lesson Modal avec Portal - EN DEHORS DES ONGLETS */}
      {showEditLessonModal && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Modifier la leçon</h2>
              <button 
                onClick={() => setShowEditLessonModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre de la leçon *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Objectifs de la leçon</label>
                <input
                  type="text"
                  value={lessonForm.objectives}
                  onChange={(e) => setLessonForm({ ...lessonForm, objectives: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Chapitre *</label>
                  <select
                    value={lessonForm.chapterId}
                    onChange={(e) => setLessonForm({ ...lessonForm, chapterId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Sélectionner un chapitre</option>
                    {chapters.map((chapter: any) => (
                      <option key={chapter.id} value={chapter.id.toString()}>
                        {chapter.name} - {chapter.subject.name} ({chapter.level.name})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Durée prévue (minutes) *</label>
                  <input
                    type="number"
                    min="1"
                    value={lessonForm.plannedDurationMinutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, plannedDurationMinutes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Date prévue (optionnel)</label>
                <input
                  type="date"
                  value={lessonForm.plannedDate}
                  onChange={(e) => setLessonForm({ ...lessonForm, plannedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowEditLessonModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={updateLessonMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateLessonMutation.isPending ? "Modification..." : "Modifier"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

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
                  <option value="maternelle">Maternelle</option>
                  <option value="primaire">Primaire</option>
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

      {/* Edit Level Modal */}
      {showEditLevelModal && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Modifier le niveau</h2>
              <button 
                onClick={() => {
                  setShowEditLevelModal(false);
                  setEditingLevel(null);
                  setLevelForm({ name: "", code: "", category: "" });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateLevel} className="space-y-4">
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
                  <option value="maternelle">Maternelle</option>
                  <option value="primaire">Primaire</option>
                  <option value="collège">Collège</option>
                  <option value="lycée">Lycée</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditLevelModal(false);
                    setEditingLevel(null);
                    setLevelForm({ name: "", code: "", category: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={updateLevelMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateLevelMutation.isPending ? "Modification..." : "Modifier"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      
      {/* Assistant de création d'année scolaire */}
      <AcademicYearWizard 
        open={showAcademicYearWizard}
        onOpenChange={setShowAcademicYearWizard}
        onSuccess={handleAcademicYearCreated}
        currentYear={selectedYear}
      />
    </div>
  );
}