import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { invalidateDashboards } from '@/lib/invalidateDashboards';
import { dispararWebhook, getUsuarioLogado, isSuperAdmin } from '@/lib/webhookUtils';
import type { 
  Atividade, 
  AtividadeFormData, 
  AtividadeFilters, 
  ConcluirAtividadeData,
  ConfiguracoesAtividades,
} from '@/types/atividades.types';



function normalizeUpper(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  return trimmed ? trimmed.toUpperCase() : trimmed;
}

function normalizeAtividadeForSave<T extends Record<string, any>>(data: T): T {
  return {
    ...data,
    titulo: normalizeUpper(data.titulo),
    observacoes: normalizeUpper(data.observacoes),
    resultado: normalizeUpper(data.resultado),
  };
}

export interface UseAtividadesOptions {
  filters?: AtividadeFilters;
  page?: number;
  pageSize?: number;
}

function applyAtividadesFilters(query: any, filters?: AtividadeFilters) {
  let q = query as any;
  if (filters?.tipo) q = q.eq('tipo', filters.tipo);
  if (filters?.subtipo) q = q.eq('subtipo', filters.subtipo);
  if (filters?.categoria) q = q.eq('categoria', filters.categoria);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.responsavel_id) q = q.eq('gestor_id', filters.responsavel_id);
  if (filters?.created_by) q = q.eq('created_by', filters.created_by);
  // Suporte a múltiplos empreendimentos (portal incorporador)
  if (filters?.empreendimento_ids?.length) {
    q = q.in('empreendimento_id', filters.empreendimento_ids);
  } else if (filters?.empreendimento_id) {
    q = q.eq('empreendimento_id', filters.empreendimento_id);
  }
  if (filters?.cliente_id) q = q.eq('cliente_id', filters.cliente_id);
  // Filtrar por período: atividades que se sobrepõem ao intervalo solicitado
  if (filters?.data_inicio) q = q.lte('data_inicio', filters.data_inicio);
  if (filters?.data_fim) q = q.gte('data_fim', filters.data_fim);
  return q;
}

export function useAtividades(options: UseAtividadesOptions = {}) {
  const { filters, page = 1, pageSize = 20 } = options;

  return useQuery({
    queryKey: ['atividades', filters, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // NOTE: Tipos do Supabase podem ficar defasados quando o schema muda.
      // Para evitar TS2589 (inferência profunda) e manter o build verde,
      // usamos um cast pontual aqui, preservando o retorno tipado do hook.
      let countQuery = supabase
        .from('atividades' as any)
        .select('*', { count: 'exact', head: true }) as any;

      let dataQuery = supabase
        .from('atividades' as any)
        .select(
          `
          *,
          cliente:clientes(id, nome, temperatura),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          empreendimento:empreendimentos(id, nome),
          gestor:profiles(id, full_name)
        `
        ) as any;

      countQuery = applyAtividadesFilters(countQuery, filters);
      dataQuery = applyAtividadesFilters(dataQuery, filters);

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      dataQuery = dataQuery
        // Lista em /atividades: sempre mais recentes primeiro
        .order('data_inicio', { ascending: false })
        .range(from, to);

      const { data, error } = await dataQuery;
      if (error) throw error;

      return {
        items: (data as unknown as Atividade[]) || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
  });
}

export function useAtividadesStatusResumo(options: { filters?: AtividadeFilters } = {}) {
  const { filters } = options;

  return useQuery({
    queryKey: ['atividades-resumo-status', filters],
    queryFn: async () => {
      const statuses = ['pendente', 'concluida', 'cancelada'] as const;

      const results = await Promise.all(
        statuses.map(async (status) => {
          let q = supabase
            .from('atividades' as any)
            .select('*', { count: 'exact', head: true }) as any;

          q = applyAtividadesFilters(q, { ...(filters || {}), status });

          const { count, error } = await q;
          if (error) throw error;
          return [status, count || 0] as const;
        })
      );

      const resumo = {
        pendente: 0,
        concluida: 0,
        cancelada: 0,
        total: 0,
      };

      results.forEach(([status, count]) => {
        (resumo as any)[status] = count;
        resumo.total += count;
      });

      return resumo;
    },
  });
}

export function useAtividade(id: string | undefined) {
  return useQuery({
    queryKey: ['atividade', id],
    queryFn: async (): Promise<Atividade | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo), imobiliaria:imobiliarias(id, nome), empreendimento:empreendimentos(id, nome), gestor:profiles(id, full_name)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as Atividade;
    },
    enabled: !!id,
  });
}

