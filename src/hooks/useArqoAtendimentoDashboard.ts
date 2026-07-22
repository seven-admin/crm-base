import { useQuery } from '@tanstack/react-query';
import { endOfDay, endOfWeek, startOfDay, startOfWeek, subWeeks } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useArqoLeads, useArqoMetasAtendimento, useArqoPerformanceConfigs, useArqoFilaUsuario, useMeusArqoGrupos } from '@/hooks/useArqo';
import type { ArqoMetaAtendimento, ArqoPerformanceConfig } from '@/types/arqo.types';

type PeriodMetrics = {
  atendimentos: number;
  retornos: number;
  visitas: number;
  conversoes: number;
};

export type ArqoPerformanceLevel = 'bom' | 'atencao' | 'critico' | 'sem_meta';

function aggregate(rows: Array<Record<string, unknown>>): PeriodMetrics {
  return {
    atendimentos: rows.length,
    retornos: rows.filter((row) => row.acao_codigo === 'A02').length,
    visitas: rows.filter((row) => row.acao_codigo === 'A01').length,
    conversoes: rows.filter((row) => row.interesse_codigo === 'I03' || row.interesse_codigo === 'I04').length,
  };
}

function goals(meta: ArqoMetaAtendimento | undefined, period: 'diaria' | 'semanal'): PeriodMetrics {
  return {
    atendimentos: meta?.[`meta_${period}_atendimentos`] ?? 0,
    retornos: meta?.[`meta_${period}_retornos`] ?? 0,
    visitas: meta?.[`meta_${period}_visitas`] ?? 0,
    conversoes: meta?.[`meta_${period}_conversoes`] ?? 0,
  };
}

function performance(actual: PeriodMetrics, target: PeriodMetrics, config?: ArqoPerformanceConfig) {
  const weights = {
    atendimentos: config?.peso_atendimentos ?? 1,
    retornos: config?.peso_retornos ?? 1,
    visitas: config?.peso_visitas ?? 1,
    conversoes: config?.peso_conversoes ?? 1,
  };
  let total = 0;
  let weightTotal = 0;
  (Object.keys(actual) as Array<keyof PeriodMetrics>).forEach((key) => {
    if (target[key] <= 0 || weights[key] <= 0) return;
    total += (actual[key] / target[key]) * 100 * weights[key];
    weightTotal += weights[key];
  });
  if (weightTotal === 0) return { score: null, level: 'sem_meta' as ArqoPerformanceLevel };
  const score = total / weightTotal;
  const level: ArqoPerformanceLevel = score >= (config?.limite_bom ?? 100)
    ? 'bom'
    : score >= (config?.limite_atencao ?? 70)
      ? 'atencao'
      : 'critico';
  return { score, level };
}

