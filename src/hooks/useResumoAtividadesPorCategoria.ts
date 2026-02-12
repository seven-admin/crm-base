import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { AtividadeCategoria, AtividadeTipo } from '@/types/atividades.types';

const FORECAST_STALE = 5 * 60 * 1000;
const FORECAST_REFETCH = 5 * 60 * 1000;

export type CategoriaResumo = Partial<Record<AtividadeTipo, number>> & {
  total: number;
  abertas: number;
  fechadas: number;
  futuras: number;
  atrasadas: number;
};
export type ResumoCategoriasData = Partial<Record<AtividadeCategoria, CategoriaResumo>>;

export function useResumoAtividadesPorCategoria(
  gestorId?: string,
  dataInicio?: Date,
  dataFim?: Date,
  empreendimentoIds?: string[]
) {
  return useQuery({
    queryKey: ['forecast', 'resumo-por-categoria', gestorId || 'all', dataInicio?.toISOString(), dataFim?.toISOString(), empreendimentoIds?.join(',') || 'all'],
    staleTime: FORECAST_STALE,
    refetchInterval: FORECAST_REFETCH,
    queryFn: async (): Promise<ResumoCategoriasData> => {
      const inicioMes = dataInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const fimMes = dataFim || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

      const inicioStr = format(inicioMes, 'yyyy-MM-dd');
      const fimStr = format(fimMes, 'yyyy-MM-dd');
      const hojeStr = format(new Date(), 'yyyy-MM-dd');

      let query = supabase
        .from('atividades' as any)
        .select('categoria, tipo, status, data_inicio, data_fim, deadline_date')
        .lte('data_inicio', fimStr)
        .gte('data_fim', inicioStr)
        .neq('status', 'cancelada');

      if (gestorId) query = query.eq('gestor_id', gestorId);
      if (empreendimentoIds?.length) query = query.in('empreendimento_id', empreendimentoIds);

      const { data, error } = await query;
      if (error) throw error;

      const resultado: ResumoCategoriasData = {};

      (data || []).forEach((ativ: any) => {
        const cat = ativ.categoria as AtividadeCategoria | null;
        if (!cat) return;

        if (!resultado[cat]) {
          resultado[cat] = { total: 0, abertas: 0, fechadas: 0, futuras: 0, atrasadas: 0 };
        }

        const tipo = ativ.tipo as AtividadeTipo;
        resultado[cat]![tipo] = (resultado[cat]![tipo] || 0) + 1;
        resultado[cat]!.total++;

        if (ativ.status === 'concluida') {
          resultado[cat]!.fechadas++;
        } else if (ativ.status === 'pendente') {
          const deadlineOrFim = ativ.deadline_date || ativ.data_fim;
          if (deadlineOrFim < hojeStr) {
            resultado[cat]!.atrasadas++;
          } else if (ativ.data_inicio > hojeStr) {
            resultado[cat]!.futuras++;
          } else {
            resultado[cat]!.abertas++;
          }
        }
      });

      return resultado;
    },
  });
}
