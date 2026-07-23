import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { NexaVisita, NexaVisitaWithRelations, NexaEvento, NexaVisitaStatus, NexaWhatsappAtividade } from '@/types/nexa.types';

const SELECT_VISITA = `
  *,
  cliente:seven_clientes(id, nome, telefone, email),
  empreendimento:seven_empreendimentos(id, nome),
  imobiliaria:seven_imobiliarias!nexa_visitas_imobiliaria_parceira_id_fkey(id, nome),
  corretor:seven_corretores(id, nome_completo),
  criador:profiles!nexa_visitas_created_by_fkey(id, full_name, email)
`;

// ============ Visitas ============
export function useNexaVisitas(filters?: { empreendimento_id?: string; status?: NexaVisitaStatus }) {
  return useQuery({
    queryKey: ['nexa', 'visitas', filters],
    queryFn: async () => {
      let q = supabase.from('nexa_visitas').select(SELECT_VISITA).order('data_hora', { ascending: false });
      if (filters?.empreendimento_id) q = q.eq('empreendimento_id', filters.empreendimento_id);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as NexaVisitaWithRelations[];
    },
  });
}

export function useNexaVisita(id?: string) {
  return useQuery({
    queryKey: ['nexa', 'visita', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('nexa_visitas').select(SELECT_VISITA).eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as unknown as NexaVisitaWithRelations | null;
    },
  });
}

export function useNexaEventos(visitaId?: string) {
  return useQuery({
    queryKey: ['nexa', 'eventos', visitaId],
    enabled: !!visitaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nexa_visitas_eventos')
        .select('*')
        .eq('visita_id', visitaId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as NexaEvento[];
    },
  });
}

export function useCreateVisita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<NexaVisita> & { data_hora: string; empreendimento_id: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const insert = { ...payload, created_by: u.user?.id ?? null };
      const { data, error } = await supabase.from('nexa_visitas').insert(insert as any).select().single();
      if (error) throw error;

      await supabase.from('nexa_visitas_eventos').insert({
        visita_id: data.id,
        tipo_evento: 'criada',
        usuario_id: u.user?.id ?? null,
        payload: { status: data.status },
      } as any);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'visitas'] });
      toast.success('Visita agendada');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao agendar visita'),
  });
}

export function useUpdateVisitaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: NexaVisitaStatus }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from('nexa_visitas').update({ status }).eq('id', id);
      if (error) throw error;
      await supabase.from('nexa_visitas_eventos').insert({
        visita_id: id,
        tipo_evento: status,
        usuario_id: u.user?.id ?? null,
        payload: {},
      } as any);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['nexa', 'visitas'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'visita', vars.id] });
      qc.invalidateQueries({ queryKey: ['nexa', 'eventos', vars.id] });
      toast.success('Status atualizado');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar status'),
  });
}

export function useUpdateVisita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<NexaVisita> }) => {
      const { error } = await supabase.from('nexa_visitas').update(patch as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['nexa', 'visitas'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'visita', vars.id] });
      toast.success('Visita atualizada');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar visita'),
  });
}

export function useDeleteVisita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('nexa_delete_visita' as any, { p_id: id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'visitas'] });
      toast.success('Visita excluída');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao excluir visita'),
  });
}

// ============ Cliente lookup / criação ============
export async function buscarClientePorTelefone(telefone: string) {
  const clean = telefone.replace(/\D/g, '');
  if (!clean) return null;
  const { data } = await supabase
    .from('seven_clientes')
    .select('id, nome, telefone, email, whatsapp')
    .or(`telefone.ilike.%${clean}%,whatsapp.ilike.%${clean}%`)
    .limit(5);
  return data ?? [];
}

export async function getOrCreatePessoa(nome: string, telefone: string, email?: string) {
  const { data, error } = await supabase.rpc('get_or_create_pessoa', {
    p_nome: nome,
    p_telefone: telefone,
    p_email: email ?? null,
  } as any);
  if (error) throw error;
  return data as string;
}

