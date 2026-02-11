import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoricoPreco {
  id: string;
  unidade_id: string;
  valor_anterior: number | null;
  valor_novo: number | null;
  area_anterior: number | null;
  area_nova: number | null;
  motivo: string | null;
  alterado_por: string | null;
  created_at: string;
  alterado_por_nome?: string | null;
}

export function useUnidadeHistoricoPrecos(unidadeId: string | undefined) {
  return useQuery({
    queryKey: ['unidade-historico-precos', unidadeId],
    queryFn: async (): Promise<HistoricoPreco[]> => {
      if (!unidadeId) return [];

      // Buscar histórico
      const { data: historico, error } = await supabase
        .from('unidade_historico_precos')
        .select('*')
        .eq('unidade_id', unidadeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!historico || historico.length === 0) return [];

      // Buscar nomes dos usuários que alteraram
      const userIds = [...new Set(historico.filter(h => h.alterado_por).map(h => h.alterado_por))];
      
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.full_name || p.email || 'Usuário';
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return historico.map(h => ({
        ...h,
        alterado_por_nome: h.alterado_por ? profilesMap[h.alterado_por] || null : null,
      }));
    },
    enabled: !!unidadeId,
  });
}
