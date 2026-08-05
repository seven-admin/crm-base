import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfDay, endOfWeek, startOfDay, startOfWeek, subWeeks } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  NexaAtividade,
  NexaAtividadeTipo,
  NexaAtividadeSubtipo,
  NexaAtividadeWithRelations,
  NexaMeta,
  NexaVisitaStatus,
} from '@/types/nexa.types';

// As tabelas nexa_* desta entrega ainda não estão nos types gerados; casts `as any`
// seguem o mesmo padrão já usado nos hooks da ARQO (ex.: useArqoMetasAtendimento).
/* eslint-disable @typescript-eslint/no-explicit-any */

const SELECT_ATIVIDADE = `
  *,
  participantes:nexa_atividade_participantes(corretor_id, corretor_nome, imobiliaria_nome),
  criador:profiles!nexa_atividades_created_by_fkey(id, full_name, email),
  cliente:seven_clientes(id, nome, telefone, email),
  empreendimento:seven_empreendimentos(id, nome),
  imobiliaria:seven_imobiliarias(id, nome),
  corretor:seven_corretores(id, nome_completo)
`;

// ============ Registro de atividades ============
export function useNexaAtividades(filters?: { tipo?: NexaAtividadeTipo; mineOnly?: boolean; userId?: string }) {
  return useQuery({
    queryKey: ['nexa', 'atividades', filters],
    queryFn: async () => {
      let q = (supabase.from('nexa_atividades' as any) as any)
        .select(SELECT_ATIVIDADE)
        .order('data_hora', { ascending: false });
      if (filters?.tipo) q = q.eq('tipo', filters.tipo);
      if (filters?.userId) q = q.eq('created_by', filters.userId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as NexaAtividadeWithRelations[];
    },
  });
}

export interface ParticipanteInput {
  corretor_id: string;
  corretor_nome: string | null;
  imobiliaria_nome: string | null;
}

type AtividadeInput = {
  tipo: NexaAtividadeTipo;
  subtipo?: NexaAtividadeSubtipo | null;
  data_hora: string;
  local?: string | null;
  qtd_pessoas?: number | null;
  observacoes?: string | null;
  participantes: ParticipanteInput[];
  // Atendimento (cliente):
  cliente_id?: string | null;
  visitante_nome?: string | null;
  visitante_telefone?: string | null;
  empreendimento_id?: string | null;
  imobiliaria_id?: string | null;
  corretor_id?: string | null;
  status?: NexaVisitaStatus | null;
};

// Campos gravados conforme a categoria; o resto vai nulo.
function atividadeColumns(input: AtividadeInput) {
  const isMercado = input.tipo === 'visita';
  const isAtend = input.tipo === 'atendimento';
  return {
    tipo: input.tipo,
    subtipo: isMercado ? (input.subtipo ?? null) : null,
    data_hora: input.data_hora,
    local: isMercado ? (input.local ?? null) : null,
    qtd_pessoas: isMercado ? (input.qtd_pessoas ?? null) : null,
    observacoes: input.observacoes ?? null,
    cliente_id: isAtend ? (input.cliente_id ?? null) : null,
    visitante_nome: isAtend ? (input.visitante_nome ?? null) : null,
    visitante_telefone: isAtend ? (input.visitante_telefone ?? null) : null,
    empreendimento_id: isAtend ? (input.empreendimento_id ?? null) : null,
    imobiliaria_id: isAtend ? (input.imobiliaria_id ?? null) : null,
    corretor_id: isAtend ? (input.corretor_id ?? null) : null,
    status: isAtend ? (input.status ?? 'agendada') : null,
  };
}

async function syncParticipantes(atividadeId: string, participantes: ParticipanteInput[]) {
  await (supabase.from('nexa_atividade_participantes' as any) as any)
    .delete()
    .eq('atividade_id', atividadeId);
  if (participantes.length === 0) return;
  const rows = participantes.map((p) => ({ atividade_id: atividadeId, ...p }));
  const { error } = await (supabase.from('nexa_atividade_participantes' as any) as any).insert(rows);
  if (error) throw error;
}

export function useCreateNexaAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AtividadeInput) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await (supabase.from('nexa_atividades' as any) as any)
        .insert({ ...atividadeColumns(input), created_by: u.user?.id ?? null })
        .select('id')
        .single();
      if (error) throw error;
      if (input.tipo === 'visita') await syncParticipantes(data.id, input.participantes);
      if (input.tipo === 'atendimento') {
        // Registra o histórico igual à antiga criação de visita.
        await (supabase.from('nexa_visitas_eventos' as any) as any).insert({
          visita_id: data.id, tipo_evento: 'criada', usuario_id: u.user?.id ?? null,
          payload: { status: input.status ?? 'agendada' },
        });
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'atividades'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'metas-dashboard'] });
      toast.success('Atividade registrada');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao registrar atividade'),
  });
}

