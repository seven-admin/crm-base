import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ArqoLead, ArqoLeadWithRelations, ArqoFunilEtapa, ArqoTemperatura,
  ArqoLeadSource, ArqoGrupo, ArqoGrupoMembro, ArqoSlaRegra, ArqoReguaReengajamento,
  ArqoAgendamento, ArqoAgendamentoWithRelations, ArqoAgendamentoStatus,
  ArqoHistoricoContato,
  ArqoAtendimentoOpcao, ArqoAtendimentoPayload, ArqoMetaAtendimento, ArqoPerformanceConfig,
} from '@/types/arqo.types';

// ============ Config queries ============
export function useArqoEtapas() {
  return useQuery({
    queryKey: ['arqo', 'etapas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_funil_etapas').select('*').eq('is_active', true).order('ordem');
      if (error) throw error;
      return (data ?? []) as ArqoFunilEtapa[];
    },
  });
}

export function useArqoTemperaturas() {
  return useQuery({
    queryKey: ['arqo', 'temperaturas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_temperaturas').select('*').eq('is_active', true).order('ordem');
      if (error) throw error;
      return (data ?? []) as ArqoTemperatura[];
    },
  });
}

export function useArqoSources() {
  return useQuery({
    queryKey: ['arqo', 'sources'],
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_lead_sources').select('*').eq('is_active', true).order('ordem');
      if (error) throw error;
      return (data ?? []) as ArqoLeadSource[];
    },
  });
}

export function useArqoGrupos() {
  return useQuery({
    queryKey: ['arqo', 'grupos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_grupos_atendimento').select('*').order('nome');
      if (error) throw error;
      return (data ?? []) as ArqoGrupo[];
    },
  });
}

export function useArqoGrupoMembros(grupoId?: string) {
  return useQuery({
    queryKey: ['arqo', 'grupo-membros', grupoId],
    enabled: !!grupoId,
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_grupo_membros').select('*').eq('grupo_id', grupoId!);
      if (error) throw error;
      return (data ?? []) as ArqoGrupoMembro[];
    },
  });
}

export function useArqoSlaRegras() {
  return useQuery({
    queryKey: ['arqo', 'sla-regras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_sla_regras').select('*').order('horas_max');
      if (error) throw error;
      return (data ?? []) as ArqoSlaRegra[];
    },
  });
}

export function useArqoRegua() {
  return useQuery({
    queryKey: ['arqo', 'regua'],
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_regua_reengajamento').select('*').order('ordem');
      if (error) throw error;
      return (data ?? []) as ArqoReguaReengajamento[];
    },
  });
}

// ============ Leads ============
export function useArqoLeads(filters?: { etapaId?: string; consultorId?: string; grupoId?: string; empreendimentoId?: string; atendidos?: boolean }) {
  return useQuery({
    queryKey: ['arqo', 'leads', filters],
    queryFn: async () => {
      let q = supabase.from('arqo_leads').select(`
        *,
        cliente:cliente_id (id, nome, telefone, whatsapp, email, nivel_cadastro),
        etapa:etapa_id (id, nome, categoria, cor, ordem, peso, is_encerramento, bloqueia_roleta),
        temperatura:temperatura_id (id, nome, cor, peso),
        source:source_id (id, nome),
        consultor:consultor_id (id, full_name, email),
        closer:closer_id (id, full_name, email),
        empreendimento:empreendimento_id (id, nome)
      `).eq('is_active', true).order('updated_at', { ascending: false }).limit(500);
      if (filters?.etapaId) q = q.eq('etapa_id', filters.etapaId);
      if (filters?.consultorId) q = q.eq('consultor_id', filters.consultorId);
      if (filters?.grupoId) q = q.eq('grupo_id', filters.grupoId);
      if (filters?.empreendimentoId) q = q.eq('empreendimento_id', filters.empreendimentoId);
      if (filters?.atendidos) q = q.not('ultimo_contato_em', 'is', null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ArqoLeadWithRelations[];
    },
  });
}

export function useCreateArqoLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ArqoLead>) => {
      const { data: user } = await supabase.auth.getUser();
      const insertPayload = { ...payload, created_by: user.user?.id ?? null } as any;
      const { data, error } = await supabase.from('arqo_leads').insert(insertPayload).select().single();
      if (error) throw error;
      return data as ArqoLead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-counters'] });
      toast.success('Lead criado');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao criar lead'),
  });
}

