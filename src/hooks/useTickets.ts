import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { dispararWebhook, getUsuarioLogado } from '@/lib/webhookUtils';
import type { 
  Ticket, 
  TarefaTicket, 
  TicketComentario, 
  TicketHistorico,
  StatusTicket,
  CategoriaTicket,
  PrioridadeTicket
} from '@/types/marketing.types';

// Status usado no DB (legacy)
type StatusProjetoDB = 'briefing' | 'triagem' | 'em_producao' | 'revisao' | 'aprovacao_cliente' | 'concluido' | 'arquivado';

// UI Status mapping to DB status
const UI_TO_DB_STATUS: Record<StatusTicket, StatusProjetoDB> = {
  'aguardando_analise': 'briefing',
  'em_producao': 'em_producao',
  'revisao': 'revisao',
  'aprovacao_cliente': 'aprovacao_cliente',
  'ajuste': 'triagem',
  'concluido': 'concluido',
  'arquivado': 'arquivado'
};

const DB_TO_UI_STATUS: Record<StatusProjetoDB, StatusTicket> = {
  'briefing': 'aguardando_analise',
  'triagem': 'ajuste',
  'em_producao': 'em_producao',
  'revisao': 'revisao',
  'aprovacao_cliente': 'aprovacao_cliente',
  'concluido': 'concluido',
  'arquivado': 'arquivado'
};

const toUIStatus = (dbStatus: string): StatusTicket => 
  DB_TO_UI_STATUS[dbStatus as StatusProjetoDB] || 'aguardando_analise';

const toDBStatus = (uiStatus: StatusTicket): StatusProjetoDB => 
  UI_TO_DB_STATUS[uiStatus] || 'briefing';

interface TicketFilters {
  categoria?: CategoriaTicket;
  status?: StatusTicket;
  supervisor_id?: string;
  cliente_id?: string;
}

