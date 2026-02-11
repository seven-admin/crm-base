import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlanejamentoHistorico } from '@/types/planejamento.types';

export function usePlanejamentoHistorico(itemId?: string) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ['planejamento-historico', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planejamento_historico')
        .select(`
          *,
          user:profiles!user_id(full_name)
        `)
        .eq('item_id', itemId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PlanejamentoHistorico[];
    },
    enabled: !!itemId
  });

  return {
    historico,
    isLoading
  };
}
