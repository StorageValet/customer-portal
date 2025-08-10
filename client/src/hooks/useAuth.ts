import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
export function useAuth() {
  const q = useQuery({ queryKey: ['me'], queryFn: api.me, retry: false, staleTime: 30000 });
  return { user: q.data || null, loading: q.isLoading, error: q.error as any, refetch: q.refetch, isAuthenticated: !!q.data };
}