export function useCreateAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: AtividadeFormData) => {
      const payload = normalizeAtividadeForSave(formData);
      const { data, error } = await supabase.from('atividades').insert(payload).select().single();
      if (error) throw error;

      // Criar notificação para o gestor atribuído (se diferente do criador)
      if (data.gestor_id) {
        const { data: currentUser } = await supabase.auth.getUser();
        if (currentUser?.user?.id && currentUser.user.id !== data.gestor_id) {
          await supabase.from('notificacoes').insert({
            user_id: data.gestor_id,
            tipo: 'atividade_atribuida',
            titulo: 'Nova atividade atribuída',
            mensagem: `A atividade "${data.titulo}" foi atribuída a você.`,
            referencia_id: data.id,
            referencia_tipo: 'atividade',
          }).then(() => {});
        }

        // Webhook: atividade criada por super_admin
        if (currentUser?.user?.id) {
          const superAdmin = await isSuperAdmin(currentUser.user.id);
          if (superAdmin) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('id', currentUser.user.id)
              .maybeSingle();

            const { data: gestorProfile } = await supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('id', data.gestor_id)
              .maybeSingle();

            const { data: empreendimento } = data.empreendimento_id
              ? await supabase.from('empreendimentos').select('nome').eq('id', data.empreendimento_id).maybeSingle()
              : { data: null };

            dispararWebhook('atividade_criada_por_superadmin', {
              titulo: data.titulo,
              criado_por: { id: currentUser.user.id, nome: profile?.full_name || 'Super Admin', telefone: profile?.phone || null },
              gestores: [{ id: data.gestor_id, nome: gestorProfile?.full_name || 'Gestor', telefone: gestorProfile?.phone || null }],
              data_inicio: data.data_inicio,
              data_fim: data.data_fim,
              tipo: data.tipo,
              empreendimento: empreendimento?.nome || null,
            });
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar atividade'),
  });
}

// Hook para criar atividades em lote para múltiplos gestores
export function useCreateAtividadesParaGestores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ formData, gestorIds }: { formData: Omit<AtividadeFormData, 'gestor_id'>; gestorIds: string[] }) => {
      // Criar uma atividade para cada gestor
      const atividadesParaInserir = gestorIds.map(gestorId => ({
        ...(normalizeAtividadeForSave(formData) as Omit<AtividadeFormData, 'gestor_id'>),
        gestor_id: gestorId,
      }));

      const { data, error } = await supabase.from('atividades').insert(atividadesParaInserir).select();
      if (error) throw error;

      // Webhook: atividade criada por super_admin em lote
      const usuario = await getUsuarioLogado();
      if (usuario && await isSuperAdmin(usuario.id)) {
        const { data: gestoresProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', gestorIds);

        const { data: empreendimento } = formData.empreendimento_id
          ? await supabase.from('empreendimentos').select('nome').eq('id', formData.empreendimento_id).maybeSingle()
          : { data: null };

        dispararWebhook('atividade_criada_por_superadmin', {
          titulo: formData.titulo,
          criado_por: { id: usuario.id, nome: usuario.nome, telefone: usuario.telefone },
          gestores: (gestoresProfiles || []).map(g => ({ id: g.id, nome: g.full_name || 'Gestor', telefone: g.phone || null })),
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim,
          tipo: formData.tipo,
          empreendimento: empreendimento?.nome || null,
        });
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      invalidateDashboards(queryClient);
      toast.success(`${data.length} atividade(s) criada(s) com sucesso!`);
    },
    onError: () => toast.error('Erro ao criar atividades para gestores'),
  });
}

export function useUpdateAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AtividadeFormData> }) => {
      const payload = normalizeAtividadeForSave(data);
      const { data: result, error } = await supabase.from('atividades').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividade'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar atividade'),
  });
}

export function useConcluirAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConcluirAtividadeData }) => {
      const resultadoUpper = normalizeUpper(data.resultado) as string;
      const { data: result, error } = await supabase
        .from('atividades')
        .update({ status: 'concluida', resultado: resultadoUpper, temperatura_cliente: data.temperatura_cliente, requer_followup: data.requer_followup, data_followup: data.data_followup })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade concluída!');
    },
    onError: () => toast.error('Erro ao concluir atividade'),
  });
}

export function useConcluirAtividadesEmLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('atividades')
        .update({ status: 'concluida', resultado: normalizeUpper('Atividade concluída (lote)') as string })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      invalidateDashboards(queryClient);
      toast.success(`${ids.length} atividade(s) concluída(s)!`);
    },
    onError: () => toast.error('Erro ao concluir atividades em lote'),
  });
}

export function useCancelarAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const motivoUpper = normalizeUpper(motivo) as string;
      const { error } = await supabase
        .from('atividades')
        .update({ 
          status: 'cancelada',
          motivo_cancelamento: motivoUpper
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividade'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-vencidas'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade cancelada!');
    },
    onError: () => toast.error('Erro ao cancelar atividade'),
  });
}

export function useDeleteAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('atividades').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade excluída!');
    },
    onError: () => toast.error('Erro ao excluir atividade'),
  });
}

export function useMarcarFollowupRealizado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('atividades')
        .update({ 
          requer_followup: false, 
          data_followup: null 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-pendentes-followup'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-vencidas'] });
      invalidateDashboards(queryClient);
      toast.success('Follow-up marcado como realizado!');
    },
    onError: () => toast.error('Erro ao marcar follow-up'),
  });
}

export function useConfiguracoesAtividades() {
  return useQuery({
    queryKey: ['configuracoes-atividades'],
    queryFn: async (): Promise<ConfiguracoesAtividades | null> => {
      const { data, error } = await supabase.from('configuracoes_atividades' as any).select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown as ConfiguracoesAtividades | null;
    },
  });
}

