import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Clock, AlertTriangle, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Lesson, Chapter, LessonProgression } from "@shared/schema";

interface LessonWithDetails extends Lesson {
  chapter: Chapter;
  progressions: LessonProgression[];
}

interface LessonTrackingTableReadonlyProps {
  lessons: LessonWithDetails[];
  className: string;
  subject: string;
}

export function LessonTrackingTableReadonly({
  lessons,
  className,
  subject,
}: LessonTrackingTableReadonlyProps) {
  const [trimesterFilter, setTrimesterFilter] = useState<string>("all");
  const [chapterFilter, setChapterFilter] = useState<string>("all");

  // Créer des requêtes pour charger les éléments de chapitre avec React Query
  const allChapterIds = Array.from(new Set(lessons.map(l => l.chapter.id)));
  
  // Stocker les éléments de chapitre dans un objet
  const allChapterElements: Record<number, any[]> = {};
  
  // Utiliser React Query pour chaque chapitre (gestion automatique de l'auth)
  allChapterIds.forEach((chapterId) => {
    const { data: elements = [] } = useQuery<any[]>({
      queryKey: [`/api/teacher/chapter-elements/${chapterId}`],
      enabled: !!chapterId,
      staleTime: 5 * 60 * 1000, // Cache 5 minutes
    });
    allChapterElements[chapterId] = elements;
  });

  // Fonction pour obtenir les détails des éléments de chapitre
  const getChapterElementDetails = (chapterId: number, elementIds: number[]) => {
    const chapterElements = allChapterElements[chapterId] || [];
    return elementIds.map(id => {
      const element = chapterElements.find(el => el.id === id);
      return element || { 
        id, 
        title: `Élément de chapitre`, 
        description: `Contenu non disponible (ID: ${id})` 
      };
    });
  };

  const getSessionTypeLabel = (sessionType: string | undefined) => {
    switch (sessionType) {
      case 'lesson': return 'Cours';
      case 'exercises': return 'Exercices';
      case 'control': return 'Contrôle';
      case 'revision': return 'Révision';
      default: return 'Non défini';
    }
  };

  const getSessionTypeBadge = (sessionType: string | undefined) => {
    switch (sessionType) {
      case 'lesson': return 'default';
      case 'exercises': return 'secondary';
      case 'control': return 'destructive';
      case 'revision': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadge = (lesson: LessonWithDetails) => {
    const progression = lesson.progressions[0];
    
    if (!progression) {
      return (
        <Badge variant="outline" className="text-xs">
          <Circle className="w-3 h-3 mr-1" />
          Non effectuée
        </Badge>
      );
    }

    if (progression.status === 'validated') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Validée
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs">
        <Clock className="w-3 h-3 mr-1" />
        En attente
      </Badge>
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const calculateReliquat = (plannedMinutes: number, actualMinutes?: number) => {
    if (!actualMinutes) return formatDuration(plannedMinutes);
    const reliquat = plannedMinutes - actualMinutes;
    const isNegative = reliquat < 0;
    const absoluteReliquat = Math.abs(reliquat);
    const formatted = formatDuration(absoluteReliquat);
    return isNegative ? `-${formatted}` : `+${formatted}`;
  };

  // Filtrer les leçons
  const filteredLessons = lessons.filter(lesson => {
    if (trimesterFilter !== "all" && lesson.chapter.trimester.toString() !== trimesterFilter) {
      return false;
    }
    if (chapterFilter !== "all" && lesson.chapter.name !== chapterFilter) {
      return false;
    }
    return true;
  });

  // Obtenir les chapitres uniques pour le filtre
  const uniqueChapters = Array.from(new Set(lessons.map(l => l.chapter.name)));

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Progression académique
              </h3>
              <p className="text-sm text-gray-500 mt-1">Année scolaire 2024-2025</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Période:</span>
                <Select value={trimesterFilter} onValueChange={setTrimesterFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="1">Trimestre 1</SelectItem>
                    <SelectItem value="2">Trimestre 2</SelectItem>
                    <SelectItem value="3">Trimestre 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Chapitre:</span>
                <Select value={chapterFilter} onValueChange={setChapterFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les chapitres</SelectItem>
                    {uniqueChapters.map((chapter) => (
                      <SelectItem key={chapter} value={chapter}>
                        {chapter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-40">Chapitre</TableHead>
                <TableHead className="w-48">Leçon</TableHead>
                <TableHead className="min-w-[300px]">Éléments Traités</TableHead>
                <TableHead className="w-32">Date Prévue</TableHead>
                <TableHead className="w-24">Durée Prévue</TableHead>
                <TableHead className="w-32">Type de Séance</TableHead>
                <TableHead className="w-32">Statut</TableHead>
                <TableHead className="w-32">Date Effectuée</TableHead>
                <TableHead className="w-24">Durée Réelle</TableHead>
                <TableHead className="w-24">Reliquat</TableHead>
                <TableHead className="w-32">Validation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLessons.map((lesson, index) => {
                const progression = lesson.progressions[0];
                const isCompleted = progression && (progression.status === 'completed' || progression.status === 'validated');
                const isDelayed = lesson.plannedDate && 
                  (!progression || progression.status === 'planned') && 
                  new Date(lesson.plannedDate) < new Date();

                return (
                  <TableRow 
                    key={lesson.id} 
                    className={`${
                      isCompleted ? 'bg-green-50 hover:bg-green-100' : 
                      isDelayed ? 'bg-red-50 hover:bg-red-100' : 
                      'hover:bg-gray-50'
                    }`}
                  >
                    <TableCell>
                      <span className="text-sm text-gray-600 font-medium">{lesson.chapter.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                          isDelayed ? 'bg-red-200' : isCompleted ? 'bg-green-200' : 'bg-blue-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            isDelayed ? 'text-red-700' : isCompleted ? 'text-green-700' : 'text-blue-600'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[300px]">
                      {progression?.chapterElements && progression.chapterElements !== 'null' ? (
                        <div className="text-xs w-full">
                          {(() => {
                            const elementIds = JSON.parse(progression.chapterElements);
                            const elementDetails = getChapterElementDetails(lesson.chapter.id, elementIds);
                            
                            return (
                              <div className="space-y-1">
                                <span className="text-gray-600 font-medium block">
                                  {elementIds.length} élément{elementIds.length > 1 ? 's' : ''} traité{elementIds.length > 1 ? 's' : ''}
                                </span>
                                <div className="space-y-1">
                                  {elementDetails.slice(0, 3).map((element: any) => (
                                    <div key={element.id} className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1.5 mb-1">
                                      <div className="font-medium text-blue-900 text-xs leading-tight">
                                        {element.title}
                                      </div>
                                      {element.description && (
                                        <div className="text-blue-700 text-xs opacity-75 mt-0.5 leading-tight">
                                          {element.description.length > 80 
                                            ? `${element.description.substring(0, 80)}...` 
                                            : element.description
                                          }
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {elementDetails.length > 3 && (
                                    <div className="text-center">
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        +{elementDetails.length - 3} autre{elementDetails.length - 3 > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Aucun élément traité</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${isDelayed ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {lesson.plannedDate ? format(new Date(lesson.plannedDate), 'dd/MM/yyyy', { locale: fr }) : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {formatDuration(lesson.plannedDurationMinutes)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSessionTypeBadge(progression?.sessionType || undefined) as any} className="text-xs">
                        {getSessionTypeLabel(progression?.sessionType || undefined)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lesson)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {progression?.actualDate 
                          ? format(new Date(progression.actualDate), 'dd/MM/yyyy', { locale: fr })
                          : '-'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {progression?.actualDurationMinutes 
                          ? formatDuration(progression.actualDurationMinutes)
                          : '-'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      {progression?.actualDurationMinutes ? (
                        <span className={`text-sm font-medium ${
                          calculateReliquat(lesson.plannedDurationMinutes, progression.actualDurationMinutes).startsWith('-') 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {calculateReliquat(lesson.plannedDurationMinutes, progression.actualDurationMinutes)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {progression?.status === 'validated' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validée
                        </Badge>
                      ) : progression?.status === 'completed' ? (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          En attente
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          N/A
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Affichage de {filteredLessons.length} leçon(s)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}