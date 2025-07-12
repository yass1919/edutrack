import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Login from "@/pages/login";
import Register from "@/pages/register";
import TeacherDashboard from "@/pages/teacher-dashboard";
import InspectorDashboard from "@/pages/inspector-dashboard-new";
import FounderDashboard from "@/pages/founder-dashboard-new";
import AdminDashboard from "@/pages/admin-dashboard";
import { SgDashboard } from "@/pages/sg-dashboard";
import NotFound from "@/pages/not-found";
import type { AuthUser } from "@/lib/auth";
import { AcademicYearProvider } from "@/lib/academic-year-context";

function AuthenticatedApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  console.log('AuthenticatedApp - Current user:', user);
  
  return (
    <Switch>
      <Route path="/">
        {user.role === 'teacher' && <TeacherDashboard user={user} onLogout={onLogout} />}
        {user.role === 'inspector' && <InspectorDashboard />}
        {user.role === 'founder' && <FounderDashboard user={user} onLogout={onLogout} />}
        {user.role === 'admin' && <AdminDashboard user={user} onLogout={onLogout} />}
        {user.role === 'sg' && <SgDashboard user={user} onLogout={onLogout} />}
        {!['teacher', 'inspector', 'founder', 'admin', 'sg'].includes(user.role) && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Rôle non reconnu</h1>
              <p className="text-gray-600 mt-2">Rôle utilisateur: {user.role}</p>
            </div>
          </div>
        )}
      </Route>
      <Route path="/founder">
        {user.role === 'founder' ? (
          <FounderDashboard user={user} onLogout={onLogout} />
        ) : (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Accès refusé</h1>
              <p className="text-gray-600 mt-2">Cette page est réservée aux fondateurs</p>
            </div>
          </div>
        )}
      </Route>
      <Route>
        {() => {
          console.log('Route non trouvée - user:', user, 'URL:', window.location.pathname);
          return <NotFound />;
        }}
      </Route>
    </Switch>
  );
}

function App() {
  const { user, isLoading, setUser } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AcademicYearProvider>
          <Toaster />
          {user ? (
            <AuthenticatedApp user={user} onLogout={() => setUser(null)} />
          ) : (
            <Switch>
              <Route path="/register">
                <Register onBackToLogin={() => window.history.back()} />
              </Route>
              <Route>
                <Login onLogin={setUser} />
              </Route>
            </Switch>
          )}
        </AcademicYearProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