// ============ Empreendimentos / Unidades / Boxes ============
export function useEmpreendimentosAtivos() {
  return useQuery({
    queryKey: ['nexa', 'empreendimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seven_empreendimentos')
        .select('id, nome')
        .eq('is_active', true)
        .order('nome');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useImobiliariasAtivas() {
  return useQuery({
    queryKey: ['nexa', 'imobiliarias'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_imobiliarias_ativas');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUnidadesDisponiveis(empreendimentoId?: string, statuses?: string[]) {
  return useQuery({
    queryKey: ['nexa', 'unidades-disp', empreendimentoId, statuses?.join(',') ?? 'disp'],
    enabled: !!empreendimentoId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unidades_disponiveis', {
        p_empreendimento_id: empreendimentoId,
        p_status: statuses ?? ['disponivel'],
      } as any);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateUnidadeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ unidadeId, status }: { unidadeId: string; status: string }) => {
      const { error } = await supabase
        .from('seven_unidades')
        .update({ status: status as any })
        .eq('id', unidadeId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'unidades-disp'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'boxes-disp'] });
      toast.success('Status atualizado');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar status'),
  });
}

export function useBoxesDisponiveis(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['nexa', 'boxes-disp', empreendimentoId],
    enabled: !!empreendimentoId,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seven_boxes')
        .select('id, numero, empreendimento_id, status')
        .eq('empreendimento_id', empreendimentoId!)
        .eq('status', 'disponivel')
        .order('numero');
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ============ Ação Reservar/Vender/Bloquear (UPDATE direto com detecção de conflito) ============
type UnidadeAcao = 'reservar' | 'vender' | 'bloquear';
const ACAO_TO_STATUS: Record<UnidadeAcao, string> = {
  reservar: 'reservada',
  vender: 'vendida',
  bloquear: 'bloqueada',
};

export function useAcaoUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      visitaId,
      unidadeId,
      boxIds,
      acao,
    }: {
      visitaId: string;
      unidadeId: string;
      boxIds: string[];
      acao: UnidadeAcao;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const novoStatus = ACAO_TO_STATUS[acao];

      // UPDATE atômico só se ainda disponível
      const { data: updated, error: uerr } = await supabase
        .from('seven_unidades')
        .update({ status: novoStatus as any })
        .eq('id', unidadeId)
        .eq('status', 'disponivel')
        .select('id');

      if (uerr) throw uerr;

      const conflito = !updated || updated.length === 0;

      if (conflito) {
        await supabase.from('nexa_visitas_eventos').insert({
          visita_id: visitaId,
          tipo_evento: `${acao}_conflito`,
          unidade_id: unidadeId,
          usuario_id: u.user?.id ?? null,
          payload: { motivo: 'Unidade não estava mais disponível' },
        } as any);
        throw new Error('Conflito: unidade já foi reservada, vendida ou bloqueada por outro usuário.');
      }

      // Boxes (atualização condicional)
      const boxesConflito: string[] = [];
      for (const bid of boxIds) {
        const { data: bup, error: berr } = await supabase
          .from('seven_boxes')
          .update({ status: novoStatus as any })
          .eq('id', bid)
          .eq('status', 'disponivel')
          .select('id');
        if (berr) throw berr;
        if (!bup || bup.length === 0) boxesConflito.push(bid);
      }

      await supabase.from('nexa_visitas_eventos').insert({
        visita_id: visitaId,
        tipo_evento: `${acao}_sucesso`,
        unidade_id: unidadeId,
        usuario_id: u.user?.id ?? null,
        payload: { box_ids: boxIds, boxes_conflito: boxesConflito, novo_status: novoStatus },
      } as any);

      return { boxesConflito };
    },
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ['nexa', 'unidades-disp'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'boxes-disp'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'eventos', vars.visitaId] });
      if (res.boxesConflito.length > 0) {
        toast.warning(`Ação concluída, mas ${res.boxesConflito.length} box(es) já haviam sido tomados.`);
      } else {
        toast.success('Ação registrada com sucesso');
      }
    },
    onError: (e: any) => toast.error(e.message || 'Erro na operação'),
  });
}

// ============ WhatsApp — Atividades (gerado por automação n8n) ============
export function useNexaWhatsappAtividades(filters?: { search?: string; categoria?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['nexa', 'whatsapp-atividades', filters],
    queryFn: async () => {
      let q = supabase.from('nexa_whatsapp_atividades').select('*').order('data', { ascending: false });
      if (filters?.categoria) q = q.eq('categoria', filters.categoria);
      if (filters?.dateFrom) q = q.gte('data', filters.dateFrom);
      if (filters?.dateTo) q = q.lte('data', filters.dateTo);
      if (filters?.search) q = q.or(`nome.ilike.%${filters.search}%,whatsapp.ilike.%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as NexaWhatsappAtividade[];
    },
  });
}

export function useNexaWhatsappCategorias() {
  return useQuery({
    queryKey: ['nexa', 'whatsapp-atividades-categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nexa_whatsapp_atividades')
        .select('categoria')
        .not('categoria', 'is', null)
        .limit(5000);
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((r) => { if (r.categoria) set.add(r.categoria); });
      return Array.from(set).sort();
    },
  });
}

export function useDeleteNexaWhatsappAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nexa_whatsapp_atividades').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'whatsapp-atividades'] });
      toast.success('Registro excluído');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao excluir'),
  });
}
