import { useQuery } from '@tanstack/react-query';
import { endOfDay, endOfWeek, startOfDay, startOfWeek, subWeeks } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useArqoPerformanceConfigs } from '@/hooks/useArqo';
import type { ArqoMetaAtendimento, ArqoPerformanceConfig } from '@/types/arqo.types';

// Dashboard de metas da ARQO no mesmo formato do /metas da NEXA: um card por consultor
// com meta semanal × realizado e selos de performance (hoje / semana anterior).
// super_admin vê todos (com filtro por usuário); os demais veem apenas o próprio card.

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ArqoPerfLevel = 'bom' | 'atencao' | 'critico' | 'sem_meta';

export interface ArqoMetricSet {
  ligacoes: number;
  conversas: number;
  agendamentos: number;
  visitasRealizadas: number;
}

export interface ArqoConsultorCard {
  userId: string;
  nome: string;
  metaSemana: ArqoMetricSet;
  metaDia: ArqoMetricSet;
  hoje: ArqoMetricSet;
  semana: ArqoMetricSet;
  semanaAnterior: ArqoMetricSet;
  performanceHoje: { score: number | null; level: ArqoPerfLevel };
  performanceAnterior: { score: number | null; level: ArqoPerfLevel };
}

export interface ArqoDashboardResult {
  cards: ArqoConsultorCard[];
  totals: { meta: ArqoMetricSet; semana: ArqoMetricSet };
}

type CallRow = { consultor_id: string | null; status_codigo: string | null; encerrado_em: string | null };
type AgendaRow = {
  responsavel_id: string | null;
  tipo: string | null;
  status: string | null;
  data_hora: string | null;
  created_at: string | null;
};

const emptyMetrics = (): ArqoMetricSet => ({ ligacoes: 0, conversas: 0, agendamentos: 0, visitasRealizadas: 0 });

function inRange(iso: string | null, start: Date, end: Date) {
  if (!iso) return false;
  const d = new Date(iso);
  return d >= start && d <= end;
}

function goalsFrom(meta: ArqoMetaAtendimento | undefined, period: 'diaria' | 'semanal'): ArqoMetricSet {
  return {
    ligacoes: (meta as any)?.[`meta_${period}_ligacoes`] ?? 0,
    conversas: (meta as any)?.[`meta_${period}_conversas`] ?? 0,
    agendamentos: (meta as any)?.[`meta_${period}_agendamentos`] ?? 0,
    visitasRealizadas: (meta as any)?.[`meta_${period}_visitas_realizadas`] ?? 0,
  };
}

// Métricas de UM usuário numa janela: ligações/conversas vêm dos atendimentos (arqo_atendimentos),
// agendamentos e visitas realizadas vêm dos agendamentos (arqo_agendamentos).
function metricsForUser(calls: CallRow[], agendas: AgendaRow[], start: Date, end: Date): ArqoMetricSet {
  const m = emptyMetrics();
  for (const c of calls) {
    if (!inRange(c.encerrado_em, start, end)) continue;
    m.ligacoes += 1;
    if (c.status_codigo === 'C07') m.conversas += 1;
  }
  for (const a of agendas) {
    if (inRange(a.created_at, start, end) && a.status !== 'cancelado') m.agendamentos += 1;
    if (inRange(a.data_hora, start, end) && a.tipo === 'visita' && a.status === 'realizado') m.visitasRealizadas += 1;
  }
  return m;
}

function performance(
  actual: ArqoMetricSet,
  target: ArqoMetricSet,
  config?: ArqoPerformanceConfig,
): { score: number | null; level: ArqoPerfLevel } {
  const weights = {
    ligacoes: config?.peso_ligacoes ?? 1,
    conversas: config?.peso_conversas ?? 1,
    agendamentos: config?.peso_agendamentos ?? 1,
    visitasRealizadas: config?.peso_visitas_realizadas ?? 1,
  };
  let total = 0;
  let weightTotal = 0;
  (Object.keys(actual) as Array<keyof ArqoMetricSet>).forEach((key) => {
    if (target[key] <= 0 || weights[key] <= 0) return;
    total += (actual[key] / target[key]) * 100 * weights[key];
    weightTotal += weights[key];
  });
  if (weightTotal === 0) return { score: null, level: 'sem_meta' };
  const score = total / weightTotal;
  const level: ArqoPerfLevel = score >= (config?.limite_bom ?? 100)
    ? 'bom'
    : score >= (config?.limite_atencao ?? 70)
      ? 'atencao'
      : 'critico';
  return { score, level };
}