export function useTickets(filters?: TicketFilters) {
  const queryClient = useQueryClient();

  // Buscar tickets
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      let query = supabase
        .from('projetos_marketing')
        .select(`
          *,
          cliente:cliente_id(id, full_name, email),
          supervisor:supervisor_id(id, full_name),
          empreendimento:empreendimento_id(id, nome),
          briefing:briefing_id(id, codigo, cliente, tema, objetivo, formato_peca, composicao, head_titulo, sub_complemento, mensagem_chave, tom_comunicacao, estilo_visual, diretrizes_visuais, referencia, importante, observacoes, status)
        `)
        .eq('is_active', true)
        .order('ordem_kanban', { ascending: true });

      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria as any);
      }
      if (filters?.status) {
        query = query.eq('status', toDBStatus(filters.status));
      }
      if (filters?.supervisor_id) {
        query = query.eq('supervisor_id', filters.supervisor_id);
      }
      if (filters?.cliente_id) {
        query = query.eq('cliente_id', filters.cliente_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data as unknown[]).map((t: unknown) => {
        const ticket = t as Record<string, unknown>;
        return {
          ...ticket,
          status: toUIStatus(ticket.status as string)
        };
      }) as Ticket[];
    }
  });

  // Buscar ticket específico
  const useTicket = (id: string) => {
    return useQuery({
      queryKey: ['ticket', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('projetos_marketing')
          .select(`
            *,
            cliente:cliente_id(id, full_name, email),
            supervisor:supervisor_id(id, full_name),
            empreendimento:empreendimento_id(id, nome),
            briefing:briefing_id(id, codigo, cliente, tema, objetivo, formato_peca, composicao, head_titulo, sub_complemento, mensagem_chave, tom_comunicacao, estilo_visual, diretrizes_visuais, referencia, importante, observacoes, status)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        return {
          ...data,
          status: toUIStatus(data.status)
        } as unknown as Ticket;
      },
      enabled: !!id
    });
  };

  // Criar ticket
  const createTicket = useMutation({
    mutationFn: async (data: {
      titulo: string;
      descricao?: string;
      categoria: CategoriaTicket;
      prioridade?: PrioridadeTicket;
      cliente_id?: string;
      empreendimento_id?: string;
      briefing_id?: string;
      briefing_texto?: string;
      data_previsao?: string;
    }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: result, error } = await (supabase
        .from('projetos_marketing') as any)
        .insert({
          ...data,
          codigo: '',
          status: 'briefing' as StatusProjetoDB,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      toast.success('Atividade de produção criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar atividade de produção: ' + error.message);
    }
  });

  // Atualizar ticket
  const updateTicket = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Ticket> & { id: string }) => {
      const dbData: Record<string, unknown> = { ...data };
      if (data.status) {
        dbData.status = toDBStatus(data.status as StatusTicket);
      }
      
      const { error } = await supabase
        .from('projetos_marketing')
        .update(dbData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      toast.success('Atividade de produção atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  // Mover ticket no Kanban
  const moveTicketKanban = useMutation({
    mutationFn: async ({ 
      ticketId, 
      novoStatus, 
      novaOrdem,
      observacao 
    }: { 
      ticketId: string; 
      novoStatus: StatusTicket; 
      novaOrdem: number;
      observacao?: string;
    }) => {
      const dbStatus = toDBStatus(novoStatus);
      
      // Buscar status atual
      const { data: ticket } = await supabase
        .from('projetos_marketing')
        .select('status, data_inicio')
        .eq('id', ticketId)
        .single();

      // Atualizar ticket
      const { error: updateError } = await supabase
        .from('projetos_marketing')
        .update({ 
          status: dbStatus, 
          ordem_kanban: novaOrdem,
          ...(dbStatus === 'em_producao' && !ticket?.data_inicio && { data_inicio: new Date().toISOString().split('T')[0] }),
          ...(dbStatus === 'concluido' && { data_entrega: new Date().toISOString().split('T')[0] })
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Registrar histórico
      if (ticket?.status !== dbStatus) {
        const { error: histError } = await supabase
          .from('projeto_historico')
          .insert({
            projeto_id: ticketId,
            status_anterior: ticket?.status,
            status_novo: dbStatus,
            observacao,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (histError) throw histError;
      }
    },
    // OPTIMISTIC UPDATE
    onMutate: async ({ ticketId, novoStatus, novaOrdem }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['tickets'] });
      
      const previousStates: { queryKey: readonly unknown[]; data: unknown }[] = [];
      
      queries.forEach(query => {
        previousStates.push({
          queryKey: query.queryKey,
          data: query.state.data
        });
        
        queryClient.setQueryData(query.queryKey, (old: Ticket[] | undefined) => {
          if (!old) return old;
          return old.map(t => 
            t.id === ticketId 
              ? { ...t, status: novoStatus, ordem_kanban: novaOrdem }
              : t
          );
        });
      });
      
      return { previousStates };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousStates) {
        context.previousStates.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Erro ao mover atividade de produção: ' + error.message);
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      }, 300);
    }
  });

  // Arquivar ticket
  const arquivarTicket = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projetos_marketing')
        .update({ status: 'arquivado' as StatusProjetoDB })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      toast.success('Atividade de produção arquivada!');
    }
  });

  // Alterar etapa de um ticket (sincroniza status legado)
  const alterarEtapa = useMutation({
    mutationFn: async ({ ticketId, etapaId }: { ticketId: string; etapaId: string }) => {
      // Buscar info da etapa para atualizar status legado também
      const { data: etapa } = await supabase
        .from('ticket_etapas')
        .select('is_final, nome')
        .eq('id', etapaId)
        .single();
      
      const novoStatus = etapa?.is_final ? 'concluido' : 'em_producao';
      
      const { error } = await supabase
        .from('projetos_marketing')
        .update({ 
          ticket_etapa_id: etapaId,
          status: novoStatus as StatusProjetoDB,
          ...(etapa?.is_final && { data_entrega: new Date().toISOString().split('T')[0] })
        })
        .eq('id', ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      toast.success('Etapa alterada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao alterar etapa: ' + error.message);
    }
  });

  // Alterar etapa de múltiplos tickets em lote
  const alterarEtapaEmLote = useMutation({
    mutationFn: async ({ ticketIds, etapaId }: { ticketIds: string[]; etapaId: string }) => {
      // Buscar info da etapa para atualizar status legado também
      const { data: etapa } = await supabase
        .from('ticket_etapas')
        .select('is_final, nome')
        .eq('id', etapaId)
        .single();
      
      const novoStatus = etapa?.is_final ? 'concluido' : 'em_producao';
      
      const { error } = await supabase
        .from('projetos_marketing')
        .update({ 
          ticket_etapa_id: etapaId,
          status: novoStatus as StatusProjetoDB,
          ...(etapa?.is_final && { data_entrega: new Date().toISOString().split('T')[0] })
        })
        .in('id', ticketIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      toast.success('Tickets atualizados!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao alterar etapas: ' + error.message);
    }
  });

  return {
    tickets,
    isLoading,
    error,
    useTicket,
    createTicket,
    updateTicket,
    moveTicketKanban,
    arquivarTicket,
    alterarEtapa,
    alterarEtapaEmLote,
    // Aliases para compatibilidade
    projetos: tickets,
    useProjeto: useTicket,
    createProjeto: createTicket,
    updateProjeto: updateTicket,
    moveProjetoKanban: moveTicketKanban,
    arquivarProjeto: arquivarTicket
  };
}

// Hook para tarefas do ticket
export function useTarefasTicket(ticketId: string) {
  const queryClient = useQueryClient();

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ['tarefas-ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefas_projeto')
        .select(`
          *,
          responsavel:responsavel_id(id, full_name)
        `)
        .eq('projeto_id', ticketId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as unknown as TarefaTicket[];
    },
    enabled: !!ticketId
  });

  const createTarefa = useMutation({
    mutationFn: async (data: {
      titulo: string;
      descricao?: string;
      responsavel_id?: string;
      data_inicio?: string;
      data_fim?: string;
    }) => {
      const { error } = await supabase
        .from('tarefas_projeto')
        .insert({
          ...data,
          projeto_id: ticketId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-ticket', ticketId] });
      toast.success('Tarefa adicionada!');
    }
  });

  const updateTarefa = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TarefaTicket> & { id: string }) => {
      const { error } = await supabase
        .from('tarefas_projeto')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-ticket', ticketId] });
    }
  });

  const deleteTarefa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tarefas_projeto')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-ticket', ticketId] });
      toast.success('Tarefa removida!');
    }
  });

  return { tarefas, isLoading, createTarefa, updateTarefa, deleteTarefa };
}

// Hook para comentários
export function useComentariosTicket(ticketId: string) {
  const queryClient = useQueryClient();

  const { data: comentarios, isLoading } = useQuery({
    queryKey: ['comentarios-ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projeto_comentarios')
        .select(`
          *,
          user:user_id(id, full_name, avatar_url)
        `)
        .eq('projeto_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as TicketComentario[];
    },
    enabled: !!ticketId
  });

  const createComentario = useMutation({
    mutationFn: async (data: { comentario: string; anexo_url?: string }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('projeto_comentarios')
        .insert({
          ...data,
          projeto_id: ticketId,
          user_id: userId
        });

      if (error) throw error;

      // Webhook: atividade comentada (marketing)
      const usuario = await getUsuarioLogado();
      if (usuario) {
        // Buscar título da atividade
        const { data: ticket } = await supabase
          .from('projetos_marketing')
          .select('titulo, codigo')
          .eq('id', ticketId)
          .maybeSingle();

        // Buscar responsáveis atribuídos
        const { data: responsaveis } = await supabase
          .from('projeto_responsaveis')
          .select('user_id, user:profiles!projeto_responsaveis_user_id_fkey(id, full_name, phone)')
          .eq('projeto_id', ticketId);

        dispararWebhook('atividade_comentada', {
          tipo: 'marketing',
          atividade_id: ticketId,
          atividade_titulo: ticket?.titulo || '',
          atividade_codigo: ticket?.codigo || '',
          comentario: data.comentario,
          autor: { id: usuario.id, nome: usuario.nome, telefone: usuario.telefone },
          responsaveis: (responsaveis || []).map((r: any) => ({
            id: r.user_id,
            nome: r.user?.full_name || 'Responsável',
            telefone: r.user?.phone || null,
          })),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios-ticket', ticketId] });
      toast.success('Comentário adicionado!');
    }
  });

  return { comentarios, isLoading, createComentario };
}

// Hook para histórico
export function useHistoricoTicket(ticketId: string) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ['historico-ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projeto_historico')
        .select(`
          *,
          user:user_id(id, full_name)
        `)
        .eq('projeto_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data as unknown[]).map((h: unknown) => {
        const hist = h as Record<string, unknown>;
        return {
          ...hist,
          status_anterior: hist.status_anterior ? toUIStatus(hist.status_anterior as string) : null,
          status_novo: toUIStatus(hist.status_novo as string)
        };
      }) as TicketHistorico[];
    },
    enabled: !!ticketId
  });

  return { historico, isLoading };
}

// Aliases para compatibilidade com código existente
export const useProjetosMarketing = useTickets;
export const useTarefasProjeto = useTarefasTicket;
export const useComentariosProjeto = useComentariosTicket;
export const useHistoricoProjeto = useHistoricoTicket;