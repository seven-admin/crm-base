import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmpreendimentoSelect {
  id: string;
  nome: string;
}

type Options = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

/**
 * Hook leve para selects/comboboxes.
 * Evita o N+1 e o carregamento de stats/mídias do useEmpreendimentos.
 */
export function useEmpreendimentosSelect(options: Options = {}) {
  const { enabled = true, staleTime = 10 * 60 * 1000, gcTime = 60 * 60 * 1000 } = options;

  return useQuery({
    queryKey: ['empreendimentos-select'],
    queryFn: async (): Promise<EmpreendimentoSelect[]> => {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .eq('is_active', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data || []) as EmpreendimentoSelect[];
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
  });
}
