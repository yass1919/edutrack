import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Clock, Circle, AlertTriangle, Edit, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Lesson, Chapter, LessonProgression } from "@shared/schema";

interface LessonWithDetails extends Lesson {
  chapter: Chapter;
  progressions: LessonProgression[];
}

interface LessonTrackingTableProps {
  lessons: LessonWithDetails[];
  className: string;
  subject: string;
  onMarkCompleted: (lessonId: number, actualDate: string, actualDurationMinutes: number, notes?: string, sessionType?: string, chapterElements?: number[]) => void;
  onValidateProgression?: (progressionId: number) => void;
  userRole: string;
}

export function LessonTrackingTable({
  lessons,
  className,
  subject,
  onMarkCompleted,
  onValidateProgression,
  userRole,
}: LessonTrackingTableProps) {
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

  const filteredLessons = lessons.filter((lesson) => {
    if (trimesterFilter !== "all" && lesson.chapter.trimester !== parseInt(trimesterFilter)) {
      return false;
    }
    if (chapterFilter !== "all" && lesson.chapter.name !== chapterFilter) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (lesson: LessonWithDetails) => {
    const progression = lesson.progressions[0];
    
    if (!progression || progression.status === 'planned') {
      const isDelayed = lesson.plannedDate && new Date(lesson.plannedDate) < new Date();
      return (
        <Badge variant={isDelayed ? "destructive" : "secondary"} className="text-xs">
          {isDelayed ? (
            <>
              <AlertTriangle className="w-3 h-3 mr-1" />
              En retard
            </>
          ) : (
            <>
              <Circle className="w-3 h-3 mr-1" />
              Planifiée
            </>
          )}
        </Badge>
      );
    }

    if (progression.status === 'completed') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Effectuée
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

  const getSessionTypeLabel = (sessionType?: string) => {
    const types = {
      lesson: "Cours",
      exercises: "Exercices", 
      control: "Contrôle",
      revision: "Révision"
    };
    return types[sessionType as keyof typeof types] || "Cours";
  };

  const getSessionTypeBadge = (sessionType?: string) => {
    const variants = {
      lesson: "default",
      exercises: "secondary",
      control: "destructive", 
      revision: "outline"
    };
    return variants[sessionType as keyof typeof variants] || "default";
  };

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
              <p className="text-sm text-gray-500 mt-1">Année scolaire 2023-2024</p>
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
                          isDelayed ? 'bg-red-200' : 'bg-blue-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            isDelayed ? 'text-red-700' : 'text-blue-600'
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
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Affichage de {filteredLessons.length} leçon(s)
            </div>
          </div>
        </div>
      </CardContent>

      {/* Modal pour marquer une leçon */}
      <Dialog open={showLessonModal} onOpenChange={setShowLessonModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Marquer la leçon effectuée</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="space-y-6">
              {/* Informations de la leçon */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg">{selectedLesson.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedLesson.objectives}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Chapitre: {selectedLesson.chapter.name} • 
                  Durée prévue: {formatDuration(selectedLesson.plannedDurationMinutes)}
                </p>
              </div>

              {/* Formulaire */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modalDate">Date de réalisation *</Label>
                  <Input
                    id="modalDate"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="modalDuration">Durée réelle *</Label>
                  <Input
                    id="modalDuration"
                    type="text"
                    placeholder="ex: 1h30"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="modalSessionType">Type de séance *</Label>
                <Select value={editSessionType} onValueChange={setEditSessionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Cours</SelectItem>
                    <SelectItem value="exercises">Exercices</SelectItem>
                    <SelectItem value="control">Contrôle</SelectItem>
                    <SelectItem value="revision">Révision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Éléments de chapitre */}
              <div>
                <Label className="text-sm font-medium">Éléments du chapitre traités</Label>
                <div className="mt-2 border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {elementsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Chargement des éléments...</p>
                    </div>
                  ) : Array.isArray(chapterElements) && chapterElements.length > 0 ? (
                    chapterElements.map((element: any) => (
                      <div key={element.id} className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id={`element-${element.id}`}
                          checked={editChapterElements.includes(element.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditChapterElements([...editChapterElements, element.id]);
                            } else {
                              setEditChapterElements(editChapterElements.filter(id => id !== element.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`element-${element.id}`} className="text-sm font-medium cursor-pointer">
                            {element.title}
                          </Label>
                          {element.description && (
                            <p className="text-xs text-gray-500 mt-1">{element.description}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            Durée estimée: {formatDuration(element.estimatedDurationMinutes || 30)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        {Array.isArray(chapterElements) && chapterElements.length === 0 
                          ? "Aucun élément défini pour ce chapitre"
                          : `Aucun élément trouvé`
                        }
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Chapitre ID: {selectedLesson?.chapter.id} • Éléments: {Array.isArray(chapterElements) ? chapterElements.length : 0}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="modalNotes">Notes (optionnel)</Label>
                <Input
                  id="modalNotes"
                  placeholder="Commentaires sur la séance..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowLessonModal(false);
                    setSelectedLesson(null);
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedLesson) {
                      handleSave(selectedLesson);
                      setShowLessonModal(false);
                      setSelectedLesson(null);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Marquer effectuée
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
