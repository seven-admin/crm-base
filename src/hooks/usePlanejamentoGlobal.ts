import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';
import { useMemo } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  eachWeekOfInterval, 
  isWithinInterval, 
  parseISO, 
  format,
  addDays,
  differenceInDays
} from 'date-fns';

export interface PlanejamentoGlobalFilters {
  data_de?: string;
  data_ate?: string;
  responsavel_id?: string;
  fase_id?: string;
  status_id?: string;
  empreendimento_id?: string;
}

export interface EmpreendimentoProgresso {
  id: string;
  nome: string;
  totalTarefas: number;
  concluidas: number;
  emAndamento: number;
  atrasadas: number;
  percentualConcluido: number;
}

export interface ResponsavelCarga {
  id: string;
  nome: string;
  tarefasPorSemana: Record<string, number>;
  totalTarefas: number;
  tarefasAtrasadas: number;
  sobrecarga: boolean; // Mais de 5 tarefas na mesma semana
}

export interface ConflitoDatas {
  tipo: 'sobreposicao_fase' | 'sobrecarga_responsavel' | 'gargalo_periodo';
  descricao: string;
  itensRelacionados: string[];
  severidade: 'baixa' | 'media' | 'alta';
}

export function usePlanejamentoGlobal(filters?: PlanejamentoGlobalFilters, limiteSobrecarga: number = 5) {
  const { data: itens, isLoading } = useQuery({
    queryKey: ['planejamento-global', filters],
    queryFn: async () => {
      let query = supabase
        .from('planejamento_itens')
        .select(`
          *,
          fase:planejamento_fases(id, nome, cor, ordem),
          status:planejamento_status(id, nome, cor, is_final),
          responsavel:profiles!responsavel_tecnico_id(id, full_name, email),
          responsaveis:planejamento_item_responsaveis(
            id,
            user_id,
            papel,
            created_at,
            user:profiles!user_id(id, full_name, email)
          ),
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('is_active', true)
        .order('ordem');

      if (filters?.fase_id) {
        query = query.eq('fase_id', filters.fase_id);
      }

      if (filters?.status_id) {
        query = query.eq('status_id', filters.status_id);
      }

      if (filters?.responsavel_id) {
        query = query.eq('responsavel_tecnico_id', filters.responsavel_id);
      }

      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }

      // Filtros de data
      if (filters?.data_de) {
        query = query.gte('data_inicio', filters.data_de);
      }

      if (filters?.data_ate) {
        query = query.lte('data_fim', filters.data_ate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PlanejamentoItemWithRelations[];
    }
  });

  // Métricas consolidadas
  const metricas = useMemo(() => {
    if (!itens) return null;

    const hoje = new Date();
    const total = itens.length;
    const concluidas = itens.filter(i => i.status?.is_final).length;
    const emAndamento = itens.filter(i => !i.status?.is_final && i.data_inicio).length;
    const atrasadas = itens.filter(i => {
      if (i.status?.is_final) return false;
      if (!i.data_fim) return false;
      return parseISO(i.data_fim) < hoje;
    }).length;
    const semData = itens.filter(i => !i.data_inicio && !i.data_fim).length;

    return {
      total,
      concluidas,
      emAndamento,
      atrasadas,
      semData,
      percentualConcluido: total > 0 ? Math.round((concluidas / total) * 100) : 0
    };
  }, [itens]);

  // Progresso por empreendimento
  const progressoPorEmpreendimento = useMemo<EmpreendimentoProgresso[]>(() => {
    if (!itens) return [];

    const hoje = new Date();
    const agrupado = new Map<string, PlanejamentoItemWithRelations[]>();
    
    itens.forEach(item => {
      if (!item.empreendimento) return;
      const key = item.empreendimento.id;
      if (!agrupado.has(key)) {
        agrupado.set(key, []);
      }
      agrupado.get(key)!.push(item);
    });

    return Array.from(agrupado.entries()).map(([id, items]) => {
      const empreendimento = items[0].empreendimento!;
      const totalTarefas = items.length;
      const concluidas = items.filter(i => i.status?.is_final).length;
      const atrasadas = items.filter(i => {
        if (i.status?.is_final) return false;
        if (!i.data_fim) return false;
        return parseISO(i.data_fim) < hoje;
      }).length;
      const emAndamento = items.filter(i => !i.status?.is_final && i.data_inicio).length;

      return {
        id,
        nome: empreendimento.nome,
        totalTarefas,
        concluidas,
        emAndamento,
        atrasadas,
        percentualConcluido: totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0
      };
    }).sort((a, b) => b.totalTarefas - a.totalTarefas);
  }, [itens]);

  // Carga por responsável com análise semanal
  const cargaPorResponsavel = useMemo<ResponsavelCarga[]>(() => {
    if (!itens) return [];

    const hoje = new Date();
    const inicioAnalise = addDays(hoje, -30);
    const fimAnalise = addDays(hoje, 60);
    
    const semanas = eachWeekOfInterval(
      { start: inicioAnalise, end: fimAnalise },
      { weekStartsOn: 1 }
    );

    const responsaveis = new Map<string, {
      nome: string;
      tarefasPorSemana: Record<string, number>;
      totalTarefas: number;
      tarefasAtrasadas: number;
    }>();

    itens.forEach(item => {
      // Considerar responsável principal
      if (item.responsavel) {
        processarResponsavel(item.responsavel.id, item.responsavel.full_name, item, semanas, hoje, responsaveis);
      }
      
      // Considerar responsáveis adicionais
      item.responsaveis?.forEach(r => {
        if (r.user) {
          processarResponsavel(r.user.id, r.user.full_name, item, semanas, hoje, responsaveis);
        }
      });
    });

    return Array.from(responsaveis.entries()).map(([id, data]) => {
      const maxPorSemana = Math.max(...Object.values(data.tarefasPorSemana), 0);
      return {
        id,
        nome: data.nome,
        tarefasPorSemana: data.tarefasPorSemana,
        totalTarefas: data.totalTarefas,
        tarefasAtrasadas: data.tarefasAtrasadas,
        sobrecarga: maxPorSemana > limiteSobrecarga
      };
    }).sort((a, b) => b.totalTarefas - a.totalTarefas);
  }, [itens, limiteSobrecarga]);

  // Detecção de conflitos
  const conflitos = useMemo<ConflitoDatas[]>(() => {
    if (!itens) return [];

    const resultado: ConflitoDatas[] = [];
    const hoje = new Date();

    // 1. Detectar sobrecarga de responsáveis
    cargaPorResponsavel.forEach(resp => {
      if (resp.sobrecarga) {
        const semanasComSobrecarga = Object.entries(resp.tarefasPorSemana)
          .filter(([_, count]) => count > limiteSobrecarga)
          .map(([semana]) => semana);

        resultado.push({
          tipo: 'sobrecarga_responsavel',
          descricao: `${resp.nome} tem mais de ${limiteSobrecarga} tarefas em ${semanasComSobrecarga.length} semana(s)`,
          itensRelacionados: [resp.id],
          severidade: semanasComSobrecarga.length > 2 ? 'alta' : 'media'
        });
      }
    });

    // 2. Detectar gargalos de período (muitas tarefas no mesmo período)
    const tarefasPorSemana = new Map<string, number>();
    itens.forEach(item => {
      if (!item.data_inicio || !item.data_fim) return;
      
      try {
        const inicio = parseISO(item.data_inicio);
        const fim = parseISO(item.data_fim);
        const semanas = eachWeekOfInterval({ start: inicio, end: fim }, { weekStartsOn: 1 });
        
        semanas.forEach(semana => {
          const key = format(semana, 'yyyy-ww');
          tarefasPorSemana.set(key, (tarefasPorSemana.get(key) || 0) + 1);
        });
      } catch (e) {
        // Ignorar erros de parsing
      }
    });

    tarefasPorSemana.forEach((count, semana) => {
      if (count > 20) {
        resultado.push({
          tipo: 'gargalo_periodo',
          descricao: `Semana ${semana} tem ${count} tarefas programadas`,
          itensRelacionados: [],
          severidade: count > 30 ? 'alta' : 'media'
        });
      }
    });

    return resultado;
  }, [itens, cargaPorResponsavel]);

  return {
    itens,
    isLoading,
    metricas,
    progressoPorEmpreendimento,
    cargaPorResponsavel,
    conflitos
  };
}

// Função auxiliar para processar responsáveis
function processarResponsavel(
  id: string,
  nome: string,
  item: PlanejamentoItemWithRelations,
  semanas: Date[],
  hoje: Date,
  responsaveis: Map<string, {
    nome: string;
    tarefasPorSemana: Record<string, number>;
    totalTarefas: number;
    tarefasAtrasadas: number;
  }>
) {
  if (!responsaveis.has(id)) {
    responsaveis.set(id, {
      nome,
      tarefasPorSemana: {},
      totalTarefas: 0,
      tarefasAtrasadas: 0
    });
  }

  const data = responsaveis.get(id)!;
  data.totalTarefas++;

  // Verificar atraso
  if (!item.status?.is_final && item.data_fim && parseISO(item.data_fim) < hoje) {
    data.tarefasAtrasadas++;
  }

  // Distribuir por semanas
  if (item.data_inicio && item.data_fim) {
    try {
      const inicio = parseISO(item.data_inicio);
      const fim = parseISO(item.data_fim);
      
      semanas.forEach(semana => {
        const fimSemana = endOfWeek(semana, { weekStartsOn: 1 });
        if (isWithinInterval(semana, { start: inicio, end: fim }) ||
            isWithinInterval(fimSemana, { start: inicio, end: fim }) ||
            (inicio <= semana && fim >= fimSemana)) {
          const key = format(semana, 'yyyy-ww');
          data.tarefasPorSemana[key] = (data.tarefasPorSemana[key] || 0) + 1;
        }
      });
    } catch (e) {
      // Ignorar erros de parsing
    }
  }
}
