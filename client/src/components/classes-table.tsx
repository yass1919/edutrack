import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, School, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClassWithLevel {
  id: number;
  name: string;
  levelId: number;
  academicYearId: number;
  floor: string | null;
  capacity: number | null;
  interactiveBoard: boolean;
  whiteboard: boolean;
  projector: boolean;
  camera: boolean;
  delegate: string | null;
  isActive: boolean;
  level: {
    id: number;
    name: string;
    code: string;
    category: string;
  };
}

interface Level {
  id: number;
  name: string;
  code: string;
  category: string;
}

const getCategoryColor = (category: string): string => {
  switch (category) {
    case "maternelle":
      return "bg-green-100 text-green-800";
    case "primaire":
      return "bg-blue-100 text-blue-800";
    case "college":
      return "bg-orange-100 text-orange-800";
    case "lycee":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassWithLevel | null;
  levels: Level[];
  onSave: (data: any) => void;
}

function ClassModal({ isOpen, onClose, classData, levels, onSave }: ClassModalProps) {
  const [formData, setFormData] = useState({
    name: classData?.name || "",
    levelId: classData?.levelId || 0,
    floor: classData?.floor || "",
    capacity: classData?.capacity || 0,
    interactiveBoard: classData?.interactiveBoard || false,
    whiteboard: classData?.whiteboard || false,
    projector: classData?.projector || false,
    camera: classData?.camera || false,
    delegate: classData?.delegate || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.levelId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    onSave({
      ...formData,
      levelId: parseInt(formData.levelId.toString()),
      capacity: formData.capacity > 0 ? formData.capacity : null,
      floor: formData.floor || null,
      delegate: formData.delegate || null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {classData ? "Modifier la classe" : "Nouvelle classe"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom de la classe *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: 1AC A"
                required
              />
            </div>
            <div>
              <Label htmlFor="levelId">Niveau *</Label>
              <Select value={formData.levelId.toString()} onValueChange={(value) => setFormData({ ...formData, levelId: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name} - {level.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="floor">Étage</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="Ex: RDC, 1er, 2ème"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacité</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                placeholder="Nombre d'élèves"
                min="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="delegate">Délégué</Label>
            <Input
              id="delegate"
              value={formData.delegate}
              onChange={(e) => setFormData({ ...formData, delegate: e.target.value })}
              placeholder="Nom du délégué de classe"
            />
          </div>

          <div className="space-y-3">
            <Label>Équipements</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="interactiveBoard"
                  checked={formData.interactiveBoard}
                  onCheckedChange={(checked) => setFormData({ ...formData, interactiveBoard: checked })}
                />
                <Label htmlFor="interactiveBoard">Tableau interactif</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="whiteboard"
                  checked={formData.whiteboard}
                  onCheckedChange={(checked) => setFormData({ ...formData, whiteboard: checked })}
                />
                <Label htmlFor="whiteboard">Tableau blanc</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="projector"
                  checked={formData.projector}
                  onCheckedChange={(checked) => setFormData({ ...formData, projector: checked })}
                />
                <Label htmlFor="projector">Vidéoprojecteur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="camera"
                  checked={formData.camera}
                  onCheckedChange={(checked) => setFormData({ ...formData, camera: checked })}
                />
                <Label htmlFor="camera">Caméra</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {classData ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassesTable() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithLevel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ClassWithLevel | null>(null);
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["/api/admin/classes"],
  });

  const { data: levels = [] } = useQuery({
    queryKey: ["/api/admin/levels"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/classes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      setShowCreateModal(false);
      toast({
        title: "Succès",
        description: "Classe créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/classes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      setEditingClass(null);
      toast({
        title: "Succès",
        description: "Classe mise à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/classes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      setDeleteConfirm(null);
      toast({
        title: "Succès",
        description: "Classe supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: any) => {
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data });
    }
  };

  const handleDelete = (classData: ClassWithLevel) => {
    setDeleteConfirm(classData);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  if (classesLoading) {
    return <div>Chargement des classes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion des classes</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle classe
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Niveau</TableHead>
            <TableHead>Étage</TableHead>
            <TableHead>Capacité</TableHead>
            <TableHead>Équipements</TableHead>
            <TableHead>Délégué</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((classData: ClassWithLevel) => (
            <TableRow key={classData.id}>
              <TableCell className="font-medium">{classData.name}</TableCell>
              <TableCell>
                <Badge className={getCategoryColor(classData.level.category)}>
                  {classData.level.name}
                </Badge>
              </TableCell>
              <TableCell>{classData.floor || "-"}</TableCell>
              <TableCell>{classData.capacity || "-"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {classData.interactiveBoard && (
                    <Badge variant="outline" className="text-xs">
                      TBI
                    </Badge>
                  )}
                  {classData.whiteboard && (
                    <Badge variant="outline" className="text-xs">
                      TB
                    </Badge>
                  )}
                  {classData.projector && (
                    <Badge variant="outline" className="text-xs">
                      VP
                    </Badge>
                  )}
                  {classData.camera && (
                    <Badge variant="outline" className="text-xs">
                      CAM
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{classData.delegate || "-"}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingClass(classData)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(classData)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        classData={null}
        levels={levels}
        onSave={handleCreate}
      />

      <ClassModal
        isOpen={!!editingClass}
        onClose={() => setEditingClass(null)}
        classData={editingClass}
        levels={levels}
        onSave={handleUpdate}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer la classe "{deleteConfirm?.name}" ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}