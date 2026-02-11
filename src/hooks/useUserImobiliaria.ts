import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook que retorna a imobiliária vinculada ao usuário logado (se gestor_imobiliaria).
 */
export function useUserImobiliaria() {
  const { user, role } = useAuth();

  const { data: imobiliariaId, isLoading } = useQuery({
    queryKey: ['user-imobiliaria', user?.id],
    queryFn: async (): Promise<string | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('imobiliarias')
        .select('id')
        .eq('user_id', user.id)
        .limit(1).maybeSingle();

      if (error) {
        console.error('Error fetching user imobiliaria:', error);
        return null;
      }

      return data?.id || null;
    },
    enabled: !!user && role === 'gestor_imobiliaria',
    staleTime: 30 * 60 * 1000,
  });

  return {
    imobiliariaId: imobiliariaId || null,
    isGestorImobiliaria: role === 'gestor_imobiliaria',
    isLoading,
  };
}
