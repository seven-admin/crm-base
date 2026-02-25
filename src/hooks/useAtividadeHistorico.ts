import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AtividadeHistoricoItem {
  id: string;
  atividade_id: string;
  user_id: string | null;
  tipo_evento: string;
  campo_alterado: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  observacao: string | null;
  created_at: string;
  user?: { full_name: string } | null;
}

export function useAtividadeHistorico(atividadeId: string | null) {
  return useQuery({
    queryKey: ['atividade-historico', atividadeId],
    queryFn: async () => {
      if (!atividadeId) return [];
      const { data, error } = await supabase
        .from('atividade_historico')
        .select('*, user:profiles!atividade_historico_user_id_fkey(full_name)')
        .eq('atividade_id', atividadeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AtividadeHistoricoItem[];
    },
    enabled: !!atividadeId,
  });
}
