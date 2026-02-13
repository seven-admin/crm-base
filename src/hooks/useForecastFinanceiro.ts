import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const STALE = 5 * 60 * 1000;

export interface ForecastFinanceiro {
  valorVendas: number;
  comissoesPorGestor: { gestor_id: string; gestor_nome: string; valor: number }[];
  totalComissoes: number;
  valorNegociacoes: number;
  valorPropostasAceitas: number;
}

export function useForecastFinanceiro(
  gestorId?: string,
  dataInicio?: Date,
  dataFim?: Date,
) {
  return useQuery({
    queryKey: ['forecast', 'financeiro', gestorId || 'all', dataInicio?.toISOString(), dataFim?.toISOString()],
    staleTime: STALE,
    refetchInterval: STALE,
    queryFn: async (): Promise<ForecastFinanceiro> => {
      const inicioMes = dataInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const fimMes = dataFim || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
      const inicioStr = format(inicioMes, 'yyyy-MM-dd');
      const fimStr = format(fimMes, 'yyyy-MM-dd');

      // 1. Comissões (vendas + comissões por gestor)
      let comissoesQuery = supabase
        .from('comissoes')
        .select('valor_venda, valor_comissao, gestor_id, gestor:profiles!comissoes_gestor_id_fkey(full_name)')
        .eq('is_active', true)
        .gte('created_at', `${inicioStr}T00:00:00`)
        .lte('created_at', `${fimStr}T23:59:59`);
      
      if (gestorId) {
        comissoesQuery = comissoesQuery.eq('gestor_id', gestorId);
      }

      // 2. Negociações ativas
      let negQuery = supabase
        .from('negociacoes')
        .select('valor_proposta')
        .eq('is_active', true);
      
      if (gestorId) {
        negQuery = negQuery.eq('gestor_id', gestorId);
      }

      // 3. Propostas aceitas no período
      let propQuery = supabase
        .from('propostas')
        .select('valor_proposta')
        .eq('status', 'aceita')
        .gte('created_at', `${inicioStr}T00:00:00`)
        .lte('created_at', `${fimStr}T23:59:59`);

      const [comissoesRes, negRes, propRes] = await Promise.all([
        comissoesQuery,
        negQuery,
        propQuery,
      ]);

      if (comissoesRes.error) throw comissoesRes.error;
      if (negRes.error) throw negRes.error;
      if (propRes.error) throw propRes.error;

      // Calcular valor total de vendas
      const valorVendas = (comissoesRes.data || []).reduce((sum, c: any) => sum + (c.valor_venda || 0), 0);

      // Agrupar comissões por gestor
      const gestorMap = new Map<string, { gestor_id: string; gestor_nome: string; valor: number }>();
      let totalComissoes = 0;
      (comissoesRes.data || []).forEach((c: any) => {
        const val = c.valor_comissao || 0;
        totalComissoes += val;
        if (c.gestor_id) {
          const existing = gestorMap.get(c.gestor_id);
          if (existing) {
            existing.valor += val;
          } else {
            gestorMap.set(c.gestor_id, {
              gestor_id: c.gestor_id,
              gestor_nome: c.gestor?.full_name || 'Sem nome',
              valor: val,
            });
          }
        }
      });

      // Valor de negociações em andamento
      const valorNegociacoes = (negRes.data || []).reduce((sum, n: any) => sum + (n.valor_proposta || 0), 0);

      // Valor de propostas aceitas
      const valorPropostasAceitas = (propRes.data || []).reduce((sum, p: any) => sum + (p.valor_proposta || 0), 0);

      return {
        valorVendas,
        comissoesPorGestor: Array.from(gestorMap.values()).sort((a, b) => b.valor - a.valor),
        totalComissoes,
        valorNegociacoes,
        valorPropostasAceitas,
      };
    },
  });
}