export function useUpdateNexaAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AtividadeInput }) => {
      const { error } = await (supabase.from('nexa_atividades' as any) as any)
        .update(atividadeColumns(input))
        .eq('id', id);
      if (error) throw error;
      await syncParticipantes(id, input.tipo === 'visita' ? input.participantes : []);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'atividades'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'metas-dashboard'] });
      toast.success('Atividade atualizada');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar atividade'),
  });
}

export function useDeleteNexaAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('nexa_atividades' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'atividades'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'metas-dashboard'] });
      toast.success('Atividade excluída');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao excluir atividade'),
  });
}

// ============ Participantes: corretores por imobiliária ============
export interface CorretorOption {
  id: string;
  nome_completo: string;
  imobiliaria: { id: string; nome: string } | null;
}

export function useNexaCorretoresPorImobiliaria() {
  return useQuery({
    queryKey: ['nexa', 'corretores-por-imobiliaria'],
    queryFn: async () => {
      // Corretores vêm do banco da NEXA (app_user_profiles), via edge function read-only.
      const { data, error } = await supabase.functions.invoke('nexa-usuarios', {
        body: {
          select: 'id,name,real_estate_name',
          params: { role: 'eq.corretor', is_active: 'eq.true', order: 'name' },
          limit: 2000,
        },
      });
      if (error) throw error;
      const rows = (data?.rows ?? []) as Array<{ id: string; name: string; real_estate_name: string | null }>;
      return rows.map((r) => ({
        id: r.id,
        nome_completo: r.name,
        imobiliaria: r.real_estate_name ? { id: r.real_estate_name, nome: r.real_estate_name } : null,
      })) as CorretorOption[];
    },
  });
}

// ============ Metas ============
export function useNexaMetas() {
  return useQuery({
    queryKey: ['nexa', 'metas'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('nexa_metas' as any) as any)
        .select('*, usuarios:nexa_meta_usuarios(user_id, profile:profiles(id, full_name, email))')
        .order('vigencia_inicio', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NexaMeta[];
    },
  });
}

export function useSaveNexaMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      nome: string;
      vigenciaInicio: string;
      vigenciaFim: string;
      semanalVisitas: number;
      semanalAtendimentos: number;
      semanalImpacto: number;
      semanalEngajamento: number;
      semanalVgv: number;
      isActive: boolean;
      userIds: string[];
    }) => {
      const { data, error } = await supabase.rpc('nexa_salvar_meta' as any, {
        p_meta_id: payload.id ?? null,
        p_nome: payload.nome.trim(),
        p_vigencia_inicio: payload.vigenciaInicio,
        p_vigencia_fim: payload.vigenciaFim || null,
        p_meta_semanal_visitas: payload.semanalVisitas,
        p_meta_semanal_atendimentos: payload.semanalAtendimentos,
        p_meta_semanal_impacto: payload.semanalImpacto,
        p_meta_semanal_engajamento: payload.semanalEngajamento,
        p_meta_semanal_vgv: payload.semanalVgv,
        p_is_active: payload.isActive,
        p_user_ids: payload.userIds,
      } as any);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'metas'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'metas-dashboard'] });
      toast.success('Meta salva e atribuída aos usuários');
    },
    onError: (e: any) => toast.error(e.message || 'Não foi possível salvar a meta'),
  });
}

export function useDeleteNexaMeta() {
  const qc = useQueryClient();
  return useMutation({
    // Hard delete via RPC super_admin: falha com erro (não silencioso) se sem permissão.
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('nexa_excluir_meta' as any, { p_meta_id: id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'metas'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'metas-dashboard'] });
      toast.success('Meta excluída');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao excluir meta'),
  });
}

// ============ Agregação (pura, testável) ============
export type NexaPerfLevel = 'bom' | 'atencao' | 'critico' | 'sem_meta';

export interface NexaMetricSet {
  visitas: number;
  atendimentos: number;
  impacto: number;      // corretores distintos na janela
  engajamento: number;  // corretores em 2+ atividades na janela
}

