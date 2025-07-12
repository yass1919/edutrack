import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lesson, Chapter } from "@shared/schema";

interface LessonWithChapter extends Lesson {
  chapter: Chapter;
  progressions: any[];
}

interface ClassOption {
  id: number;
  name: string;
  level: string;
  subject: string;
  subjectId: number;
}

interface QuickLessonModalProps {
  open: boolean;
  onClose: () => void;
  classes: ClassOption[];
  onSubmit: (classId: number, lessonId: number, actualDate: string, actualDurationMinutes: number, notes?: string, sessionType?: string, chapterElements?: number[]) => void;
}

export function QuickLessonModal({ open, onClose, classes, onSubmit }: QuickLessonModalProps) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [sessionType, setSessionType] = useState("lesson");
  const [chapterElements, setChapterElements] = useState<number[]>([]);

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fonction pour valider la durée en temps réel
  const handleDurationChange = (value: string) => {
    setDuration(value);
    
    // Réinitialiser l'erreur de durée si elle existe
    if (errors.duration) {
      const newErrors = { ...errors };
      delete newErrors.duration;
      setErrors(newErrors);
    }
    
    // Validation en temps réel si une leçon est sélectionnée
    if (selectedLessonId && value) {
      const selectedLesson = lessons.find(l => l.id === parseInt(selectedLessonId));
      if (selectedLesson) {
        const durationErrors = validateDuration(value, selectedLesson.plannedDurationMinutes);
        if (Object.keys(durationErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...durationErrors }));
        }
      }
    }
  };

  // Debug log
  console.log("Classes reçues dans la modal:", classes);

  // Fetch lessons when class is selected
  const selectedClass = classes?.find(c => c.id === parseInt(selectedClassId || "0"));
  const { data: fetchedLessons = [] } = useQuery({
    queryKey: ["/api/teacher/lessons", selectedClassId ? parseInt(selectedClassId) : null, selectedClass?.subjectId],
    enabled: selectedClassId !== "" && selectedClass !== undefined,
  });

  // Utiliser directement les données de la requête
  const lessons = fetchedLessons as LessonWithChapter[] || [];

  // Récupérer les éléments de chapitre pour la leçon sélectionnée
  const selectedLesson = lessons.find(l => l.id === parseInt(selectedLessonId || "0"));
  const { data: availableElements = [], isLoading: elementsLoading } = useQuery<any[]>({
    queryKey: [`/api/teacher/chapter-elements/${selectedLesson?.chapter.id}`],
    enabled: !!selectedLesson?.chapter.id,
  });

  // Fonction de validation de la durée
  const validateDuration = (durationStr: string, plannedDurationMinutes: number) => {
    const newErrors: {[key: string]: string} = {};
    
    // Vérifier si c'est un nombre valide
    if (isNaN(Number(durationStr)) || durationStr.trim() === "") {
      newErrors.duration = "Veuillez saisir un nombre valide, pas du texte";
      return newErrors;
    }
    
    const actualMinutes = parseInt(durationStr);
    
    // Vérifier si le nombre est positif
    if (actualMinutes <= 0) {
      newErrors.duration = "La durée doit être supérieure à 0 minutes";
      return newErrors;
    }
    
    // Vérifier la limite de 2h (120 minutes)
    if (actualMinutes > 120) {
      newErrors.duration = "La durée ne doit pas dépasser 2 heures (120 minutes)";
      return newErrors;
    }
    
    // Vérifier que la durée ne dépasse pas la durée prévue
    if (actualMinutes > plannedDurationMinutes) {
      newErrors.duration = `La durée ne doit pas dépasser la durée prévue (${plannedDurationMinutes} minutes)`;
      return newErrors;
    }
    
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    const newErrors: {[key: string]: string} = {};
    
    // Validation des champs obligatoires
    if (!selectedClassId) newErrors.class = "Veuillez sélectionner une classe";
    if (!selectedLessonId) newErrors.lesson = "Veuillez sélectionner une leçon";
    if (!actualDate) newErrors.date = "Veuillez saisir une date";
    if (!duration) newErrors.duration = "Veuillez saisir une durée";
    
    // Validation de la durée si elle est fournie
    if (duration && selectedLessonId) {
      const selectedLesson = lessons.find(l => l.id === parseInt(selectedLessonId));
      if (selectedLesson) {
        const durationErrors = validateDuration(duration, selectedLesson.plannedDurationMinutes);
        Object.assign(newErrors, durationErrors);
      }
    }
    
    // Si des erreurs existent, les afficher et arrêter
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const totalMinutes = parseInt(duration);

    onSubmit(
      parseInt(selectedClassId), 
      parseInt(selectedLessonId), 
      actualDate, 
      totalMinutes, 
      notes || undefined, 
      sessionType, 
      chapterElements.length > 0 ? chapterElements : undefined
    );
    
    // Reset form
    setSelectedClassId("");
    setSelectedLessonId("");
    setActualDate("");
    setDuration("");
    setNotes("");
    setSessionType("lesson");
    setChapterElements([]);
    setErrors({});
    onClose();
  };

  const uncompletedLessons = lessons.filter(lesson => 
    !lesson.progressions?.some(p => p.status === 'completed' || p.status === 'validated')
  );

  console.log("Selected class:", selectedClassId);
  console.log("Available lessons:", lessons.length);
  console.log("Uncompleted lessons:", uncompletedLessons.length);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Marquer une leçon comme effectuée</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="class" className="text-sm font-medium">
              Classe et Matière
            </Label>
            <Select value={selectedClassId} onValueChange={(value) => {
              setSelectedClassId(value);
              // Réinitialiser les erreurs liées à la classe
              const newErrors = { ...errors };
              delete newErrors.class;
              delete newErrors.lesson;
              setErrors(newErrors);
              // Réinitialiser la leçon sélectionnée
              setSelectedLessonId("");
            }}>
              <SelectTrigger className={`mt-2 ${errors.class ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Sélectionner une classe..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classOption) => (
                  <SelectItem key={classOption.id} value={classOption.id.toString()}>
                    {classOption.name} ({classOption.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.class && <p className="text-red-500 text-sm mt-1">{errors.class}</p>}
          </div>

          {selectedClassId && (
            <div>
              <Label htmlFor="lesson" className="text-sm font-medium">
                Leçon
              </Label>
              <Select value={selectedLessonId} onValueChange={(value) => {
                setSelectedLessonId(value);
                // Réinitialiser les erreurs liées à la leçon
                const newErrors = { ...errors };
                delete newErrors.lesson;
                setErrors(newErrors);
              }}>
                <SelectTrigger className={`mt-2 ${errors.lesson ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Sélectionner une leçon..." />
                </SelectTrigger>
                <SelectContent>
                  {uncompletedLessons.map((lesson: any) => (
                    <SelectItem key={lesson.id} value={lesson.id.toString()}>
                      {lesson.title} - {lesson.chapter.name} ({lesson.plannedDurationMinutes}min prévues)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.lesson && <p className="text-red-500 text-sm mt-1">{errors.lesson}</p>}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="actualDate" className="text-sm font-medium">
                Date effectuée
              </Label>
              <Input
                id="actualDate"
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
                className={`mt-2 ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>
            <div>
              <Label htmlFor="duration" className="text-sm font-medium">
                Durée réelle (en minutes)
                {selectedLesson && (
                  <span className="text-xs text-gray-500 ml-2">
                    Prévue: {selectedLesson.plannedDurationMinutes}min, Max: 120min
                  </span>
                )}
              </Label>
              <Input
                id="duration"
                type="number"
                placeholder="ex: 90"
                value={duration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className={`mt-2 ${errors.duration ? 'border-red-500' : ''}`}
                min="1"
                max="120"
              />
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="sessionType" className="text-sm font-medium">
              Type de séance
            </Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger className="mt-2">
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



          {selectedLesson && (
            <div>
              <Label className="text-sm font-medium">Éléments du chapitre traités</Label>
              <div className="mt-2 border rounded-lg p-3 max-h-32 overflow-y-auto">
                {elementsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Chargement des éléments...</p>
                  </div>
                ) : Array.isArray(availableElements) && availableElements.length > 0 ? (
                  availableElements.map((element: any) => (
                    <div key={element.id} className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id={`element-${element.id}`}
                        checked={chapterElements.includes(element.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setChapterElements([...chapterElements, element.id]);
                          } else {
                            setChapterElements(chapterElements.filter(id => id !== element.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`element-${element.id}`} className="text-sm font-medium cursor-pointer">
                          {element.title}
                        </Label>
                        {element.description && (
                          <p className="text-xs text-gray-500 mt-1">{element.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Durée estimée: {Math.floor((element.estimatedDurationMinutes || 30) / 60)}h{((element.estimatedDurationMinutes || 30) % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      Aucun élément défini pour ce chapitre
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (optionnel)
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Commentaires sur la leçon..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={!selectedLessonId || !actualDate || !duration}
            >
              Marquer comme effectuée
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
