import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ArqoLead, ArqoLeadWithRelations, ArqoFunilEtapa, ArqoTemperatura,
  ArqoLeadSource, ArqoGrupo, ArqoGrupoMembro, ArqoSlaRegra, ArqoReguaReengajamento,
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
export function useArqoLeads(filters?: { etapaId?: string; consultorId?: string; grupoId?: string; empreendimentoId?: string }) {
  return useQuery({
    queryKey: ['arqo', 'leads', filters],
    queryFn: async () => {
      let q = supabase.from('arqo_leads').select(`
        *,
        cliente:cliente_id (id, nome, telefone, email, nivel_cadastro),
        etapa:etapa_id (id, nome, categoria, cor, ordem, peso, is_encerramento),
        temperatura:temperatura_id (id, nome, cor, peso),
        source:source_id (id, nome),
        consultor:consultor_id (id, full_name, email),
        empreendimento:empreendimento_id (id, nome)
      `).eq('is_active', true).order('updated_at', { ascending: false }).limit(500);
      if (filters?.etapaId) q = q.eq('etapa_id', filters.etapaId);
      if (filters?.consultorId) q = q.eq('consultor_id', filters.consultorId);
      if (filters?.grupoId) q = q.eq('grupo_id', filters.grupoId);
      if (filters?.empreendimentoId) q = q.eq('empreendimento_id', filters.empreendimentoId);
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
      toast.success('Lead atribuído');
    },
    onError: (e: any) => toast.error(e.message ?? 'Roleta bloqueada — nenhum consultor livre'),
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
      qc.invalidateQueries({ queryKey: ['arqo', 'lead-events'] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro'),
  });
}

export function useLiberarConsultor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.rpc('arqo_liberar_consultor', { p_lead_id: leadId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['arqo', 'leads'] }),
    onError: (e: any) => toast.error(e.message ?? 'Erro'),
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

export function useArqoForecast() {
  return useQuery({
    queryKey: ['arqo', 'forecast'],
    queryFn: async () => {
      const { data, error } = await supabase.from('arqo_vw_forecast_ponderado' as any).select('*');
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
  | 'arqo_regua_reengajamento';

const invalidationKey: Record<ConfigTable, string> = {
  arqo_lead_sources: 'sources',
  arqo_temperaturas: 'temperaturas',
  arqo_funil_etapas: 'etapas',
  arqo_grupos_atendimento: 'grupos',
  arqo_grupo_membros: 'grupo-membros',
  arqo_sla_regras: 'sla-regras',
  arqo_regua_reengajamento: 'regua',
};

export function useUpsertArqoConfig(table: ConfigTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { data, error } = await supabase.from(table).update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from(table).insert(payload).select().single();
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
      const { error } = await supabase.from(table).delete().eq('id', id);
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
        cliente:cliente_id (id, nome, telefone, email, cpf, nivel_cadastro, profissao, renda_mensal),
        etapa:etapa_id (id, nome, categoria, cor, ordem, peso, is_encerramento),
        temperatura:temperatura_id (id, nome, cor, peso),
        source:source_id (id, nome),
        consultor:consultor_id (id, full_name, email),
        empreendimento:empreendimento_id (id, nome)
      `).eq('id', id!).single();
      if (error) throw error;
      return data as unknown as ArqoLeadWithRelations;
    },
  });
}
