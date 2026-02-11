import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para buscar o gestor de produto vinculado a um empreendimento.
 * Utiliza a função RPC get_gestor_empreendimento criada no banco.
 */
export function useGestorEmpreendimento(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['gestor-empreendimento', empreendimentoId],
    queryFn: async () => {
      if (!empreendimentoId) return null;
      
      const { data, error } = await supabase
        .rpc('get_gestor_empreendimento', { emp_id: empreendimentoId });
      
      if (error) {
        console.error('Erro ao buscar gestor do empreendimento:', error);
        throw error;
      }
      
      return data as string | null;
    },
    enabled: !!empreendimentoId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
