import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";

interface LessonWithDetails {
  id: number;
  title: string;
  objectives: string;
  plannedDate: string | null;
  plannedDurationMinutes: number;
  chapterId: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  chapter: {
    id: number;
    name: string;
    subject: {
      id: number;
      name: string;
      code: string;
    };
    level: {
      id: number;
      name: string;
      code: string;
      category: string;
    };
  };
}

interface LessonsTableProps {
  className?: string;
}

export function LessonsTable({ className }: LessonsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    title: "",
    chapter: "",
    subject: "",
    level: ""
  });

  const { data: lessons, isLoading, error } = useQuery({
    queryKey: ["/api/admin/lessons"],
  });

  const filteredLessons = useMemo(() => {
    if (!lessons || !Array.isArray(lessons)) return [];
    
    return (lessons as LessonWithDetails[]).filter((lesson: LessonWithDetails) => {
      const matchesTitle = lesson.title.toLowerCase().includes(filters.title.toLowerCase());
      const matchesChapter = lesson.chapter.name.toLowerCase().includes(filters.chapter.toLowerCase());
      const matchesSubject = lesson.chapter.subject.name.toLowerCase().includes(filters.subject.toLowerCase());
      const matchesLevel = lesson.chapter.level.name.toLowerCase().includes(filters.level.toLowerCase());
      
      return matchesTitle && matchesChapter && matchesSubject && matchesLevel;
    });
  }, [lessons, filters]);

  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLessons = filteredLessons.slice(startIndex, endIndex);

  const resetFilters = () => {
    setFilters({
      title: "",
      chapter: "",
      subject: "",
      level: ""
    });
    setCurrentPage(1);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non planifiée";
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Erreur lors du chargement des leçons
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <label className="text-sm font-medium">Titre</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par titre..."
              value={filters.title}
              onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Chapitre</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par chapitre..."
              value={filters.chapter}
              onChange={(e) => setFilters(prev => ({ ...prev, chapter: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Matière</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par matière..."
              value={filters.subject}
              onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Niveau</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par niveau..."
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="md:col-span-4 flex gap-2">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Réinitialiser les filtres
          </Button>
          <div className="text-sm text-gray-600 flex items-center">
            {filteredLessons.length} leçon{filteredLessons.length !== 1 ? 's' : ''} trouvée{filteredLessons.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Contrôles de pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Lignes par page :</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Titre</TableHead>
              <TableHead>Chapitre</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Durée prévue</TableHead>
              <TableHead>Date planifiée</TableHead>
              <TableHead>Objectifs</TableHead>
              <TableHead>Ordre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentLessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Aucune leçon trouvée
                </TableCell>
              </TableRow>
            ) : (
              currentLessons.map((lesson: LessonWithDetails) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">{lesson.title}</TableCell>
                  <TableCell>{lesson.chapter.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {lesson.chapter.subject.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      lesson.chapter.level.category === 'collège' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }>
                      {lesson.chapter.level.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDuration(lesson.plannedDurationMinutes)}</TableCell>
                  <TableCell>{formatDate(lesson.plannedDate)}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate" title={lesson.objectives}>
                      {lesson.objectives || "Aucun objectif défini"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      #{lesson.orderIndex}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Informations de pagination */}
      <div className="text-sm text-gray-600 text-center">
        Affichage de {startIndex + 1} à {Math.min(endIndex, filteredLessons.length)} sur {filteredLessons.length} leçons
      </div>
    </div>
  );
}