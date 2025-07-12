import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const anomalyReportSchema = z.object({
  type: z.enum(['content', 'hours', 'schedule', 'incident']),
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  recipients: z.array(z.enum(['fondateur', 'sg', 'inspecteur'])).min(1, "Sélectionnez au moins un destinataire"),
  lessonId: z.number().optional(),
  classId: z.number().optional(),
  subjectId: z.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

type AnomalyReportData = z.infer<typeof anomalyReportSchema>;

interface AnomalyReportModalProps {
  lessonId?: number;
  classId?: number;
  subjectId?: number;
  children: React.ReactNode;
}

export function AnomalyReportModal({ 
  lessonId, 
  classId, 
  subjectId, 
  children 
}: AnomalyReportModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Récupérer les classes selon le rôle de l'utilisateur
  const { data: teacherAssignments = [] } = useQuery({
    queryKey: ["/api/teacher/assignments"],
    enabled: user?.role === 'teacher',
  });

  const { data: inspectorTeachers = [] } = useQuery({
    queryKey: ["/api/inspector/teachers"],
    enabled: user?.role === 'inspector',
  });

  // Récupérer les leçons pour le select
  const { data: lessons = [] } = useQuery({
    queryKey: ["/api/teacher/lessons", classId, subjectId],
    enabled: !!classId && !!subjectId,
  });

  // Préparer la liste des classes selon le rôle
  const availableClasses = user?.role === 'teacher' 
    ? teacherAssignments 
    : user?.role === 'inspector' 
      ? inspectorTeachers.flatMap((teacher: any) => teacher.assignments || [])
      : [];

  // Préparer les destinataires selon le rôle
  const getAvailableRecipients = () => {
    const baseRecipients = [
      { value: 'fondateur', label: 'Fondateur' },
      { value: 'sg', label: 'Surveillant Général' },
    ];

    if (user?.role === 'teacher') {
      baseRecipients.push({ value: 'inspecteur', label: 'Inspecteur' });
    }

    return baseRecipients;
  };

  const form = useForm<AnomalyReportData>({
    resolver: zodResolver(anomalyReportSchema),
    defaultValues: {
      type: 'content',
      priority: 'normal',
      recipients: user?.role === 'teacher' ? ['fondateur'] : ['fondateur', 'sg'],
      lessonId,
      classId,
      subjectId,
    },
  });

  const createAnomalyMutation = useMutation({
    mutationFn: async (data: AnomalyReportData) => {
      return apiRequest("POST", "/api/anomaly-reports", data);
    },
    onSuccess: () => {
      toast({
        title: "Signalement envoyé",
        description: "Votre signalement de problème a été transmis avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/anomaly-reports"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le signalement",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AnomalyReportData) => {
    console.log("Données du formulaire à soumettre:", data);
    createAnomalyMutation.mutate(data);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'content': return 'Contenu du programme';
      case 'hours': return 'Volume horaire';
      case 'schedule': return 'Planning/Dates';
      case 'incident': return 'Incident divers';
      default: return type;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Faible';
      case 'normal': return 'Normal';
      case 'high': return 'Élevé';
      case 'urgent': return 'Urgent';
      default: return priority;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Signaler un problème
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de problème</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="content">Contenu du programme</SelectItem>
                        <SelectItem value="hours">Volume horaire</SelectItem>
                        <SelectItem value="schedule">Planning/Dates</SelectItem>
                        <SelectItem value="incident">Incident divers</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la priorité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Élevé</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!classId && availableClasses.length > 0 && (
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classe (optionnel)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une classe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableClasses.map((assignment: any) => (
                          <SelectItem key={assignment.class.id} value={assignment.class.id.toString()}>
                            {assignment.class.name} - {assignment.subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du signalement</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Chapitre manquant dans le programme officiel"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinataires</FormLabel>
                  <FormControl>
                    <div className="flex flex-col space-y-2">
                      {getAvailableRecipients().map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.value}
                            checked={field.value?.includes(option.value as 'fondateur' | 'sg' | 'inspecteur') || false}
                            onCheckedChange={(checked) => {
                              const currentValue = field.value || [];
                              if (checked) {
                                field.onChange([...currentValue, option.value as 'fondateur' | 'sg' | 'inspecteur']);
                              } else {
                                field.onChange(currentValue.filter(v => v !== option.value));
                              }
                            }}
                          />
                          <label
                            htmlFor={option.value}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description détaillée</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez précisément le problème constaté, son impact sur l'enseignement et les solutions que vous proposez..."
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createAnomalyMutation.isPending}
              >
                {createAnomalyMutation.isPending ? "Envoi..." : "Envoyer le signalement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}