export function useTransicionarEtapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, etapaPara, comentario, motivoPerda }: { leadId: string; etapaPara: string; comentario?: string; motivoPerda?: string }) => {
      const { error } = await supabase.rpc('arqo_transicionar_status', {
        p_lead_id: leadId,
        p_etapa_para: etapaPara,
        p_comentario: comentario ?? null,
        p_motivo_perda: motivoPerda ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-counters'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'forecast'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-events'] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao mover etapa'),
  });
}

export function useAtribuirRoleta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ grupoId, leadId, tipo = 'roleta' }: { grupoId: string; leadId: string; tipo?: string }) => {
      const { data, error } = await supabase.rpc('arqo_atribuir_lead_roleta', {
        p_grupo_id: grupoId, p_lead_id: leadId, p_tipo_atribuicao: tipo,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-counters'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'fila-usuario'] });
      toast.success('Lead atribuído');
    },
    onError: (e: any) => toast.error(e.message ?? 'Roleta bloqueada — nenhum consultor livre'),
  });
}

export function usePuxarProximoLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (grupoId: string) => {
      const { data, error } = await supabase.rpc('arqo_puxar_proximo_lead' as any, { p_grupo_id: grupoId } as any);
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-counters'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'fila-usuario'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'dashboard-atendimento'] });
      toast.success('Próximo lead atribuído a você');
    },
    onError: (e: any) => {
      if (e.message?.includes('já possui um lead ativo')) {
        qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
        toast.info('Você já possui um atendimento em andamento.');
        return;
      }
      toast.error(e.message ?? 'Não foi possível puxar o próximo lead');
    },
  });
}

export function useArqoFilaUsuario(userId?: string) {
  return useQuery({
    queryKey: ['arqo', 'fila-usuario', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('arqo_contar_fila_usuario' as any);
      if (error) throw error;
      return (data ?? []) as Array<{ grupo_id: string; quantidade: number }>;
    },
  });
}

export function useArqoLeadCounters(userId?: string) {
  return useQuery({
    queryKey: ['arqo', 'lead-counters', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [visibleRes, mineRes, closedRes] = await Promise.all([
        supabase
          .from('arqo_leads')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('arqo_leads')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('consultor_id', userId!)
          .is('fechado_em', null)
          .is('optout_em', null),
        supabase
          .from('arqo_leads')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .not('fechado_em', 'is', null),
      ]);
      if (visibleRes.error) throw visibleRes.error;
      if (mineRes.error) throw mineRes.error;
      if (closedRes.error) throw closedRes.error;
      return {
        totalVisivel: visibleRes.count ?? 0,
        minhaCarteira: mineRes.count ?? 0,
        encerrados: closedRes.count ?? 0,
      };
    },
  });
}

export function useRegistrarTentativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, canal, comentario }: { leadId: string; canal?: string; comentario?: string }) => {
      const { error } = await supabase.rpc('arqo_registrar_tentativa', {
        p_lead_id: leadId, p_canal: canal ?? 'whatsapp', p_comentario: comentario ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-counters'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-events'] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro'),
  });
}

export function useLiberarConsultor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, comentario }: { leadId: string; comentario?: string }) => {
      const { error } = await supabase.rpc('arqo_liberar_consultor', {
        p_lead_id: leadId,
        p_comentario: comentario ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-events'] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro'),
  });
}

// Grupos onde o usuário atual é membro ativo
export function useMeusArqoGrupos(userId?: string) {
  return useQuery({
    queryKey: ['arqo', 'meus-grupos', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arqo_grupo_membros')
        .select('grupo_id, papel, grupo:grupo_id (id, nome, descricao, tipo, is_active)')
        .eq('user_id', userId!)
        .eq('is_active', true);
      if (error) throw error;
      return (data ?? [])
        .map((m: any) => ({ ...m.grupo, papel: m.papel }))
        .filter((g: any) => g && g.is_active) as Array<{ id: string; nome: string; descricao: string | null; tipo: string; is_active: boolean; papel: string }>;
    },
  });
}


