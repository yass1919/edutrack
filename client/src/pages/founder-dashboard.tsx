import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, BookOpen, CheckCircle, Clock, AlertTriangle, DollarSign, Filter, Calculator } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AuthUser } from "@/lib/auth";

interface FounderDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280'];

export default function FounderDashboard({ user, onLogout }: FounderDashboardProps) {
  const [timeFilter, setTimeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Filtres pour la gestion des professeurs
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // week, month, semester, year
  
  // État pour la gestion des tarifs
  const [showTarifModal, setShowTarifModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [hourlyRate, setHourlyRate] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["/api/founder/stats"],
  });

  const { data: progressions = [] } = useQuery({
    queryKey: ["/api/founder/progressions"],
  });

  // Nouvelles queries pour la gestion des professeurs
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
    enabled: activeTab === "teachers"
  });

  // Mutation pour mettre à jour les tarifs horaires
  const updateHourlyRateMutation = useMutation({
    mutationFn: async ({ teacherId, hourlyRate }: { teacherId: number; hourlyRate: number }) => {
      return apiRequest(`/api/founder/teacher-hourly-rate/${teacherId}`, {
        method: "PUT",
        body: { hourlyRate }
      });
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

  // Filtrer les professeurs selon les critères sélectionnés
  const filteredTeachers = teachers.filter((teacher: any) => {
    const matchesSubject = subjectFilter === "all" || teacher.subject?.id === parseInt(subjectFilter);
    const matchesLevel = levelFilter === "all" || teacher.assignments?.some((assignment: any) => 
      assignment.class?.level?.id === parseInt(levelFilter)
    );
    return matchesSubject && matchesLevel;
  });

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = stats.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0;

  const validationRate = stats.completedLessons > 0
    ? Math.round((stats.validatedLessons / stats.completedLessons) * 100)
    : 0;

  // Prepare chart data
  const progressData = [
    { name: 'Validées', value: stats.validatedLessons, fill: '#22c55e' },
    { name: 'En attente', value: stats.completedLessons - stats.validatedLessons, fill: '#f59e0b' },
    { name: 'En retard', value: stats.delayedLessons, fill: '#ef4444' },
    { name: 'Planifiées', value: stats.totalLessons - stats.completedLessons, fill: '#6b7280' },
  ];

  // Group progressions by class for the table
  const progressionsByClass = progressions.reduce((acc: any, progression: any) => {
    const className = progression.class.name;
    if (!acc[className]) {
      acc[className] = {
        className,
        level: progression.class.level.name,
        teacher: `${progression.teacher.firstName} ${progression.teacher.lastName}`,
        total: 0,
        completed: 0,
        validated: 0,
        delayed: 0,
      };
    }
    acc[className].total++;
    if (progression.status === 'completed' || progression.status === 'validated') {
      acc[className].completed++;
    }
    if (progression.status === 'validated') {
      acc[className].validated++;
    }
    // This is a simplified check for delayed lessons
    if (progression.status === 'planned' && progression.lesson.plannedDate && new Date(progression.lesson.plannedDate) < new Date()) {
      acc[className].delayed++;
    }
    return acc;
  }, {});

  const classProgressions = Object.values(progressionsByClass) as any[];

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
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
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="teachers">Gestion Professeurs</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                {stats.completedLessons} sur {stats.totalLessons} leçons
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
                {stats.validatedLessons} validées sur {stats.completedLessons} effectuées
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
              <div className="text-2xl font-bold text-red-600">{stats.delayedLessons}</div>
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
                {Math.round(stats.totalActualHours)}h
              </div>
              <p className="text-xs text-gray-500 mt-2">
                sur {Math.round(stats.totalPlannedHours)}h prévues
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Progressions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={progressData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {progressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progression par Niveau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classProgressions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="className" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#22c55e" name="Effectuées" />
                    <Bar dataKey="validated" fill="#16a34a" name="Validées" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Class Progress Table */}
        <Card>
          <CardHeader>
            <CardTitle>Progression par Classe</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Classe</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Enseignant</TableHead>
                    <TableHead>Total Leçons</TableHead>
                    <TableHead>Effectuées</TableHead>
                    <TableHead>Validées</TableHead>
                    <TableHead>En Retard</TableHead>
                    <TableHead>Progression</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classProgressions.map((classData: any) => {
                    const progressPercent = classData.total > 0 
                      ? Math.round((classData.completed / classData.total) * 100)
                      : 0;
                    
                    return (
                      <TableRow key={classData.className} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{classData.className}</TableCell>
                        <TableCell>{classData.level}</TableCell>
                        <TableCell>{classData.teacher}</TableCell>
                        <TableCell>{classData.total}</TableCell>
                        <TableCell>{classData.completed}</TableCell>
                        <TableCell>{classData.validated}</TableCell>
                        <TableCell>
                          {classData.delayed > 0 ? (
                            <Badge variant="destructive">{classData.delayed}</Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {progressPercent}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {classProgressions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
