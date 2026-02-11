import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para buscar IDs dos super_admin ativos.
 * Usado para destaque visual de atividades criadas por super admins.
 */
export function useSuperAdminIds() {
  return useQuery({
    queryKey: ['super-admin-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'super_admin');

      if (error) throw error;
      return new Set((data || []).map((r: any) => r.user_id as string));
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  });
}