/**
 * Monta um card por consultor casando a meta vigente (mais recente cuja vigência cobre `reference`)
 * com o realizado da semana atual, semana anterior e hoje. Pura: recebe os dados já carregados.
 */
export function aggregateArqoMetas(
  calls: CallRow[],
  agendas: AgendaRow[],
  metas: ArqoMetaAtendimento[],
  week: { start: Date; end: Date },
  prevWeek: { start: Date; end: Date },
  today: { start: Date; end: Date },
  reference: Date,
  config?: ArqoPerformanceConfig,
  names?: Map<string, string>,
): ArqoDashboardResult {
  const ref = reference.toISOString().slice(0, 10);
  const activeMetas = metas
    .filter((m) => m.is_active && m.vigencia_inicio <= ref && (!m.vigencia_fim || m.vigencia_fim >= ref))
    .sort((a, b) => b.vigencia_inicio.localeCompare(a.vigencia_inicio));

  const userMeta = new Map<string, { nome: string; meta: ArqoMetaAtendimento }>();
  for (const meta of activeMetas) {
    const users = meta.usuarios?.length ? meta.usuarios : (meta.user_id ? [{ user_id: meta.user_id }] : []);
    for (const u of users) {
      if (userMeta.has(u.user_id)) continue; // lista desc → primeira é a mais recente
      userMeta.set(u.user_id, {
        nome: (u as any).profile?.full_name ?? 'Usuário',
        meta,
      });
    }
  }

  const callsByUser = new Map<string, CallRow[]>();
  for (const c of calls) {
    if (!c.consultor_id) continue;
    const arr = callsByUser.get(c.consultor_id) ?? [];
    arr.push(c);
    callsByUser.set(c.consultor_id, arr);
  }
  const agendasByUser = new Map<string, AgendaRow[]>();
  for (const a of agendas) {
    if (!a.responsavel_id) continue;
    const arr = agendasByUser.get(a.responsavel_id) ?? [];
    arr.push(a);
    agendasByUser.set(a.responsavel_id, arr);
  }

  const userIds = new Set<string>([...userMeta.keys(), ...callsByUser.keys(), ...agendasByUser.keys()]);
  const cards: ArqoConsultorCard[] = [...userIds].map((userId) => {
    const info = userMeta.get(userId);
    const meta = info?.meta;
    const c = callsByUser.get(userId) ?? [];
    const a = agendasByUser.get(userId) ?? [];
    const metaSemana = goalsFrom(meta, 'semanal');
    const metaDia = goalsFrom(meta, 'diaria');
    const semana = metricsForUser(c, a, week.start, week.end);
    const semanaAnterior = metricsForUser(c, a, prevWeek.start, prevWeek.end);
    const hoje = metricsForUser(c, a, today.start, today.end);
    return {
      userId,
      nome: info?.nome ?? names?.get(userId) ?? 'Usuário',
      metaSemana,
      metaDia,
      hoje,
      semana,
      semanaAnterior,
      performanceHoje: performance(hoje, metaDia, config),
      performanceAnterior: performance(semanaAnterior, metaSemana, config),
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  const sum = (pick: (c: ArqoConsultorCard) => ArqoMetricSet) =>
    cards.reduce((acc, card) => {
      const v = pick(card);
      acc.ligacoes += v.ligacoes; acc.conversas += v.conversas;
      acc.agendamentos += v.agendamentos; acc.visitasRealizadas += v.visitasRealizadas;
      return acc;
    }, emptyMetrics());

  return { cards, totals: { meta: sum((c) => c.metaSemana), semana: sum((c) => c.semana) } };
}

// Consolida vários cards num único (soma métricas/metas); performance recalculada do total.
export function aggregateArqoCards(
  cards: ArqoConsultorCard[],
  config?: ArqoPerformanceConfig,
  nome = 'Todos os usuários',
): ArqoConsultorCard {
  const sumSet = (pick: (c: ArqoConsultorCard) => ArqoMetricSet) =>
    cards.reduce((acc, c) => {
      const v = pick(c);
      acc.ligacoes += v.ligacoes; acc.conversas += v.conversas;
      acc.agendamentos += v.agendamentos; acc.visitasRealizadas += v.visitasRealizadas;
      return acc;
    }, emptyMetrics());
  const metaSemana = sumSet((c) => c.metaSemana);
  const metaDia = sumSet((c) => c.metaDia);
  const hoje = sumSet((c) => c.hoje);
  const semana = sumSet((c) => c.semana);
  const semanaAnterior = sumSet((c) => c.semanaAnterior);
  return {
    userId: 'todos',
    nome,
    metaSemana,
    metaDia,
    hoje,
    semana,
    semanaAnterior,
    performanceHoje: performance(hoje, metaDia, config),
    performanceAnterior: performance(semanaAnterior, metaSemana, config),
  };
}

export function useArqoMetasDashboard() {
  const { user, role } = useAuth();
  const userId = user?.id;
  // Só super_admin vê o consolidado/todos os usuários; os demais veem apenas o próprio card.
  const seeAll = role === 'super_admin';
  const { data: configs = [] } = useArqoPerformanceConfigs();
  const config = configs.find((c) => c.is_default && c.is_active) ?? configs.find((c) => c.is_active);

  const now = new Date();
  const week = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  const prevWeek = {
    start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
    end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
  };
  const today = { start: startOfDay(now), end: endOfDay(now) };

  return useQuery({
    queryKey: ['arqo', 'metas-dashboard', userId, seeAll, week.start.toISOString()],
    enabled: !!userId,
    queryFn: async (): Promise<ArqoDashboardResult & { seeAll: boolean }> => {
      const metasRes = await (supabase.from('arqo_metas_atendimento' as any) as any)
        .select('*, usuarios:arqo_meta_usuarios(user_id, profile:profiles(id, full_name, email))')
        .eq('is_active', true);
      if (metasRes.error) throw metasRes.error;
      let metas = (metasRes.data ?? []) as unknown as ArqoMetaAtendimento[];

      if (!seeAll && userId) {
        metas = metas
          .map((m) => ({ ...m, usuarios: (m.usuarios ?? []).filter((u) => u.user_id === userId) }))
          .filter((m) => (m.usuarios ?? []).length > 0 || m.user_id === userId);
      }

      let callsQuery = (supabase.from('arqo_atendimentos' as any) as any)
        .select('consultor_id, status_codigo, encerrado_em')
        .gte('encerrado_em', prevWeek.start.toISOString())
        .lte('encerrado_em', week.end.toISOString());
      if (!seeAll && userId) callsQuery = callsQuery.eq('consultor_id', userId);

      // Janela [semana anterior → fim desta semana] tanto por criação (métrica de agendamentos)
      // quanto por data do evento (visitas realizadas agendadas há mais tempo).
      const win = { lo: prevWeek.start.toISOString(), hi: week.end.toISOString() };
      let agendasQuery = (supabase.from('arqo_agendamentos' as any) as any)
        .select('responsavel_id, tipo, status, data_hora, created_at')
        .or(`and(created_at.gte.${win.lo},created_at.lte.${win.hi}),and(data_hora.gte.${win.lo},data_hora.lte.${win.hi})`);
      if (!seeAll && userId) agendasQuery = agendasQuery.eq('responsavel_id', userId);

      const [callsRes, agendasRes] = await Promise.all([callsQuery, agendasQuery]);
      if (callsRes.error) throw callsRes.error;
      if (agendasRes.error) throw agendasRes.error;

      const calls = (callsRes.data ?? []) as CallRow[];
      const agendas = (agendasRes.data ?? []) as AgendaRow[];

      // Resolve o nome de todos os usuários envolvidos (inclusive quem tem atividade mas
      // ainda não tem meta atribuída) para o filtro e os cards não caírem em "Usuário".
      const involvedIds = new Set<string>();
      for (const c of calls) if (c.consultor_id) involvedIds.add(c.consultor_id);
      for (const a of agendas) if (a.responsavel_id) involvedIds.add(a.responsavel_id);
      for (const m of metas) {
        for (const u of m.usuarios ?? []) involvedIds.add(u.user_id);
        if (m.user_id) involvedIds.add(m.user_id);
      }
      const names = new Map<string, string>();
      if (involvedIds.size > 0) {
        const profRes = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', [...involvedIds]);
        if (profRes.error) throw profRes.error;
        for (const p of profRes.data ?? []) names.set(p.id, p.full_name ?? 'Usuário');
      }

      return {
        ...aggregateArqoMetas(calls, agendas, metas, week, prevWeek, today, now, config, names),
        seeAll,
      };
    },
  });
}
