import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { ProgressOverview } from "@/components/progress-overview";
import { LessonTrackingTableReadonly } from "@/components/lesson-tracking-table-readonly";
import { QuickLessonModal } from "@/components/quick-lesson-modal";
import { AnomalyReportModal } from "@/components/anomaly-report-modal";
import { NotifySgModal } from "@/components/notify-sg-modal";
import { apiRequest } from "@/lib/queryClient";
import type { AuthUser } from "@/lib/auth";

interface TeacherDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/teacher/assignments"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["/api/teacher/lessons", selectedClassId, selectedSubjectId],
    enabled: selectedClassId !== null && selectedSubjectId !== null,
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (data: {
      lessonId: number;
      classId: number;
      actualDate: string;
      actualDurationMinutes: number;
      notes?: string;
      sessionType?: string;
      chapterElements?: number[];
    }) => {
      return apiRequest("POST", "/api/teacher/lessons/complete", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      toast({
        title: "Leçon marquée comme effectuée",
        description: "La progression a été enregistrée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de marquer la leçon",
        variant: "destructive",
      });
    },
  });

  // Set default selection when assignments are loaded
  useEffect(() => {
    if (assignments.length > 0 && !selectedClassId) {
      const firstAssignment = assignments[0];
      setSelectedClassId(firstAssignment.class.id);
      setSelectedSubjectId(firstAssignment.subject.id);
    }
  }, [assignments, selectedClassId]);

  const handleClassSelect = (classId: number) => {
    setSelectedClassId(classId);
    const assignment = assignments.find((a: any) => a.class.id === classId);
    if (assignment) {
      setSelectedSubjectId(assignment.subject.id);
    }
  };

  const handleMarkCompleted = (
    classId: number,
    lessonId: number,
    actualDate: string,
    actualDurationMinutes: number,
    notes?: string,
    sessionType?: string,
    chapterElements?: number[]
  ) => {
    markCompletedMutation.mutate({
      lessonId,
      classId: classId,
      actualDate,
      actualDurationMinutes,
      notes: notes || "",
      sessionType: sessionType || 'lesson',
      chapterElements: chapterElements || [],
    });
  };

  const handleExport = async () => {
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucune donnée à exporter",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Import dynamique pour éviter les erreurs au chargement
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const { format } = await import('date-fns');
      const { fr } = await import('date-fns/locale');

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // En-tête avec informations du professeur
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RAPPORT DE PROGRESSION PÉDAGOGIQUE', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Professeur: ${user.firstName} ${user.lastName}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Nom d'utilisateur: ${user.username}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Date d'édition: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 20, yPosition);
      yPosition += 15;

      // Statistiques générales
      if (stats) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('TABLEAU DE BORD GLOBAL', 20, yPosition);
        yPosition += 10;

        const statsData = [
          ['Total des leçons', stats.totalLessons.toString()],
          ['Leçons effectuées', stats.completedLessons.toString()],
          ['Leçons validées', stats.validatedLessons.toString()],
          ['Leçons en retard', stats.delayedLessons.toString()],
          ['Heures prévues total', `${Math.round(stats.totalPlannedHours)} h`],
          ['Heures réalisées total', `${Math.round(stats.totalActualHours)} h`],
          ['Pourcentage d\'avancement', `${stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}%`]
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [['Indicateur', 'Valeur']],
          body: statsData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] },
          margin: { left: 20, right: 20 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 20;
      }

      // Récupérer et afficher les données pour chaque classe/matière
      for (const assignment of assignments as any[]) {
        try {
          const response = await fetch(`/api/teacher/lessons?classId=${assignment.class.id}&subjectId=${assignment.subject.id}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const lessons = await response.json();
            
            if (lessons.length > 0) {
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text(`${assignment.class.name} - ${assignment.subject.name}`, 20, yPosition);
              yPosition += 15;

              // Tableau des leçons
              const lessonRows = lessons.map((lesson: any) => {
                const progression = lesson.progressions[0];
                const status = progression ? 
                  (progression.status === 'completed' ? 'Effectuée' :
                   progression.status === 'validated' ? 'Validée' : 'Prévue') : 'Prévue';
                
                const plannedDate = lesson.plannedDate ? 
                  format(new Date(lesson.plannedDate), 'dd/MM/yyyy', { locale: fr }) : '-';
                
                const actualDate = progression?.actualDate ? 
                  format(new Date(progression.actualDate), 'dd/MM/yyyy', { locale: fr }) : '-';

                const elementsCount = progression?.chapterElements ? 
                  JSON.parse(progression.chapterElements).length : 0;

                return [
                  lesson.chapter.name,
                  lesson.title,
                  plannedDate,
                  status,
                  actualDate,
                  elementsCount > 0 ? `${elementsCount} éléments` : '-'
                ];
              });

              autoTable(doc, {
                startY: yPosition,
                head: [['Chapitre', 'Leçon', 'Date Prévue', 'Statut', 'Date Effectuée', 'Éléments Traités']],
                body: lessonRows,
                theme: 'striped',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [52, 152, 219] },
                margin: { left: 20, right: 20 }
              });

              yPosition = (doc as any).lastAutoTable.finalY + 15;
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des leçons:', error);
        }
      }

      // Sauvegarder le PDF
      const fileName = `rapport_progression_${user.lastName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export réussi",
        description: "Le rapport PDF a été téléchargé",
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le rapport PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedAssignment = assignments.find((a: any) => a.class.id === selectedClassId);

  // Transform assignments for ProgressOverview
  const classesForOverview = assignments.map((assignment: any) => {
    const completedCount = lessons.filter(lesson => 
      lesson.progressions.some((p: any) => p.status === 'completed' || p.status === 'validated')
    ).length;
    
    return {
      id: assignment.class.id,
      name: assignment.class.name,
      subject: assignment.subject.name,
      completedLessons: completedCount,
      totalLessons: lessons.length,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb and Page Header */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li><span className="text-gray-500">Accueil</span></li>
              <li><span className="text-gray-400">/</span></li>
              <li><span className="text-gray-900 font-medium">Suivi Pédagogique</span></li>
            </ol>
          </nav>
          
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Suivi Pédagogique</h2>
              <p className="text-gray-500 mt-1">
                Marquez les leçons effectuées et suivez votre progression annuelle
              </p>
            </div>
            <div className="flex space-x-3">
              <NotifySgModal
                trigger={
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Contacter SG
                  </Button>
                }
              />
              <AnomalyReportModal
                classId={selectedClassId || undefined}
                subjectId={selectedSubjectId || undefined}
              >
                <Button variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Signaler un Problème
                </Button>
              </AnomalyReportModal>
              <Button 
                variant="outline" 
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Export en cours..." : "Exporter"}
              </Button>
              <Button onClick={() => setShowQuickModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Séance
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        {stats && (
          <ProgressOverview
            classes={classesForOverview}
            stats={stats}
            selectedClassId={selectedClassId || undefined}
            onClassSelect={handleClassSelect}
          />
        )}

        {/* Lesson Tracking Table */}
        {selectedAssignment && lessons.length > 0 && (
          <LessonTrackingTableReadonly
            lessons={lessons}
            className={selectedAssignment.class.name}
            subject={selectedAssignment.subject.name}
          />
        )}

        {/* Quick Add Modal */}
        {assignments && Array.isArray(assignments) && (
          <QuickLessonModal
            open={showQuickModal}
            onClose={() => setShowQuickModal(false)}
            classes={assignments.map((assignment: any) => ({
              id: assignment.class.id,
              name: `${assignment.class.name} - ${assignment.subject.name}`,
              level: assignment.class.level.name,
              subject: assignment.subject.name,
              subjectId: assignment.subject.id
            }))}
            onSubmit={handleMarkCompleted}
          />
        )}

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl"
            onClick={() => setShowQuickModal(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
