import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, HourglassIcon } from "lucide-react";

interface ProgressOverviewProps {
  classes: Array<{
    id: number;
    name: string;
    subject: string;
    completedLessons: number;
    totalLessons: number;
  }>;
  stats: {
    totalLessons: number;
    completedLessons: number;
    validatedLessons: number;
    delayedLessons: number;
    totalPlannedHours: number;
    totalActualHours: number;
  };
  selectedClassId?: number;
  onClassSelect: (classId: number) => void;
}

export function ProgressOverview({
  classes,
  stats,
  selectedClassId,
  onClassSelect,
}: ProgressOverviewProps) {
  const progressPercentage = stats.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Classes Assignées</h3>
            <div className="space-y-3">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  onClick={() => onClassSelect(classItem.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedClassId === classItem.id
                      ? 'bg-primary bg-opacity-10 border-primary border-opacity-20'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{classItem.name}</p>
                    <p className="text-sm text-gray-500">{classItem.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      selectedClassId === classItem.id ? 'text-primary' : 'text-gray-900'
                    }`}>
                      {classItem.completedLessons}/{classItem.totalLessons}
                    </p>
                    <p className="text-xs text-gray-500">leçons</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Progression Globale</p>
                  <p className="text-2xl font-bold text-gray-900">{progressPercentage}%</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Leçons en Retard</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.delayedLessons}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">À rattraper cette semaine</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Heures Effectuées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.totalActualHours)}h
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <HourglassIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                sur {Math.round(stats.totalPlannedHours)}h prévues
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
