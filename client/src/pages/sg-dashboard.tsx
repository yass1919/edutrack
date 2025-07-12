import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CheckCircle, Clock, AlertTriangle, Star, Users, Calendar, LogOut, FileText, Send, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, logout } from "@/lib/auth";
import { NotificationBell } from "@/components/notification-bell";

interface SgDashboardProps {
  user: any;
  onLogout: () => void;
}

export function SgDashboard({ user, onLogout }: SgDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [expandedReports, setExpandedReports] = useState<number[]>([]);
  const [expandedTeachers, setExpandedTeachers] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les professeurs du cycle du SG
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/sg/teachers"],
    enabled: !!user?.id,
  });

  // Récupérer les classes du cycle du SG
  const { data: classes = [] } = useQuery({
    queryKey: ["/api/sg/classes"],
    enabled: !!user?.id,
  });


  // Récupérer les signalements d'anomalies
  const { data: anomalyReports = [] } = useQuery({
    queryKey: ["/api/anomaly-reports"],
  });

  // Récupérer les rapports SG existants
  const { data: sgReports = [] } = useQuery({
    queryKey: ["/api/sg-reports"],
  });

  // Récupérer les classes pour les formulaires
  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/teacher/assignments"],
  });

  // Récupérer le rapport de volume horaire des professeurs
  const { data: teacherHours = [] } = useQuery({
    queryKey: ["/api/sg-reports/teacher-hours"],
  });

  // Récupérer les statistiques de progression des professeurs
  const { data: teacherStats = [] } = useQuery({
    queryKey: ["/api/sg/teacher-statistics"],
    enabled: !!user?.id,
  });

  const createSgReportMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/sg-reports", data);
    },
    onSuccess: () => {
      toast({
        title: "Rapport créé",
        description: "Le rapport de surveillance a été enregistré et envoyé au fondateur.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sg-reports"] });
      // Réinitialiser l'état du formulaire après un délai
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le rapport. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const updateAnomalyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/anomaly-reports/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Problème traité",
        description: "Le signalement de problème a été mis à jour.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/anomaly-reports"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'content': return 'Contenu';
      case 'hours': return 'Volume horaire';
      case 'schedule': return 'Planning';
      default: return type;
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const toggleTeacherExpansion = (teacherId: number) => {
    setExpandedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Surveillant Général</h1>
          <p className="text-gray-600 mt-2">Validation des séances et gestion des anomalies</p>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right">
              <p className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-600">{user.username}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="progression" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progression">Progression</TabsTrigger>
          <TabsTrigger value="volume-horaire">Volume Horaire</TabsTrigger>
          <TabsTrigger value="nouveau">Nouveau Rapport</TabsTrigger>
          <TabsTrigger value="rapports">Mes Rapports</TabsTrigger>
        </TabsList>



        {/* Progression Tab */}
        <TabsContent value="progression" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Progression des Professeurs ({teacherStats.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-gray-900" style={{width: '20%'}}>Professeur</th>
                      <th className="text-left p-4 font-medium text-gray-900" style={{width: '15%'}}>Matière</th>
                      <th className="text-left p-4 font-medium text-gray-900" style={{width: '35%'}}>Classes</th>
                      <th className="text-left p-4 font-medium text-gray-900" style={{width: '20%'}}>Avancement</th>
                      <th className="text-left p-4 font-medium text-gray-900" style={{width: '10%'}}>Contrôles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherStats.map((teacher: any) => {
                      const progressPercentage = teacher.progressPercentage || 0;
                      const completedLessons = teacher.completedLessons || 0;
                      const totalLessons = teacher.totalLessons || 0;
                      const completedControls = teacher.completedControls || 0;
                      const plannedControls = teacher.plannedControls || 0;
                      const isExpanded = expandedTeachers.includes(teacher.id);
                      
                      return (
                        <>
                          <tr key={teacher.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div 
                                className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 flex items-center gap-2"
                                onClick={() => toggleTeacherExpansion(teacher.id)}
                              >
                                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                  ►
                                </div>
                                {teacher.firstName} {teacher.lastName}
                              </div>
                              <div className="text-sm text-gray-500 ml-6">
                                {teacher.username}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">
                                {teacher.subject?.name || 'N/A'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {teacher.classes?.map((className: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs mr-1 mb-1">
                                    {className}
                                  </Badge>
                                )) || 'Aucune'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-blue-600">
                                  {progressPercentage}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {completedLessons}/{totalLessons} leçons
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-green-600">
                                  {completedControls}/{plannedControls}
                                </div>
                                <div className="text-xs text-gray-500">
                                  contrôles
                                </div>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${teacher.id}-expanded`} className="bg-gray-50">
                              <td colSpan={5} className="p-4">
                                <div className="ml-8 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium text-gray-900 mb-2">Détails des Classes</h4>
                                      <div className="space-y-2">
                                        {teacher.classes?.map((className: string, index: number) => (
                                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                                            <span className="text-sm font-medium">{className}</span>
                                            <span className="text-xs text-gray-500">Avancement: {progressPercentage}%</span>
                                          </div>
                                        )) || <div className="text-sm text-gray-500">Aucune classe assignée</div>}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900 mb-2">Statistiques Détaillées</h4>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-sm text-gray-600">Leçons terminées :</span>
                                          <span className="text-sm font-medium">{completedLessons}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-gray-600">Leçons totales :</span>
                                          <span className="text-sm font-medium">{totalLessons}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-gray-600">Contrôles effectués :</span>
                                          <span className="text-sm font-medium">{completedControls}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm text-gray-600">Contrôles prévus :</span>
                                          <span className="text-sm font-medium">{plannedControls}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
                
                {teacherStats.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun professeur trouvé dans votre cycle</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume-horaire" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Rapport de Volume Horaire des Professeurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teacherHours.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun professeur assigné à votre cycle</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-3 text-left">Professeur</th>
                          <th className="border border-gray-300 p-3 text-left">Matière</th>
                          <th className="border border-gray-300 p-3 text-left">Classes</th>
                          <th className="border border-gray-300 p-3 text-center">Heures Prévues</th>
                          <th className="border border-gray-300 p-3 text-center">Heures Réalisées</th>
                          <th className="border border-gray-300 p-3 text-center">Leçons Complétées</th>
                          <th className="border border-gray-300 p-3 text-center">Total Leçons</th>
                          <th className="border border-gray-300 p-3 text-center">Objectif Mensuel</th>
                          <th className="border border-gray-300 p-3 text-center">Avancement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherHours.map((teacher: any) => {
                          const completionRate = teacher.totalLessons > 0 ? (teacher.completedLessons / teacher.totalLessons) * 100 : 0;
                          const hourEfficiency = teacher.plannedHours > 0 ? (teacher.actualHours / teacher.plannedHours) * 100 : 0;
                          
                          return (
                            <tr key={teacher.teacherId} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3 font-medium">{teacher.teacherName}</td>
                              <td className="border border-gray-300 p-3">{teacher.subject}</td>
                              <td className="border border-gray-300 p-3">
                                <div className="text-sm">
                                  {teacher.classes.join(', ')}
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3 text-center">{teacher.plannedHours}h</td>
                              <td className="border border-gray-300 p-3 text-center">{teacher.actualHours}h</td>
                              <td className="border border-gray-300 p-3 text-center">{teacher.completedLessons}</td>
                              <td className="border border-gray-300 p-3 text-center">{teacher.totalLessons}</td>
                              <td className="border border-gray-300 p-3 text-center">{teacher.monthlyTarget}h</td>
                              <td className="border border-gray-300 p-3 text-center">
                                <div className="flex flex-col gap-1">
                                  <span className={`text-sm font-medium ${completionRate >= 80 ? 'text-green-600' : completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {completionRate.toFixed(1)}%
                                  </span>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rapports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Mes Rapports de Surveillance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sgReports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun rapport créé</p>
                ) : (
                  sgReports.map((report: any) => {
                    const toggleExpand = (reportId: number) => {
                      setExpandedReports(prev => 
                        prev.includes(reportId) 
                          ? prev.filter(id => id !== reportId)
                          : [...prev, reportId]
                      );
                    };
                    
                    const isExpanded = expandedReports.includes(report.id);
                    
                    return (
                      <div key={report.id} className="border rounded-lg">
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleExpand(report.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="font-medium">
                                  {report.class?.name} - {report.teacher?.firstName} {report.teacher?.lastName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={report.sessionValidated ? "default" : "secondary"}>
                                {report.sessionValidated ? "Validé" : "En attente"}
                              </Badge>
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Présence et horaires</h4>
                                <div className="text-sm space-y-1">
                                  <div>Professeur présent: <span className={`font-medium ${report.teacherPresent ? 'text-green-600' : 'text-red-600'}`}>
                                    {report.teacherPresent ? 'Oui' : 'Non'}
                                  </span></div>
                                  {report.teacherLateMinutes > 0 && (
                                    <div>Retard: <span className="font-medium text-orange-600">{report.teacherLateMinutes} min</span></div>
                                  )}
                                  {report.actualStartTime && report.actualEndTime && (
                                    <div>Horaires: <span className="font-medium">{report.actualStartTime} - {report.actualEndTime}</span></div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Évaluation</h4>
                                <div className="text-sm space-y-1">
                                  {report.teacherRating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-yellow-500" />
                                      <span className="font-medium">{report.teacherRating}/5</span>
                                    </div>
                                  )}
                                  {report.studentsPresent && report.studentsTotal && (
                                    <div>Étudiants: <span className="font-medium">{report.studentsPresent}/{report.studentsTotal}</span></div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {(report.teacherAppreciation || report.observations || report.incidents) && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="font-medium text-sm text-gray-700 mb-2">Observations</h4>
                                {report.teacherAppreciation && (
                                  <div className="mb-2">
                                    <span className="font-medium text-xs text-gray-500">Appréciation:</span>
                                    <p className="text-sm">{report.teacherAppreciation}</p>
                                  </div>
                                )}
                                {report.observations && (
                                  <div className="mb-2">
                                    <span className="font-medium text-xs text-gray-500">Observations:</span>
                                    <p className="text-sm">{report.observations}</p>
                                  </div>
                                )}
                                {report.incidents && (
                                  <div className="mb-2">
                                    <span className="font-medium text-xs text-gray-500">Incidents:</span>
                                    <p className="text-sm text-red-600">{report.incidents}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nouveau" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Créer un Nouveau Rapport
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NewSgReportForm onSubmit={(data) => createSgReportMutation.mutate(data)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composant pour créer un rapport SG à partir d'une progression
function SgReportForm({ progression, onSubmit }: { progression: any; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    teacherId: progression.teacherId,
    lessonProgressionId: progression.id,
    classId: progression.classId,
    scheduleValidated: true,
    actualStartTime: '',
    actualEndTime: '',
    teacherPresent: true,
    teacherLateMinutes: 0,
    teacherRating: 5,
    teacherAppreciation: '',
    incidents: '',
    observations: '',
    studentsPresent: 0,
    studentsTotal: 0,
    sessionValidated: false,
    validationNotes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Heure de début</label>
          <Input
            type="time"
            value={formData.actualStartTime}
            onChange={(e) => setFormData({ ...formData, actualStartTime: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Heure de fin</label>
          <Input
            type="time"
            value={formData.actualEndTime}
            onChange={(e) => setFormData({ ...formData, actualEndTime: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Étudiants présents</label>
          <Input
            type="number"
            value={formData.studentsPresent}
            onChange={(e) => setFormData({ ...formData, studentsPresent: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Total étudiants</label>
          <Input
            type="number"
            value={formData.studentsTotal}
            onChange={(e) => setFormData({ ...formData, studentsTotal: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Note du professeur (1-5)</label>
        <Select 
          value={formData.teacherRating.toString()} 
          onValueChange={(value) => setFormData({ ...formData, teacherRating: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Très insuffisant</SelectItem>
            <SelectItem value="2">2 - Insuffisant</SelectItem>
            <SelectItem value="3">3 - Satisfaisant</SelectItem>
            <SelectItem value="4">4 - Bien</SelectItem>
            <SelectItem value="5">5 - Excellent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Appréciation du professeur</label>
        <Textarea
          value={formData.teacherAppreciation}
          onChange={(e) => setFormData({ ...formData, teacherAppreciation: e.target.value })}
          placeholder="Commentaires sur la performance du professeur..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Incidents (optionnel)</label>
        <Textarea
          value={formData.incidents}
          onChange={(e) => setFormData({ ...formData, incidents: e.target.value })}
          placeholder="Décrire tout incident survenu pendant le cours..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Observations générales</label>
        <Textarea
          value={formData.observations}
          onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
          placeholder="Observations sur le déroulement du cours..."
        />
      </div>

      <Button 
        type="submit" 
        className={`w-full ${isSubmitted ? 'bg-green-600 hover:bg-green-700' : ''}`}
        disabled={isSubmitted}
      >
        {isSubmitted ? (
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Envoyé au fondateur
          </div>
        ) : (
          'Enregistrer le rapport'
        )}
      </Button>
    </form>
  );
}

// Composant pour créer un nouveau rapport SG
function NewSgReportForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    teacherId: 0,
    classId: 0,
    scheduleValidated: true,
    actualStartTime: '',
    actualEndTime: '',
    teacherPresent: true,
    teacherLateMinutes: 0,
    teacherRating: 5,
    teacherAppreciation: '',
    incidents: '',
    observations: '',
    studentsPresent: 0,
    studentsTotal: 0,
    sessionValidated: false,
    validationNotes: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/sg/teachers"],
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["/api/sg/classes"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.teacherId && formData.classId) {
      onSubmit(formData);
      setIsSubmitted(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Professeur</label>
          <Select value={formData.teacherId.toString()} onValueChange={(value) => setFormData({ ...formData, teacherId: parseInt(value) })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un professeur" />
            </SelectTrigger>
            <SelectContent>
              {teachers.filter((t: any) => t.role === 'teacher').map((teacher: any) => (
                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                  {teacher.firstName} {teacher.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Classe</label>
          <Select value={formData.classId.toString()} onValueChange={(value) => setFormData({ ...formData, classId: parseInt(value) })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Heure de début</label>
          <Input
            type="time"
            value={formData.actualStartTime}
            onChange={(e) => setFormData({ ...formData, actualStartTime: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Heure de fin</label>
          <Input
            type="time"
            value={formData.actualEndTime}
            onChange={(e) => setFormData({ ...formData, actualEndTime: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Étudiants présents</label>
          <Input
            type="number"
            value={formData.studentsPresent}
            onChange={(e) => setFormData({ ...formData, studentsPresent: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Total étudiants</label>
          <Input
            type="number"
            value={formData.studentsTotal}
            onChange={(e) => setFormData({ ...formData, studentsTotal: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Note du professeur (1-5)</label>
        <Select 
          value={formData.teacherRating.toString()} 
          onValueChange={(value) => setFormData({ ...formData, teacherRating: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Très insuffisant</SelectItem>
            <SelectItem value="2">2 - Insuffisant</SelectItem>
            <SelectItem value="3">3 - Satisfaisant</SelectItem>
            <SelectItem value="4">4 - Bien</SelectItem>
            <SelectItem value="5">5 - Excellent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Appréciation du professeur</label>
        <Textarea
          value={formData.teacherAppreciation}
          onChange={(e) => setFormData({ ...formData, teacherAppreciation: e.target.value })}
          placeholder="Commentaires sur la performance du professeur..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Incidents (optionnel)</label>
        <Textarea
          value={formData.incidents}
          onChange={(e) => setFormData({ ...formData, incidents: e.target.value })}
          placeholder="Décrire tout incident survenu pendant le cours..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Observations générales</label>
        <Textarea
          value={formData.observations}
          onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
          placeholder="Observations sur le déroulement du cours..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={!formData.teacherId || !formData.classId}>
        Enregistrer le rapport
      </Button>
    </form>
  );
}