import { useQuery } from '@tanstack/react-query';
import { endOfDay, endOfWeek, startOfDay, startOfWeek, subWeeks } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useArqoLeads, useArqoMetasAtendimento, useArqoPerformanceConfigs, useArqoFilaUsuario, useArqoLeadCounters, useMeusArqoGrupos } from '@/hooks/useArqo';
import type { ArqoMetaAtendimento, ArqoPerformanceConfig } from '@/types/arqo.types';

type PeriodMetrics = {
  ligacoes: number;
  conversas: number;
  agendamentos: number;
  visitasRealizadas: number;
};

export type ArqoPerformanceLevel = 'bom' | 'atencao' | 'critico' | 'sem_meta';

function aggregate(
  calls: Array<Record<string, unknown>>,
  appointments: Array<Record<string, unknown>>,
  visits: Array<Record<string, unknown>>,
  start: Date,
  end: Date,
): PeriodMetrics {
  const callsInRange = calls.filter((row) => {
    const date = new Date(String(row.encerrado_em));
    return date >= start && date <= end;
  });
  return {
    ligacoes: callsInRange.length,
    conversas: callsInRange.filter((row) => row.status_codigo === 'C07').length,
    agendamentos: appointments.filter((row) => {
      const date = new Date(String(row.created_at));
      return date >= start && date <= end && row.status !== 'cancelado';
    }).length,
    visitasRealizadas: visits.filter((row) => {
      const date = new Date(String(row.data_hora));
      return date >= start && date <= end && row.tipo === 'visita' && row.status === 'realizado';
    }).length,
  };
}

function goals(meta: ArqoMetaAtendimento | undefined, period: 'diaria' | 'semanal'): PeriodMetrics {
  return {
    ligacoes: meta?.[`meta_${period}_ligacoes`] ?? 0,
    conversas: meta?.[`meta_${period}_conversas`] ?? 0,
    agendamentos: meta?.[`meta_${period}_agendamentos`] ?? 0,
    visitasRealizadas: meta?.[`meta_${period}_visitas_realizadas`] ?? 0,
  };
}

function performance(actual: PeriodMetrics, target: PeriodMetrics, config?: ArqoPerformanceConfig) {
  const weights = {
    ligacoes: config?.peso_ligacoes ?? 1,
    conversas: config?.peso_conversas ?? 1,
    agendamentos: config?.peso_agendamentos ?? 1,
    visitasRealizadas: config?.peso_visitas_realizadas ?? 1,
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
  const { data: fila = [], isLoading: loadingFila } = useArqoFilaUsuario(userId);
  const { data: counters, isLoading: loadingCounters } = useArqoLeadCounters(userId);
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
      const userFilter = `responsavel_id.eq.${userId},closer_id.eq.${userId}`;
      const [atendimentosRes, agendamentosCriadosRes, visitasRes, agendamentosHojeRes] = await Promise.all([
        supabase
          // A tabela é criada pela migração desta entrega; os tipos gerados serão atualizados após o push.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('arqo_atendimentos' as any)
          .select('encerrado_em, status_codigo')
          .eq('consultor_id', userId!)
          .gte('encerrado_em', previousWeekStart.toISOString())
          .lte('encerrado_em', weekEnd.toISOString()),
        supabase
          .from('arqo_agendamentos')
          .select('id, created_at, status')
          .or(userFilter)
          .gte('created_at', previousWeekStart.toISOString())
          .lte('created_at', weekEnd.toISOString()),
        supabase
          .from('arqo_agendamentos')
          .select('id, tipo, data_hora, status')
          .or(userFilter)
          .gte('data_hora', previousWeekStart.toISOString())
          .lte('data_hora', weekEnd.toISOString()),
        supabase
          .from('arqo_agendamentos')
          .select('id, tipo, data_hora, status')
          .or(userFilter)
          .gte('data_hora', todayStart.toISOString())
          .lte('data_hora', todayEnd.toISOString())
          .neq('status', 'cancelado'),
      ]);
      if (atendimentosRes.error) throw atendimentosRes.error;
      if (agendamentosCriadosRes.error) throw agendamentosCriadosRes.error;
      if (visitasRes.error) throw visitasRes.error;
      if (agendamentosHojeRes.error) throw agendamentosHojeRes.error;
      const calls = (atendimentosRes.data ?? []) as unknown as Array<Record<string, unknown>>;
      const appointments = (agendamentosCriadosRes.data ?? []) as unknown as Array<Record<string, unknown>>;
      const visits = (visitasRes.data ?? []) as unknown as Array<Record<string, unknown>>;
      return {
        dia: aggregate(calls, appointments, visits, todayStart, todayEnd),
        semana: aggregate(calls, appointments, visits, weekStart, weekEnd),
        semanaAnterior: aggregate(calls, appointments, visits, previousWeekStart, previousWeekEnd),
        visitasHoje: (agendamentosHojeRes.data ?? []).filter((item) => item.tipo === 'visita').length,
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
    return applicable.find((meta) => meta.usuarios?.some((item) => item.user_id === userId))
      ?? applicable.find((meta) => meta.user_id === userId)
      ?? applicable.find((meta) => !!meta.grupo_id && groupIds.has(meta.grupo_id));
  };
  const currentMeta = findMetaForDate(now);
  const previousWeekMeta = findMetaForDate(previousWeekEnd);
  const performanceConfig = configs.find((config) => config.is_default && config.is_active)
    ?? configs.find((config) => config.is_active);
  const dayGoals = goals(currentMeta, 'diaria');
  const weekGoals = goals(currentMeta, 'semanal');
  const previousWeekGoals = goals(previousWeekMeta, 'semanal');
  const emptyMetrics = { ligacoes: 0, conversas: 0, agendamentos: 0, visitasRealizadas: 0 };
  const dayMetrics = metricsQuery.data?.dia ?? emptyMetrics;
  const weekMetrics = metricsQuery.data?.semana ?? emptyMetrics;
  const previousWeekMetrics = metricsQuery.data?.semanaAnterior ?? emptyMetrics;

  return {
    consultantName: profile?.full_name ?? 'Consultor',
    specialistName: activeLeads.find((lead) => lead.closer)?.closer?.full_name ?? null,
    activeLeads,
    portfolio: {
      totalVisivel: counters?.totalVisivel ?? 0,
      lista: counters?.minhaCarteira ?? activeLeads.length,
      encerrados: counters?.encerrados ?? 0,
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
    isLoading: loadingLeads || loadingFila || loadingCounters || metricsQuery.isLoading,
  };
}
