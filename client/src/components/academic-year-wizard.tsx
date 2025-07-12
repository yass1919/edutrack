import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Copy, Plus, Archive, Users, BookOpen, GraduationCap } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AcademicYearWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newYear: string) => void;
  currentYear: string;
}

interface CopyOptions {
  levels: boolean;
  teachers: boolean;
  classes: boolean;
  lessons: boolean;
  inspectorAssignments: boolean;
  sgAssignments: boolean;
}

export function AcademicYearWizard({ open, onOpenChange, onSuccess, currentYear }: AcademicYearWizardProps) {
  const [step, setStep] = useState(1);
  const [newYearName, setNewYearName] = useState('');
  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    levels: true,
    teachers: true,
    classes: true,
    lessons: false,
    inspectorAssignments: true,
    sgAssignments: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Générer automatiquement la nouvelle année
  React.useEffect(() => {
    if (currentYear) {
      const [startYear] = currentYear.split('-').map(Number);
      const nextYear = `${startYear + 1}-${startYear + 2}`;
      setNewYearName(nextYear);
    }
  }, [currentYear]);

  const handleCopyOptionChange = (option: keyof CopyOptions) => {
    setCopyOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleCreateYear = async () => {
    if (!newYearName) {
      toast({
        title: "Erreur",
        description: "Le nom de l'année scolaire est requis",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest('/api/admin/create-academic-year', {
        method: 'POST',
        body: {
          yearName: newYearName,
          copyOptions: copyOptions
        }
      });

      toast({
        title: "Année scolaire créée",
        description: `L'année ${newYearName} a été créée avec succès.`,
      });

      onSuccess(newYearName);
      onOpenChange(false);
      setStep(1);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'année scolaire",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyOptionDescriptions = {
    levels: "Niveaux scolaires (1AC, 2AC, 3AC, etc.)",
    teachers: "Professeurs actifs (sans leurs assignations)",
    classes: "Classes existantes (structure identique)",
    lessons: "Leçons et programmes pédagogiques",
    inspectorAssignments: "Assignations des inspecteurs",
    sgAssignments: "Assignations des surveillants généraux"
  };

  const copyOptionIcons = {
    levels: GraduationCap,
    teachers: Users,
    classes: BookOpen,
    lessons: Copy,
    inspectorAssignments: Users,
    sgAssignments: Users
  };

  if (step === 1) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Créer une nouvelle année scolaire
            </DialogTitle>
            <DialogDescription>
              Assistant de création d'année scolaire avec options de copie intelligente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration de l'année</CardTitle>
                <CardDescription>
                  Définissez le nom de la nouvelle année scolaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yearName">Nom de l'année scolaire</Label>
                  <Input
                    id="yearName"
                    value={newYearName}
                    onChange={(e) => setNewYearName(e.target.value)}
                    placeholder="2025-2026"
                    className="text-lg font-mono"
                  />
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    L'année sera créée avec le statut "inactive" jusqu'à activation manuelle
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={() => setStep(2)}>
                Suivant: Options de copie
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 2) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Options de copie pour {newYearName}
            </DialogTitle>
            <DialogDescription>
              Sélectionnez les éléments à copier depuis l'année {currentYear}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(copyOptions).map(([key, checked]) => {
                const Icon = copyOptionIcons[key as keyof CopyOptions];
                return (
                  <Card key={key} className={`cursor-pointer transition-colors ${checked ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={key}
                          checked={checked}
                          onCheckedChange={() => handleCopyOptionChange(key as keyof CopyOptions)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <Label htmlFor={key} className="font-medium cursor-pointer">
                              {copyOptionDescriptions[key as keyof CopyOptions]}
                            </Label>
                          </div>
                          <p className="text-sm text-gray-500">
                            {key === 'levels' && "Structure des niveaux conservée"}
                            {key === 'teachers' && "Utilisateurs actifs uniquement"}
                            {key === 'classes' && "Classes vides, prêtes pour nouveaux élèves"}
                            {key === 'lessons' && "Contenu pédagogique complet"}
                            {key === 'inspectorAssignments' && "Affectations par matière"}
                            {key === 'sgAssignments' && "Affectations par cycle"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Separator />

            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Archive className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">Archivage automatique</span>
              </div>
              <p className="text-sm text-amber-700">
                L'année {currentYear} sera automatiquement archivée (statut "inactive") 
                après création de la nouvelle année.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Précédent
              </Button>
              <Button onClick={handleCreateYear} disabled={isCreating}>
                {isCreating ? "Création en cours..." : "Créer l'année scolaire"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}