export function useArqoLeadEvents(leadId?: string) {
  return useQuery({
    queryKey: ['arqo', 'lead-events', leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arqo_lead_events').select('*').eq('lead_id', leadId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useQualificarIA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.functions.invoke('arqo-qualificar-lead', { body: { lead_id: leadId } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-events'] });
      toast.success('Lead qualificado pela IA');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro na qualificação IA'),
  });
}

// ============ CRUD genérico para tabelas de configuração ============
type ConfigTable =
  | 'arqo_lead_sources'
  | 'arqo_temperaturas'
  | 'arqo_funil_etapas'
  | 'arqo_grupos_atendimento'
  | 'arqo_grupo_membros'
  | 'arqo_sla_regras'
  | 'arqo_regua_reengajamento'
  | 'arqo_atendimento_opcoes'
  | 'arqo_metas_atendimento'
  | 'arqo_performance_config';

const invalidationKey: Record<ConfigTable, string> = {
  arqo_lead_sources: 'sources',
  arqo_temperaturas: 'temperaturas',
  arqo_funil_etapas: 'etapas',
  arqo_grupos_atendimento: 'grupos',
  arqo_grupo_membros: 'grupo-membros',
  arqo_sla_regras: 'sla-regras',
  arqo_regua_reengajamento: 'regua',
  arqo_atendimento_opcoes: 'atendimento-opcoes',
  arqo_metas_atendimento: 'metas-atendimento',
  arqo_performance_config: 'performance-config',
};

export function useUpsertArqoConfig(table: ConfigTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { data, error } = await (supabase.from(table as any) as any).update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await (supabase.from(table as any) as any).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', invalidationKey[table]] });
      toast.success('Salvo');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao salvar'),
  });
}

export function useDeleteArqoConfig(table: ConfigTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(table as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', invalidationKey[table]] });
      toast.success('Removido');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao remover'),
  });
}

