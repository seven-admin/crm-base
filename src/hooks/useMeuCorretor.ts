import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MeuCorretor {
  id: string;
  nome_completo: string;
  imobiliaria_id: string | null;
  user_id: string | null;
}

/**
 * Hook para obter o corretor vinculado ao usuário logado.
 * Prioridade: user_id → email (fallback).
 */
export function useMeuCorretor() {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['meu-corretor', user?.id, profile?.email],
    queryFn: async (): Promise<MeuCorretor | null> => {
      if (!user?.id) return null;

      // Prioridade 1: buscar por user_id
      const { data: byUserId } = await supabase
        .from('corretores')
        .select('id, nome_completo, imobiliaria_id, user_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (byUserId) return byUserId;

      // Fallback: buscar por email
      if (profile?.email) {
        const { data: byEmail } = await supabase
          .from('corretores')
          .select('id, nome_completo, imobiliaria_id, user_id')
          .eq('email', profile.email)
          .eq('is_active', true)
          .maybeSingle();

        if (byEmail) return byEmail;
      }

      return null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