export interface NexaConsultorCard {
  userId: string;
  nome: string;
  meta: NexaMetricSet;
  metaVgv: number;       // meta semanal de VGV (R$); realizado ainda sem fonte
  semana: NexaMetricSet;
  semanaAnterior: NexaMetricSet;
  hoje: { visitas: number; atendimentos: number };
  performanceAtual: { score: number | null; level: NexaPerfLevel };
  performanceAnterior: { score: number | null; level: NexaPerfLevel };
}

export interface NexaDashboardResult {
  cards: NexaConsultorCard[];
  totals: { meta: NexaMetricSet; semana: NexaMetricSet; metaVgv: number };
}

export type AtividadeParaAgregar = {
  created_by: string | null;
  tipo: string;
  data_hora: string;
  participantes?: Array<{ corretor_id: string }> | null;
};

const emptyMetrics = (): NexaMetricSet => ({ visitas: 0, atendimentos: 0, impacto: 0, engajamento: 0 });

function inRange(iso: string, start: Date, end: Date) {
  const d = new Date(iso);
  return d >= start && d <= end;
}

// Métricas de UM usuário numa janela: conta visitas/atendimentos e deriva
// impacto (corretores distintos) e engajamento (corretores em 2+ atividades).
function metricsForUser(atividades: AtividadeParaAgregar[], start: Date, end: Date): NexaMetricSet {
  const m = emptyMetrics();
  const corretorHits = new Map<string, number>();
  for (const a of atividades) {
    if (!inRange(a.data_hora, start, end)) continue;
    if (a.tipo === 'visita') m.visitas += 1;
    else if (a.tipo === 'atendimento') m.atendimentos += 1;
    for (const p of a.participantes ?? []) {
      corretorHits.set(p.corretor_id, (corretorHits.get(p.corretor_id) ?? 0) + 1);
    }
  }
  m.impacto = corretorHits.size;
  m.engajamento = [...corretorHits.values()].filter((n) => n >= 2).length;
  return m;
}

function performance(actual: NexaMetricSet, target: NexaMetricSet): { score: number | null; level: NexaPerfLevel } {
  const keys: Array<keyof NexaMetricSet> = ['visitas', 'atendimentos', 'impacto', 'engajamento'];
  let total = 0;
  let count = 0;
  for (const k of keys) {
    if (target[k] <= 0) continue;
    total += (actual[k] / target[k]) * 100;
    count += 1;
  }
  if (count === 0) return { score: null, level: 'sem_meta' };
  const score = total / count;
  const level: NexaPerfLevel = score >= 100 ? 'bom' : score >= 70 ? 'atencao' : 'critico';
  return { score, level };
}

/**
 * Monta um card por consultor: métricas da semana atual, da semana anterior e de hoje,
 * casadas com a meta vigente (meta ativa mais recente cuja vigência cobre `reference`).
 * Pura: recebe as atividades (com participantes) e as janelas; sem rede.
 */