export function useArqoLead(id?: string) {
  return useQuery({
    queryKey: ['arqo', 'lead', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_leads').select(`
        *,
        cliente:cliente_id (id, nome, telefone, whatsapp, email, cpf, nivel_cadastro, profissao, renda_mensal),
        etapa:etapa_id (id, nome, categoria, cor, ordem, peso, is_encerramento, bloqueia_roleta),
        temperatura:temperatura_id (id, nome, cor, peso),
        source:source_id (id, nome),
        consultor:consultor_id (id, full_name, email),
        closer:closer_id (id, full_name, email),
        empreendimento:empreendimento_id (id, nome)
      `).eq('id', id!).single();
      if (error) throw error;
      return data as unknown as ArqoLeadWithRelations;
    },
  });
}

export function useAtualizarArqoTemperatura() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, temperaturaId }: { leadId: string; temperaturaId: string | null }) => {
      const { error } = await supabase.rpc('arqo_atualizar_temperatura_lead', {
        p_lead_id: leadId,
        p_temperatura_id: temperaturaId,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['arqo', 'lead', variables.leadId] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-events', variables.leadId] });
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-counters'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'dashboard'] });
      toast.success('Temperatura atualizada');
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível atualizar a temperatura'),
  });
}

// ============ Atendimento operacional ============
export function useArqoAtendimentoOpcoes(includeInactive = false) {
  return useQuery({
    queryKey: ['arqo', 'atendimento-opcoes', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('arqo_atendimento_opcoes' as any)
        .select('*')
        .order('grupo')
        .order('ordem');
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ArqoAtendimentoOpcao[];
    },
  });
}

export function useArqoHistoricoContatos() {
  return useQuery({
    queryKey: ['arqo', 'historico-contatos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arqo_atendimentos' as any)
        .select(`
          id,
          lead_id,
          consultor_id,
          status_codigo,
          observacao,
          acao_final,
          encerrado_em,
          lead_nome_snapshot,
          telefone_snapshot,
          whatsapp_snapshot,
          telefones_adicionais_snapshot,
          consultor:consultor_id (id, full_name)
        `)
        .order('encerrado_em', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as ArqoHistoricoContato[];
    },
  });
}

export function useReabrirAtendimentoHistorico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (atendimentoId: string) => {
      const { data, error } = await supabase.rpc('arqo_reabrir_atendimento_historico' as any, {
        p_atendimento_id: atendimentoId,
      } as any);
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-counters'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'fila-usuario'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'dashboard-atendimento'] });
      toast.success('Lead retomado para um novo atendimento');
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível iniciar o atendimento'),
  });
}

export function useConcluirArqoAtendimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ArqoAtendimentoPayload) => {
      const { data, error } = await supabase.rpc('arqo_concluir_atendimento' as any, {
        p_lead_id: payload.leadId,
        p_status_codigo: payload.statusCodigo,
        p_qualificacao_codigo: payload.qualificacaoCodigo ?? null,
        p_interesse_codigo: payload.interesseCodigo ?? null,
        p_perfil_codigo: payload.perfilCodigo ?? null,
        p_acao_codigo: payload.acaoCodigo ?? null,
        p_acao_data: payload.acaoData ?? null,
        p_temperatura_id: payload.temperaturaId ?? null,
        p_observacao: payload.observacao,
        p_acao_final: payload.acaoFinal,
        p_etapa_destino_id: payload.etapaDestinoId ?? null,
      } as any);
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-events'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'agendamentos'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'dashboard-atendimento'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'historico-contatos'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'fila-usuario'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-counters'] });
      toast.success('Atendimento registrado');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao registrar atendimento'),
  });
}

export function useCriarLeadIndicado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      leadOrigemId: string;
      nome: string;
      telefone?: string;
      email?: string;
      empreendimentoId?: string | null;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase.rpc('arqo_criar_lead_indicado' as any, {
        p_lead_origem_id: payload.leadOrigemId,
        p_nome: payload.nome,
        p_telefone: payload.telefone || null,
        p_email: payload.email || null,
        p_empreendimento_id: payload.empreendimentoId || null,
        p_observacoes: payload.observacoes || null,
      } as any);
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-counters'] });
      qc.invalidateQueries({ queryKey: ['arqo', 'fila-usuario'] });
      toast.success('Lead indicado criado e enviado para a fila');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao gerar lead indicado'),
  });
}

export function useArqoMetasAtendimento() {
  return useQuery({
    queryKey: ['arqo', 'metas-atendimento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arqo_metas_atendimento' as any)
        .select('*, usuarios:arqo_meta_usuarios(user_id, profile:profiles(id, full_name, email))')
        .order('vigencia_inicio', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ArqoMetaAtendimento[];
    },
  });
}

export function useArqoPerformanceConfigs() {
  return useQuery({
    queryKey: ['arqo', 'performance-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_performance_config' as any).select('*').order('is_default', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ArqoPerformanceConfig[];
    },
  });
}

// ============ Agenda de Atendimentos ============
const SELECT_AGENDAMENTO = `
  *,
  lead:lead_id (
    id,
    cliente:cliente_id (id, nome, telefone, email),
    empreendimento:empreendimento_id (id, nome)
  ),
  responsavel:responsavel_id (id, full_name),
  closer:closer_id (id, full_name)
`;

export function useArqoAgendamentos(filters?: {
  status?: ArqoAgendamentoStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  return useQuery({
    queryKey: ['arqo', 'agendamentos', filters],
    queryFn: async () => {
      let q = supabase
        .from('arqo_agendamentos')
        .select(SELECT_AGENDAMENTO, { count: 'exact' })
        .order('data_hora', { ascending: false });
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error, count } = await q.range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw error;
      const total = count ?? 0;
      return {
        agendamentos: (data ?? []) as unknown as ArqoAgendamentoWithRelations[],
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
  });
}

export function useCreateArqoAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ArqoAgendamento> & { lead_id: string; tipo: ArqoAgendamento['tipo']; data_hora: string }) => {
      const { data, error } = await supabase.from('arqo_agendamentos').insert(payload as any).select().single();
      if (error?.code === 'PGRST116' || (!error && !data)) {
        throw new Error('Já existe um agendamento ativo para este lead, tipo, data e horário');
      }
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'agendamentos'] });
      toast.success('Atendimento agendado');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao agendar'),
  });
}

export function useUpdateArqoAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ArqoAgendamento> }) => {
      const { error } = await supabase.from('arqo_agendamentos').update(patch as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'agendamentos'] });
      toast.success('Agendamento atualizado');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar agendamento'),
  });
}

export function useDeleteArqoAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('arqo_agendamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqo', 'agendamentos'] });
      toast.success('Agendamento excluído');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao excluir agendamento'),
  });
}
