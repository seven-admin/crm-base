import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PessoasTreinadasResult {
  totalPessoas: number;
  totalTreinamentos: number;
}

export function usePessoasTreinadas(
  gestorId: string | undefined,
  dataInicio: Date,
  dataFim: Date
) {
  return useQuery<PessoasTreinadasResult>({
    queryKey: ['pessoas-treinadas', gestorId, dataInicio.toISOString(), dataFim.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('atividades')
        .select('qtd_participantes')
        .eq('tipo', 'treinamento')
        .neq('status', 'cancelada')
        .gte('data_inicio', dataInicio.toISOString().split('T')[0])
        .lte('data_inicio', dataFim.toISOString().split('T')[0]);

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalPessoas = (data || []).reduce((sum, r) => sum + (r.qtd_participantes || 0), 0);
      const totalTreinamentos = (data || []).length;

      return { totalPessoas, totalTreinamentos };
    },
  });
}
