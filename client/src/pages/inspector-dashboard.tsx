import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AuthUser } from "@/lib/auth";

interface InspectorDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function InspectorDashboard({ user, onLogout }: InspectorDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: progressions = [] } = useQuery({
    queryKey: ["/api/inspector/progressions"],
  });

  const validateMutation = useMutation({
    mutationFn: async (progressionId: number) => {
      return apiRequest("POST", `/api/inspector/progressions/${progressionId}/validate`);
    },
    onMutate: async (progressionId: number) => {
      // Annuler toutes les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: ["/api/inspector/progressions"] });
      
      // Sauvegarder l'état précédent
      const previousProgressions = queryClient.getQueryData(["/api/inspector/progressions"]);
      
      // Mise à jour optimistic
      queryClient.setQueryData(["/api/inspector/progressions"], (old: any) => {
        if (!old) return old;
        return old.map((progression: any) => 
          progression.id === progressionId 
            ? { ...progression, status: 'validated' }
            : progression
        );
      });
      
      return { previousProgressions };
    },
    onSuccess: () => {
      // Invalider toutes les requêtes liées aux progressions
      queryClient.invalidateQueries({ queryKey: ["/api/inspector/progressions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder"] });
      toast({
        title: "Progression validée",
        description: "La progression a été validée avec succès",
      });
    },
    onError: (err: any, progressionId, context) => {
      // Restaurer l'état précédent en cas d'erreur
      if (context?.previousProgressions) {
        queryClient.setQueryData(["/api/inspector/progressions"], context.previousProgressions);
      }
      
      toast({
        title: "Erreur",
        description: err.message || "Impossible de valider la progression",
        variant: "destructive",
      });
    },
  });

  const filteredProgressions = progressions.filter((progression: any) =>
    progression.lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    progression.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    progression.teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    progression.teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingValidations = progressions.filter((p: any) => p.status === 'completed');
  const validatedCount = progressions.filter((p: any) => p.status === 'validated').length;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            En attente de validation
          </Badge>
        );
      case 'validated':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Validée
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Validation des Progressions</h2>
              <p className="text-gray-500 mt-1">
                Vérifiez et validez les progressions pédagogiques des enseignants
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                En attente de validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingValidations.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Progressions à vérifier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Validées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {validatedCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Progressions validées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total des progressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {progressions.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Toutes les progressions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par leçon, classe ou enseignant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Progressions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Progressions Pédagogiques</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Leçon</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Enseignant</TableHead>
                    <TableHead>Date Effectuée</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProgressions.map((progression: any) => (
                    <TableRow key={progression.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {progression.lesson.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {progression.lesson.chapter.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {progression.class.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {progression.teacher.firstName} {progression.teacher.lastName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {progression.actualDate
                            ? format(new Date(progression.actualDate), 'dd/MM/yyyy', { locale: fr })
                            : '-'
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {progression.actualDurationMinutes
                            ? formatDuration(progression.actualDurationMinutes)
                            : '-'
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(progression.status)}
                      </TableCell>
                      <TableCell>
                        {progression.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => validateMutation.mutate(progression.id)}
                            disabled={validateMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valider
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredProgressions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune progression trouvée</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
