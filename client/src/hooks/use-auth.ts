import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type AuthUser, getAuthToken, removeAuthToken } from '@/lib/auth';

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };
      
      const res = await fetch('/api/auth/me', { headers });
      
      if (res.status === 401) {
        removeAuthToken();
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
    retry: false,
  });

  const setUser = (newUser: AuthUser | null) => {
    queryClient.setQueryData(['/api/auth/me'], newUser);
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    setUser,
  };
}