export function useArqoAtendimentoDashboard() {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const { data: leads = [], isLoading: loadingLeads } = useArqoLeads(userId ? { consultorId: userId } : undefined);
  const { data: grupos = [] } = useMeusArqoGrupos(userId);
  const { data: fila = [] } = useArqoFilaUsuario();
  const { data: metas = [] } = useArqoMetasAtendimento();
  const { data: configs = [] } = useArqoPerformanceConfigs();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const metricsQuery = useQuery({
    queryKey: ['arqo', 'dashboard-atendimento', userId, todayStart.toISOString()],
    enabled: !!userId,
    queryFn: async () => {
      const [atendimentosRes, agendamentosRes] = await Promise.all([
        supabase
          // A tabela é criada pela migração desta entrega; os tipos gerados serão atualizados após o push.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('arqo_atendimentos' as any)
          .select('encerrado_em, acao_codigo, interesse_codigo')
          .eq('consultor_id', userId!)
          .gte('encerrado_em', previousWeekStart.toISOString())
          .lte('encerrado_em', weekEnd.toISOString()),
        supabase
          .from('arqo_agendamentos')
          .select('id, tipo, data_hora, status')
          .eq('responsavel_id', userId!)
          .gte('data_hora', todayStart.toISOString())
          .lte('data_hora', todayEnd.toISOString())
          .neq('status', 'cancelado'),
      ]);
      if (atendimentosRes.error) throw atendimentosRes.error;
      if (agendamentosRes.error) throw agendamentosRes.error;
      const rows = (atendimentosRes.data ?? []) as unknown as Array<Record<string, unknown>>;
      const inRange = (start: Date, end: Date) => rows.filter((row) => {
        const date = new Date(String(row.encerrado_em));
        return date >= start && date <= end;
      });
      return {
        dia: aggregate(inRange(todayStart, todayEnd)),
        semana: aggregate(inRange(weekStart, weekEnd)),
        semanaAnterior: aggregate(inRange(previousWeekStart, previousWeekEnd)),
        visitasHoje: (agendamentosRes.data ?? []).filter((item) => item.tipo === 'visita').length,
      };
    },
  });

  const activeLeads = leads.filter((lead) => !lead.fechado_em);
  const returnsToday = activeLeads.filter((lead) => {
    if (!lead.proximo_contato_em) return false;
    return new Date(lead.proximo_contato_em) <= todayEnd;
  }).length;
  const classification = activeLeads.reduce<Record<string, number>>((acc, lead) => {
    const key = lead.temperatura?.nome ?? 'Sem classificação';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const groupIds = new Set(grupos.map((group) => group.id));
  const findMetaForDate = (date: Date) => {
    const reference = date.toISOString().slice(0, 10);
    const applicable = metas
      .filter((meta) => meta.is_active && meta.vigencia_inicio <= reference && (!meta.vigencia_fim || meta.vigencia_fim >= reference))
      .sort((a, b) => b.vigencia_inicio.localeCompare(a.vigencia_inicio));
    return applicable.find((meta) => meta.user_id === userId)
      ?? applicable.find((meta) => !!meta.grupo_id && groupIds.has(meta.grupo_id));
  };
  const currentMeta = findMetaForDate(now);
  const previousWeekMeta = findMetaForDate(previousWeekEnd);
  const performanceConfig = configs.find((config) => config.is_default && config.is_active)
    ?? configs.find((config) => config.is_active);
  const dayGoals = goals(currentMeta, 'diaria');
  const weekGoals = goals(currentMeta, 'semanal');
  const previousWeekGoals = goals(previousWeekMeta, 'semanal');
  const dayMetrics = metricsQuery.data?.dia ?? { atendimentos: 0, retornos: 0, visitas: 0, conversoes: 0 };
  const weekMetrics = metricsQuery.data?.semana ?? { atendimentos: 0, retornos: 0, visitas: 0, conversoes: 0 };
  const previousWeekMetrics = metricsQuery.data?.semanaAnterior ?? { atendimentos: 0, retornos: 0, visitas: 0, conversoes: 0 };

  return {
    consultantName: profile?.full_name ?? 'Consultor',
    specialistName: activeLeads.find((lead) => lead.closer)?.closer?.full_name ?? null,
    activeLeads,
    portfolio: {
      lista: activeLeads.length,
      retornos: returnsToday,
      classificacao: classification,
    },
    actions: {
      retornar: returnsToday,
      visitasHoje: metricsQuery.data?.visitasHoje ?? 0,
      fila: fila.reduce((sum, item) => sum + Number(item.quantidade), 0),
    },
    dayMetrics,
    weekMetrics,
    previousWeekMetrics,
    dayGoals,
    weekGoals,
    dayPerformance: performance(dayMetrics, dayGoals, performanceConfig),
    previousWeekPerformance: performance(previousWeekMetrics, previousWeekGoals, performanceConfig),
    meta: currentMeta,
    performanceConfig,
    isLoading: loadingLeads || metricsQuery.isLoading,
  };
}
