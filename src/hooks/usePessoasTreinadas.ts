import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PessoasTreinadasPorCategoria = Record<string, { totalPessoas: number; totalTreinamentos: number }>;

export function usePessoasTreinadas(
  gestorId: string | undefined,
  dataInicio: Date,
  dataFim: Date
) {
  return useQuery<PessoasTreinadasPorCategoria>({
    queryKey: ['pessoas-treinadas', gestorId, dataInicio.toISOString(), dataFim.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('atividades')
        .select('qtd_participantes, categoria')
        .eq('tipo', 'treinamento')
        .neq('status', 'cancelada')
        .gte('data_inicio', dataInicio.toISOString().split('T')[0])
        .lte('data_inicio', dataFim.toISOString().split('T')[0]);

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const result: PessoasTreinadasPorCategoria = {};
      for (const row of data || []) {
        const cat = row.categoria || 'seven';
        if (!result[cat]) result[cat] = { totalPessoas: 0, totalTreinamentos: 0 };
        result[cat].totalPessoas += row.qtd_participantes || 0;
        result[cat].totalTreinamentos += 1;
      }

      return result;
    },
  });
}
