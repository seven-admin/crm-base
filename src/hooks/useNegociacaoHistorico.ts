import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Type assertion helper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface NegociacaoHistoricoItem {
  id: string;
  negociacao_id: string;
  user_id?: string;
  funil_etapa_anterior_id?: string;
  funil_etapa_nova_id?: string;
  etapa_anterior?: string;
  etapa_nova?: string;
  observacao?: string;
  created_at: string;
  user?: { full_name: string };
  etapa_anterior_info?: { id: string; nome: string; cor: string };
  etapa_nova_info?: { id: string; nome: string; cor: string };
}

export function useNegociacaoHistorico(negociacaoId: string | undefined) {
  return useQuery({
    queryKey: ['negociacao-historico', negociacaoId],
    queryFn: async () => {
      if (!negociacaoId) return [];

      const { data, error } = await db
        .from('negociacao_historico')
        .select(`
          *,
          user:profiles(full_name),
          etapa_anterior_info:funil_etapas!negociacao_historico_funil_etapa_anterior_id_fkey(id, nome, cor),
          etapa_nova_info:funil_etapas!negociacao_historico_funil_etapa_nova_id_fkey(id, nome, cor)
        `)
        .eq('negociacao_id', negociacaoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as NegociacaoHistoricoItem[];
    },
    enabled: !!negociacaoId
  });
}
