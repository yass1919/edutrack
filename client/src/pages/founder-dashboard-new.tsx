import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Filter, 
  Calculator,
  Edit3,
  FileText,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Header } from "@/components/header";
import { NotifySgModal } from "@/components/notify-sg-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AuthUser } from "@/lib/auth";

interface FounderDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function FounderDashboard({ user, onLogout }: FounderDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeFilter, setTimeFilter] = useState("all");
  
  // Filtres pour la gestion des professeurs
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // week, month, semester, year
  
  // État pour la gestion des tarifs
  const [showTarifModal, setShowTarifModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [hourlyRate, setHourlyRate] = useState("");
  
  // État pour l'expansion des rapports SG
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Données pour l'onglet vue d'ensemble
  const { data: stats = {} } = useQuery({
    queryKey: ["/api/founder/stats"],
  });

  const { data: progressions = [] } = useQuery({
    queryKey: ["/api/founder/progressions"],
  });

  // Données pour l'onglet gestion des professeurs
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/founder/teachers", subjectFilter, levelFilter],
    enabled: activeTab === "teachers"
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/founder/subjects"],
    enabled: activeTab === "teachers"
  });

  const { data: levels = [] } = useQuery({
    queryKey: ["/api/founder/levels"],
    enabled: activeTab === "teachers"
  });

  const { data: teacherHours = [] } = useQuery({
    queryKey: ["/api/founder/teacher-hours", selectedPeriod],
    enabled: activeTab === "teachers" || activeTab === "finances"
  });

  const { data: teacherStats = [] } = useQuery({
    queryKey: ["/api/founder/teacher-statistics"],
    enabled: activeTab === "teachers"
  });

  // Données pour l'onglet validation des rapports SG
  const { data: sgReports = [] } = useQuery({
    queryKey: ["/api/sg-reports"],
    enabled: activeTab === "sg-reports"
  });

  // Mutation pour mettre à jour les tarifs horaires
  const updateHourlyRateMutation = useMutation({
    mutationFn: async ({ teacherId, hourlyRate }: { teacherId: number; hourlyRate: number }) => {
      const response = await fetch(`/api/founder/teacher-hourly-rate/${teacherId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ hourlyRate })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour du tarif');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/teacher-hours"] });
      toast({
        title: "Tarif mis à jour",
        description: "Le tarif horaire a été mis à jour avec succès.",
      });
      setShowTarifModal(false);
      setSelectedTeacher(null);
      setHourlyRate("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la mise à jour du tarif.",
        variant: "destructive",
      });
    }
  });

  // Mutation pour valider les rapports SG
  const validateSgReportMutation = useMutation({
    mutationFn: async ({ reportId, sessionValidated, validationNotes }: { reportId: number; sessionValidated: boolean; validationNotes?: string }) => {
      const response = await apiRequest("PUT", `/api/sg-reports/${reportId}/validate`, {
        sessionValidated,
        validationNotes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sg-reports"] });
      toast({
        title: "Rapport validé",
        description: "Le rapport SG a été traité avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateHourlyRate = () => {
    if (!selectedTeacher || !hourlyRate) return;
    
    updateHourlyRateMutation.mutate({
      teacherId: selectedTeacher.id,
      hourlyRate: parseFloat(hourlyRate)
    });
  };

  // Calculer le total des salaires à payer
  const calculateTotalSalaries = () => {
    return teacherHours.reduce((total: number, teacher: any) => {
      const monthlyHours = teacher.monthlyHours || 0;
      const hourlyRate = teacher.hourlyRate || 0;
      return total + (monthlyHours * hourlyRate);
    }, 0);
  };

  // Filtrer les professeurs selon les critères sélectionnés (utilise teacherHours car il contient les tarifs mis à jour)
  const filteredTeachers = teacherHours.filter((teacher: any) => {
    const matchesSubject = subjectFilter === "all" || teacher.subject?.id === parseInt(subjectFilter);
    const matchesLevel = levelFilter === "all" || teacher.assignments?.some((assignment: any) => 
      assignment.class?.level?.id === parseInt(levelFilter)
    );
    return matchesSubject && matchesLevel;
  });

  // Calculs pour vue d'ensemble
  const progressPercentage = stats.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0;

  const validationRate = stats.completedLessons > 0
    ? Math.round((stats.validatedLessons / stats.completedLessons) * 100)
    : 0;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'week': return 'par semaine';
      case 'month': return 'par mois';
      case 'semester': return 'par semestre';
      case 'year': return 'par an';
      default: return 'par mois';
    }
  };

  const toggleReportExpansion = (reportId: number) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord Fondateur</h2>
              <p className="text-gray-500 mt-1">
                Gestion pédagogique et financière de l'établissement
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
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="teachers">Information Professeurs</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
            <TabsTrigger value="sg-reports">Rapports SG</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Statistiques générales</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Période:</span>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute l'année</SelectItem>
                    <SelectItem value="trimester1">Trimestre 1</SelectItem>
                    <SelectItem value="trimester2">Trimestre 2</SelectItem>
                    <SelectItem value="trimester3">Trimestre 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Progression Globale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{progressPercentage}%</div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.completedLessons || 0} sur {stats.totalLessons || 0} leçons
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Taux de Validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{validationRate}%</div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.validatedLessons || 0} validées sur {stats.completedLessons || 0} effectuées
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Leçons en Retard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.delayedLessons || 0}</div>
                  <p className="text-xs text-gray-500 mt-2">
                    Nécessitent un rattrapage
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Heures Effectuées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.totalActualHours || 0)}h
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    sur {Math.round(stats.totalPlannedHours || 0)}h planifiées
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progression par Matière</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completed" fill="#22c55e" />
                      <Bar dataKey="pending" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Niveau</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestion des Professeurs */}
          <TabsContent value="teachers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Information des Professeurs</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Matière" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les matières</SelectItem>
                      {subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les niveaux</SelectItem>
                      {levels.map((level: any) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Information des Professeurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Professeur</TableHead>
                      <TableHead>Matière</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Avancement</TableHead>
                      <TableHead>Contrôles Effectués</TableHead>
                      <TableHead>Contrôles Prévus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher: any) => {
                      // Trouver les statistiques pour ce professeur
                      const teacherStat = teacherStats.find((t: any) => t.id === teacher.id);
                      const progressPercentage = teacherStat?.progressPercentage || 0;
                      const completedLessons = teacherStat?.completedLessons || 0;
                      const totalLessons = teacherStat?.totalLessons || 0;
                      const completedControls = teacherStat?.completedControls || 0;
                      const plannedControls = teacherStat?.plannedControls || 0;
                      
                      return (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">
                            {teacher.firstName} {teacher.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {teacher.subject?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {teacher.classes?.map((className: string, index: number) => (
                                <div key={index} className="border rounded p-2 bg-gray-50">
                                  <Badge variant="secondary" className="text-xs mb-1">
                                    {className}
                                  </Badge>
                                  <div className="text-xs text-gray-600">
                                    Avancement: {progressPercentage}%
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                    <div 
                                      className="bg-blue-600 h-1 rounded-full" 
                                      style={{ width: `${progressPercentage}%` }}
                                    />
                                  </div>
                                </div>
                              )) || 'Aucune'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600">
                                {progressPercentage}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {completedLessons}/{totalLessons} leçons
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-green-600">
                                {completedControls}
                              </div>
                              <div className="text-xs text-gray-500">
                                contrôles
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-orange-600">
                                {plannedControls}
                              </div>
                              <div className="text-xs text-gray-500">
                                prévus
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {filteredTeachers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun professeur trouvé avec ces critères</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finances */}
          <TabsContent value="finances" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Finances</h3>
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4" />
                <span className="text-sm text-gray-500">Calculs automatiques</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Total Salaires Mensuels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateTotalSalaries())}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tous professeurs confondus
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Total Heures Mensuelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {teacherHours.reduce((total: number, teacher: any) => total + (teacher.monthlyHours || 0), 0)}h
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Volume horaire total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Coût Horaire Moyen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {teacherHours.length > 0 
                      ? formatCurrency(
                          teacherHours.reduce((total: number, teacher: any) => total + (teacher.hourlyRate || 0), 0) / teacherHours.length
                        )
                      : formatCurrency(0)
                    }
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Moyenne des tarifs horaires
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Détail des Coûts par Professeur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Professeur</TableHead>
                      <TableHead>Matière</TableHead>
                      <TableHead>Heures/Mois</TableHead>
                      <TableHead>Tarif Horaire</TableHead>
                      <TableHead>Salaire Mensuel</TableHead>
                      <TableHead>Salaire Annuel</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherHours.map((teacher: any) => {
                      const monthlyHours = teacher.monthlyHours || 0;
                      const hourlyRate = teacher.hourlyRate || 0;
                      const monthlySalary = monthlyHours * hourlyRate;
                      const yearlySalary = monthlySalary * 12;
                      
                      return (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">
                            {teacher.firstName} {teacher.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {teacher.subject?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{monthlyHours}h</TableCell>
                          <TableCell>{formatCurrency(hourlyRate)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(monthlySalary)}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(yearlySalary)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setHourlyRate(hourlyRate.toString());
                                setShowTarifModal(true);
                              }}
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Modifier Tarif
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        
        {/* Onglet Rapports SG */}
        <TabsContent value="sg-reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Rapports de Surveillance Générale</h3>
            <Badge variant="outline">
              {sgReports.filter((report: any) => !report.sessionValidated).length} en attente
            </Badge>
          </div>

          <div className="space-y-4">
            {sgReports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun rapport SG disponible</p>
                </CardContent>
              </Card>
            ) : (
              sgReports.map((report: any) => {
                const isExpanded = expandedReports.has(report.id);
                return (
                  <Card key={report.id} className={`${!report.sessionValidated ? 'border-orange-200 bg-orange-50' : ''} cursor-pointer transition-all duration-200`}>
                    <CardContent className="p-4">
                      <div 
                        className="flex justify-between items-center"
                        onClick={() => toggleReportExpansion(report.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium text-gray-900">
                            {report.class?.name} prof {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </div>
                          <Badge variant={report.sessionValidated ? "default" : "secondary"} className="text-xs">
                            {report.sessionValidated ? "Validé" : "En attente"}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            SG: {report.sg?.firstName} {report.sg?.lastName}
                          </span>
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {report.class?.name} - {report.teacher?.firstName} {report.teacher?.lastName}
                              </h4>
                              <p className="text-sm text-gray-500">
                                SG: {report.sg?.firstName} {report.sg?.lastName} • {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-gray-700">Présence et horaires</h5>
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
                        <h5 className="font-medium text-sm text-gray-700">Évaluation</h5>
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
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                        <h5 className="font-medium text-sm text-gray-700 mb-2">Observations</h5>
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

                          {!report.sessionValidated && (
                            <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          size="sm" 
                          onClick={() => validateSgReportMutation.mutate({ reportId: report.id, sessionValidated: true })}
                          disabled={validateSgReportMutation.isPending}
                        >
                          ✓ Valider
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={validateSgReportMutation.isPending}
                            >
                              ✗ Rejeter
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rejeter le rapport</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600">
                                Pourquoi rejetez-vous ce rapport ?
                              </p>
                              <Input
                                placeholder="Raison du rejet..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const reason = (e.target as HTMLInputElement).value;
                                    validateSgReportMutation.mutate({ 
                                      reportId: report.id, 
                                      sessionValidated: false,
                                      validationNotes: reason 
                                    });
                                  }
                                }}
                              />
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    const input = document.querySelector('input[placeholder="Raison du rejet..."]') as HTMLInputElement;
                                    if (input) {
                                      const reason = input.value;
                                      validateSgReportMutation.mutate({ 
                                        reportId: report.id, 
                                        sessionValidated: false,
                                        validationNotes: reason 
                                      });
                                    }
                                  }}
                                >
                                  Rejeter
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                            </Dialog>
                            </div>
                          )}

                          {report.sessionValidated && report.validationNotes && (
                            <div className="pt-4 border-t">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Notes de validation:</span> {report.validationNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modal pour édition du tarif horaire */}
      <Dialog open={showTarifModal} onOpenChange={setShowTarifModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Tarif Horaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTeacher && (
              <div>
                <Label className="text-sm font-medium">
                  Professeur: {selectedTeacher.firstName} {selectedTeacher.lastName}
                </Label>
                <p className="text-sm text-gray-500">
                  Matière: {selectedTeacher.subject?.name || 'N/A'}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="hourlyRate">Tarif Horaire (MAD)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="Ex: 150.00"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTarifModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateHourlyRate}
                disabled={updateHourlyRateMutation.isPending}
              >
                {updateHourlyRateMutation.isPending ? "Mise à jour..." : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}