export function aggregateNexaMetas(
  atividades: AtividadeParaAgregar[],
  metas: NexaMeta[],
  week: { start: Date; end: Date },
  prevWeek: { start: Date; end: Date },
  today: { start: Date; end: Date },
  reference: Date,
): NexaDashboardResult {
  const ref = reference.toISOString().slice(0, 10);
  const activeMetas = metas
    .filter((m) => m.is_active && m.vigencia_inicio <= ref && (!m.vigencia_fim || m.vigencia_fim >= ref))
    .sort((a, b) => b.vigencia_inicio.localeCompare(a.vigencia_inicio));

  const userMeta = new Map<string, { nome: string; meta: NexaMetricSet; metaVgv: number }>();
  for (const meta of activeMetas) {
    for (const u of meta.usuarios ?? []) {
      if (userMeta.has(u.user_id)) continue; // lista desc → primeira é a mais recente
      userMeta.set(u.user_id, {
        nome: u.profile?.full_name ?? 'Usuário',
        meta: {
          visitas: meta.meta_semanal_visitas,
          atendimentos: meta.meta_semanal_atendimentos,
          impacto: meta.meta_semanal_impacto,
          engajamento: meta.meta_semanal_engajamento,
        },
        metaVgv: meta.meta_semanal_vgv ?? 0,
      });
    }
  }

  const byUser = new Map<string, AtividadeParaAgregar[]>();
  for (const a of atividades) {
    if (!a.created_by) continue;
    const arr = byUser.get(a.created_by) ?? [];
    arr.push(a);
    byUser.set(a.created_by, arr);
  }

  const userIds = new Set<string>([...userMeta.keys(), ...byUser.keys()]);
  const cards: NexaConsultorCard[] = [...userIds].map((userId) => {
    const info = userMeta.get(userId);
    const meta = info?.meta ?? emptyMetrics();
    const acts = byUser.get(userId) ?? [];
    const semana = metricsForUser(acts, week.start, week.end);
    const semanaAnterior = metricsForUser(acts, prevWeek.start, prevWeek.end);
    const hojeMetrics = metricsForUser(acts, today.start, today.end);
    return {
      userId,
      nome: info?.nome ?? 'Usuário',
      meta,
      metaVgv: info?.metaVgv ?? 0,
      semana,
      semanaAnterior,
      hoje: { visitas: hojeMetrics.visitas, atendimentos: hojeMetrics.atendimentos },
      performanceAtual: performance(semana, meta),
      performanceAnterior: performance(semanaAnterior, meta),
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  const sum = (pick: (c: NexaConsultorCard) => NexaMetricSet) =>
    cards.reduce((acc, c) => {
      const v = pick(c);
      acc.visitas += v.visitas; acc.atendimentos += v.atendimentos;
      acc.impacto += v.impacto; acc.engajamento += v.engajamento;
      return acc;
    }, emptyMetrics());

  const metaVgvTotal = cards.reduce((acc, c) => acc + c.metaVgv, 0);
  return { cards, totals: { meta: sum((c) => c.meta), semana: sum((c) => c.semana), metaVgv: metaVgvTotal } };
}

// Consolida vários cards num único (soma métricas/metas); performance recalculada do total.
export function aggregateConsultorCards(cards: NexaConsultorCard[], nome = 'Todos os usuários'): NexaConsultorCard {
  const sumSet = (pick: (c: NexaConsultorCard) => NexaMetricSet) =>
    cards.reduce((acc, c) => {
      const v = pick(c);
      acc.visitas += v.visitas; acc.atendimentos += v.atendimentos;
      acc.impacto += v.impacto; acc.engajamento += v.engajamento;
      return acc;
    }, emptyMetrics());
  const meta = sumSet((c) => c.meta);
  const semana = sumSet((c) => c.semana);
  const semanaAnterior = sumSet((c) => c.semanaAnterior);
  const hoje = cards.reduce(
    (a, c) => ({ visitas: a.visitas + c.hoje.visitas, atendimentos: a.atendimentos + c.hoje.atendimentos }),
    { visitas: 0, atendimentos: 0 },
  );
  return {
    userId: 'todos',
    nome,
    meta,
    metaVgv: cards.reduce((a, c) => a + c.metaVgv, 0),
    semana,
    semanaAnterior,
    hoje,
    performanceAtual: performance(semana, meta),
    performanceAnterior: performance(semanaAnterior, meta),
  };
}

// ============ Dashboard hook ============
export function useNexaMetasDashboard() {
  const { user, role } = useAuth();
  const userId = user?.id;
  // Só super_admin vê o consolidado/todos os usuários; os demais veem apenas o próprio card.
  const seeAll = role === 'super_admin';

  const now = new Date();
  const week = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  const prevWeek = {
    start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
    end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
  };
  const today = { start: startOfDay(now), end: endOfDay(now) };

  return useQuery({
    queryKey: ['nexa', 'metas-dashboard', userId, seeAll, week.start.toISOString()],
    enabled: !!userId,
    queryFn: async (): Promise<NexaDashboardResult & { seeAll: boolean }> => {
      const metasRes = await (supabase.from('nexa_metas' as any) as any)
        .select('*, usuarios:nexa_meta_usuarios(user_id, profile:profiles(id, full_name, email))')
        .eq('is_active', true);
      if (metasRes.error) throw metasRes.error;
      let metas = (metasRes.data ?? []) as unknown as NexaMeta[];

      if (!seeAll && userId) {
        metas = metas
          .map((m) => ({ ...m, usuarios: (m.usuarios ?? []).filter((u) => u.user_id === userId) }))
          .filter((m) => (m.usuarios ?? []).length > 0);
      }

      let atvQuery = (supabase.from('nexa_atividades' as any) as any)
        .select('created_by, tipo, data_hora, participantes:nexa_atividade_participantes(corretor_id)')
        .gte('data_hora', prevWeek.start.toISOString())
        .lte('data_hora', week.end.toISOString());
      if (!seeAll && userId) atvQuery = atvQuery.eq('created_by', userId);
      const atvRes = await atvQuery;
      if (atvRes.error) throw atvRes.error;
      const atividades = (atvRes.data ?? []) as AtividadeParaAgregar[];

      return { ...aggregateNexaMetas(atividades, metas, week, prevWeek, today, now), seeAll };
    },
  });
}
