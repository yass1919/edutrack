import { GraduationCap, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import type { AuthUser } from "@/lib/auth";
import { logout } from "@/lib/auth";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAcademicYear } from "@/lib/academic-year-context";
import { useEffect } from "react";

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const queryClient = useQueryClient();
  const { selectedYear, setSelectedYear, availableYears, setAvailableYears } = useAcademicYear();
  
  // Récupérer les années disponibles
  const { data: academicYears } = useQuery<string[]>({
    queryKey: ['/api/academic-years'],
  });

  // Mettre à jour les années disponibles quand les données arrivent
  useEffect(() => {
    if (academicYears && academicYears.length > 0) {
      setAvailableYears(academicYears);
    }
  }, [academicYears, setAvailableYears]);

  const handleLogout = async () => {
    await logout();
    // Vider tout le cache pour éviter que les données d'un utilisateur 
    // s'affichent pour un autre utilisateur
    queryClient.clear();
    onLogout();
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    // Invalider tout le cache pour recharger les données avec la nouvelle année
    queryClient.invalidateQueries();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'Professeur';
      case 'inspector':
        return 'Inspecteur';
      case 'founder':
        return 'Fondateur';
      default:
        return role;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="text-primary text-2xl" />
              <h1 className="text-xl font-semibold text-gray-900">EduTrack</h1>
            </div>
            

          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleDisplay(user.role)}
                    </p>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