export function useAtividadesPendentesFollowup(gestorId?: string) {
  return useQuery({
    queryKey: ['atividades-pendentes-followup', gestorId || 'all'],
    queryFn: async (): Promise<Atividade[]> => {
      let query = supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo)`)
        .eq('requer_followup', true)
        .eq('status', 'concluida')
        .not('data_followup', 'is', null)
        .lte('data_followup', new Date().toISOString())
        .order('data_followup', { ascending: true });

      if (gestorId) query = query.eq('gestor_id', gestorId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Atividade[];
    },
  });
}

// ============ AGENDA HOOKS (consolidados de useAgenda.ts) ============

export function useAgendaMensal(ano: number, mes: number, gestorId?: string, filters?: AtividadeFilters) {
  const dataInicio = startOfMonth(new Date(ano, mes - 1));
  const dataFim = endOfMonth(new Date(ano, mes - 1));

  return useQuery({
    queryKey: ['agenda', 'mensal', ano, mes, gestorId, filters],
    queryFn: async (): Promise<Atividade[]> => {
      let query = supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo), empreendimento:empreendimentos(id, nome)`)
        .lte('data_inicio', dataFim.toISOString())
        .gte('data_fim', dataInicio.toISOString())
        .neq('status', 'cancelada')
        .order('data_inicio', { ascending: true });

      if (gestorId) query = query.eq('gestor_id', gestorId);

      // Aplicar filtros opcionais (exceto data, já aplicada acima)
      if (filters) {
        const { data_inicio, data_fim, ...otherFilters } = filters;
        query = applyAtividadesFilters(query, otherFilters);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Atividade[];
    },
  });
}

export function useAgendaDia(data: Date, gestorId?: string) {
  const dataStr = format(data, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['agenda', 'dia', dataStr, gestorId],
    queryFn: async (): Promise<Atividade[]> => {
      let query = supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo), empreendimento:empreendimentos(id, nome)`)
        .lte('data_inicio', dataStr)
        .gte('data_fim', dataStr)
        .neq('status', 'cancelada')
        .order('data_inicio', { ascending: true });

      if (gestorId) query = query.eq('gestor_id', gestorId);

      const { data: result, error } = await query;
      if (error) throw error;
      return (result || []) as unknown as Atividade[];
    },
  });
}

export function useAtividadesHoje(filters?: AtividadeFilters) {
  const hoje = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['agenda', 'hoje', filters],
    queryFn: async (): Promise<Atividade[]> => {
      let query = supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo)`)
        .lte('data_inicio', hoje)
        .gte('data_fim', hoje)
        .neq('status', 'cancelada')
        .order('data_inicio', { ascending: true });

      // Aplicar filtros opcionais (exceto data, já aplicada acima)
      if (filters) {
        const { data_inicio, data_fim, ...otherFilters } = filters;
        query = applyAtividadesFilters(query, otherFilters);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Atividade[];
    },
  });
}

export function useAtividadesVencidas(gestorId?: string) {
  return useQuery({
    queryKey: ['atividades-vencidas', gestorId || 'all'],
    refetchOnMount: true,
    staleTime: 30000,
    queryFn: async (): Promise<Atividade[]> => {
      let query = supabase
        .from('atividades')
        .select(`
          *, 
          cliente:clientes(id, nome, temperatura), 
          corretor:corretores(id, nome_completo),
          empreendimento:empreendimentos(id, nome),
          gestor:profiles(id, full_name)
        `)
        .eq('status', 'pendente')
        .lt('data_fim', new Date().toISOString().split('T')[0])
        .order('data_fim', { ascending: true });

      if (gestorId) query = query.eq('gestor_id', gestorId);

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as Atividade[];
    },
  });
}

// Hook para Super Admin alterar status de atividade
export function useAlterarStatusAtividade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      statusAtual,
      novoStatus,
      justificativa,
    }: {
      id: string;
      statusAtual: string;
      novoStatus: string;
      justificativa: string;
    }) => {
      // 1. Atualizar status da atividade
      const { error: updateError } = await supabase
        .from('atividades')
        .update({ status: novoStatus })
        .eq('id', id);
      if (updateError) throw updateError;

      // 2. Buscar nome do usuário para auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const nomeUsuario = profile?.full_name || 'Administrador';

      // 3. Registrar comentário de auditoria
      const comentarioAuditoria = `[ALTERAÇÃO DE STATUS] Status alterado de ${statusAtual.toUpperCase()} para ${novoStatus.toUpperCase()} por ${nomeUsuario}.\nJustificativa: ${justificativa}`;

      const { error: comentarioError } = await supabase
        .from('atividade_comentarios')
        .insert({
          atividade_id: id,
          user_id: user.id,
          comentario: comentarioAuditoria,
        });

      if (comentarioError) throw comentarioError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividade'] });
      queryClient.invalidateQueries({ queryKey: ['atividade-comentarios'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-vencidas'] });
      invalidateDashboards(queryClient);
      toast.success('Status alterado com sucesso!');
    },
    onError: () => toast.error('Erro ao alterar status'),
  });
}