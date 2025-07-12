import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, LessonProgression, Lesson, Chapter, Class, Level, TeacherAssignment, Subject } from "@shared/schema";
import { CheckCircle, Clock, AlertCircle, User as UserIcon, BookOpen, BarChart3, LogOut } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAcademicYear } from "@/lib/academic-year-context";
import { AnomalyReportModal } from "@/components/anomaly-report-modal";
import { NotifySgModal } from "@/components/notify-sg-modal";
import { Header } from "@/components/header";
import { logout } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

interface TeacherWithAssignments extends User {
  assignments: (TeacherAssignment & { class: Class & { level: Level }; subject: Subject })[];
}

interface ProgressionWithDetails extends LessonProgression {
  lesson: Lesson & { chapter: Chapter };
  class: Class & { level: Level };
  teacher?: User; // Add teacher for inspector view
}

export default function InspectorDashboard() {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithAssignments | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const { selectedYear } = useAcademicYear();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  // Get current user data for header
  const { data: currentUser } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
  });


  const { data: teachers, isLoading: teachersLoading } = useQuery<TeacherWithAssignments[]>({
    queryKey: ["/api/inspector/teachers", selectedYear],
    queryFn: () => apiRequest("GET", `/api/inspector/teachers?academicYear=${selectedYear}`).then(res => res.json()),
  });

  const { data: teacherProgressions, isLoading: progressionsLoading } = useQuery<ProgressionWithDetails[]>({
    queryKey: [`/api/inspector/teacher/${selectedTeacher?.id}/progressions`, selectedYear],
    queryFn: () => apiRequest("GET", `/api/inspector/teacher/${selectedTeacher?.id}/progressions?academicYear=${selectedYear}`).then(res => res.json()),
    enabled: !!selectedTeacher,
  });

  const { data: classProgressions, isLoading: classProgressionsLoading } = useQuery<ProgressionWithDetails[]>({
    queryKey: [`/api/inspector/teacher/${selectedTeacher?.id}/class/${selectedClass}/progressions`],
    enabled: !!selectedTeacher && !!selectedClass,
  });

  const validateMutation = useMutation({
    mutationFn: async (progressionId: number) => {
      return apiRequest("POST", `/api/inspector/progressions/${progressionId}/validate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/inspector/teacher/${selectedTeacher?.id}/progressions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/inspector/teacher/${selectedTeacher?.id}/class/${selectedClass}/progressions`] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case "validated":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Validé</Badge>;
      case "delayed":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />En retard</Badge>;
      default:
        return <Badge variant="outline">Planifié</Badge>;
    }
  };

  const handleValidate = (progressionId: number) => {
    validateMutation.mutate(progressionId);
  };

  if (teachersLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentUser && <Header user={currentUser} onLogout={handleLogout} />}
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Inspecteur</h1>
            <p className="text-gray-600">Supervision et validation des progressions pédagogiques</p>
          </div>
          <div className="flex gap-3">
            <NotifySgModal
              trigger={
                <Button variant="outline">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Contacter SG
                </Button>
              }
            />
            <AnomalyReportModal>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                Signaler un problème
              </Button>
            </AnomalyReportModal>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des professeurs */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Professeurs assignés
              </CardTitle>
              <CardDescription>
                Professeurs de votre matière
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teachers && teachers.map((teacher: TeacherWithAssignments) => (
                  <div
                    key={teacher.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeacher?.id === teacher.id
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                    <div className="text-sm text-gray-600">
                      {teacher.assignments.length} classe(s) assignée(s)
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {teacher.assignments.map((assignment, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {assignment.class.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Détails du professeur sélectionné */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                {selectedTeacher
                  ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                  : "Sélectionnez un professeur"
                }
              </CardTitle>
              {selectedTeacher && (
                <CardDescription>
                  Progressions et validation des leçons
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedTeacher ? (
                <div className="text-center py-8 text-gray-500">
                  Cliquez sur un professeur pour voir ses progressions
                </div>
              ) : (
                <Tabs defaultValue="progressions" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="progressions">Toutes les progressions</TabsTrigger>
                    <TabsTrigger value="by-class">Par classe</TabsTrigger>
                    <TabsTrigger value="stats">Statistiques</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="progressions" className="space-y-4">
                    {progressionsLoading ? (
                      <div>Chargement des progressions...</div>
                    ) : !teacherProgressions || teacherProgressions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Aucune progression trouvée pour ce professeur
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-gray-600 mb-3">
                          {teacherProgressions.length} progression(s) trouvée(s)
                        </div>
                        <div className="space-y-3">
                          {teacherProgressions.map((progression: ProgressionWithDetails) => (
                          <div key={progression.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{progression.lesson.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {progression.lesson.chapter.name} - {progression.class.name}
                                </p>
                                {progression.actualDate && (
                                  <p className="text-sm text-gray-500">
                                    Réalisé le {format(new Date(progression.actualDate), "dd MMMM yyyy", { locale: fr })}
                                  </p>
                                )}
                                {progression.notes && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Notes: {progression.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(progression.status)}
                                {progression.status === "completed" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleValidate(progression.id)}
                                    disabled={validateMutation.isPending}
                                  >
                                    Valider
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="by-class" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTeacher.assignments.map((assignment) => (
                        <Button
                          key={assignment.id}
                          variant={selectedClass === assignment.classId ? "default" : "outline"}
                          onClick={() => setSelectedClass(assignment.classId)}
                          className="h-auto p-4 flex flex-col items-start"
                        >
                          <div className="font-medium">{assignment.class.name}</div>
                          <div className="text-sm opacity-70">{assignment.class.level.name}</div>
                        </Button>
                      ))}
                    </div>
                    
                    {selectedClass && (
                      <div className="space-y-3">
                        {classProgressionsLoading ? (
                          <div>Chargement...</div>
                        ) : (
                          classProgressions && classProgressions.map((progression: ProgressionWithDetails) => (
                            <div key={progression.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium">{progression.lesson.title}</h4>
                                  <p className="text-sm text-gray-600">
                                    {progression.lesson.chapter.name}
                                  </p>
                                  {progression.actualDate && (
                                    <p className="text-sm text-gray-500">
                                      Réalisé le {format(new Date(progression.actualDate), "dd MMMM yyyy", { locale: fr })}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(progression.status)}
                                  {progression.status === "completed" && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleValidate(progression.id)}
                                      disabled={validateMutation.isPending}
                                    >
                                      Valider
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="stats" className="space-y-4">
                    {!selectedTeacher ? (
                      <div className="text-center py-8 text-gray-500">
                        Sélectionnez un professeur pour voir ses statistiques
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Statistiques de volume horaire */}
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Volume Théorique</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-blue-600">
                                {teacherProgressions?.reduce((sum, p) => sum + (p.lesson.plannedDurationMinutes || 0), 0) || 0}
                                <span className="text-sm font-normal text-gray-500 ml-1">min</span>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Volume Réel</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-green-600">
                                {teacherProgressions?.reduce((sum, p) => sum + (p.actualDurationMinutes || 0), 0) || 0}
                                <span className="text-sm font-normal text-gray-500 ml-1">min</span>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Écart</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-orange-600">
                                {(() => {
                                  const planned = teacherProgressions?.reduce((sum, p) => sum + (p.lesson.plannedDurationMinutes || 0), 0) || 0;
                                  const actual = teacherProgressions?.reduce((sum, p) => sum + (p.actualDurationMinutes || 0), 0) || 0;
                                  const diff = actual - planned;
                                  return diff > 0 ? `+${diff}` : diff;
                                })()}
                                <span className="text-sm font-normal text-gray-500 ml-1">min</span>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Taux de Réalisation</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-purple-600">
                                {(() => {
                                  const planned = teacherProgressions?.reduce((sum, p) => sum + (p.lesson.plannedDurationMinutes || 0), 0) || 0;
                                  const actual = teacherProgressions?.reduce((sum, p) => sum + (p.actualDurationMinutes || 0), 0) || 0;
                                  return planned > 0 ? Math.round((actual / planned) * 100) : 0;
                                })()}%
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Analyse par classe */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <BarChart3 className="w-5 h-5 mr-2" />
                              Analyse volume horaire par classe
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {selectedTeacher.assignments.map((assignment) => {
                                const classProgressions = teacherProgressions?.filter(p => p.classId === assignment.classId) || [];
                                const plannedTotal = classProgressions.reduce((sum, p) => sum + (p.lesson.plannedDurationMinutes || 0), 0);
                                const actualTotal = classProgressions.reduce((sum, p) => sum + (p.actualDurationMinutes || 0), 0);
                                const difference = actualTotal - plannedTotal;
                                const realizationRate = plannedTotal > 0 ? Math.round((actualTotal / plannedTotal) * 100) : 0;
                                
                                return (
                                  <div key={assignment.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                      <h4 className="font-medium">{assignment.class.name}</h4>
                                      <div className="text-sm text-gray-600">
                                        {classProgressions.length} leçon(s)
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-4 text-center">
                                      <div>
                                        <div className="text-lg font-bold text-blue-600">{plannedTotal}</div>
                                        <div className="text-xs text-gray-500">Théorique (min)</div>
                                      </div>
                                      <div>
                                        <div className="text-lg font-bold text-green-600">{actualTotal}</div>
                                        <div className="text-xs text-gray-500">Réel (min)</div>
                                      </div>
                                      <div>
                                        <div className={`text-lg font-bold ${difference >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                          {difference > 0 ? `+${difference}` : difference}
                                        </div>
                                        <div className="text-xs text-gray-500">Écart (min)</div>
                                      </div>
                                      <div>
                                        <div className={`text-lg font-bold ${
                                          realizationRate >= 90 && realizationRate <= 110 ? 'text-green-600' : 
                                          realizationRate >= 80 && realizationRate <= 120 ? 'text-orange-600' : 'text-red-600'
                                        }`}>
                                          {realizationRate}%
                                        </div>
                                        <div className="text-xs text-gray-500">Réalisation</div>
                                      </div>
                                    </div>
                                    
                                    {/* Barre de progression avec codes couleur */}
                                    <div className="mt-3">
                                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Taux de réalisation</span>
                                        <span>{realizationRate}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            realizationRate >= 90 && realizationRate <= 110 ? 'bg-green-500' : 
                                            realizationRate >= 80 && realizationRate <= 120 ? 'bg-orange-500' : 'bg-red-500'
                                          }`}
                                          style={{ 
                                            width: `${Math.min(realizationRate, 100)}%` 
                                          }}
                                        />
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {realizationRate >= 90 && realizationRate <= 110 ? 'Conforme' : 
                                         realizationRate >= 80 && realizationRate <= 120 ? 'Acceptable' : 'Attention requise'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Détail des écarts par leçon */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Analyse détaillée des écarts</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {teacherProgressions?.map((progression) => {
                                const planned = progression.lesson.plannedDurationMinutes || 0;
                                const actual = progression.actualDurationMinutes || 0;
                                const difference = actual - planned;
                                const percentDiff = planned > 0 ? Math.round(((actual - planned) / planned) * 100) : 0;
                                
                                return (
                                  <div key={progression.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      <div className="font-medium">{progression.lesson.title}</div>
                                      <div className="text-sm text-gray-600">
                                        {progression.class.name} - {progression.lesson.chapter.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {progression.actualDate && format(new Date(progression.actualDate), "dd MMM yyyy", { locale: fr })}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-4">
                                        <div className="text-sm">
                                          <span className="text-blue-600 font-medium">{planned}min</span>
                                          <span className="text-gray-400 mx-1">→</span>
                                          <span className="text-green-600 font-medium">{actual}min</span>
                                        </div>
                                        <div className={`text-sm font-medium ${
                                          Math.abs(percentDiff) <= 10 ? 'text-green-600' : 
                                          Math.abs(percentDiff) <= 25 ? 'text-orange-600' : 'text-red-600'
                                        }`}>
                                          {difference > 0 ? `+${difference}min` : `${difference}min`}
                                          <div className="text-xs">
                                            ({percentDiff > 0 ? '+' : ''}{percentDiff}%)
                                          </div>
                                        </div>
                                        {getStatusBadge(progression.status)}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}