import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  Ticket as ProjetoMarketing, 
  TarefaTicket as TarefaProjeto, 
  TicketComentario as ProjetoComentario, 
  TicketHistorico as ProjetoHistorico,
  CategoriaTicket as CategoriaProjeto,
  PrioridadeTicket as PrioridadeProjeto,
  StatusTicket
} from '@/types/marketing.types';

// Status usado no DB (legacy) - will be updated to match UI
type StatusProjetoDB = 'briefing' | 'triagem' | 'em_producao' | 'revisao' | 'aprovacao_cliente' | 'concluido' | 'arquivado';

// UI Status mapping to DB status
const UI_TO_DB_STATUS: Record<StatusTicket, StatusProjetoDB> = {
  'aguardando_analise': 'briefing', // Map to briefing in DB for now
  'em_producao': 'em_producao',
  'revisao': 'revisao',
  'aprovacao_cliente': 'aprovacao_cliente',
  'ajuste': 'triagem', // Map to triagem in DB for now
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

interface ProjetoFilters {
  categoria?: CategoriaProjeto;
  status?: StatusTicket;
  supervisor_id?: string;
  cliente_id?: string;
  is_interno?: boolean;
}

// Helper functions to convert between DB and UI status
const toUIStatus = (dbStatus: string): StatusTicket => 
  DB_TO_UI_STATUS[dbStatus as StatusProjetoDB] || 'aguardando_analise';

const toDBStatus = (uiStatus: StatusTicket): StatusProjetoDB => 
  UI_TO_DB_STATUS[uiStatus] || 'briefing';

export function useProjetosMarketing(filters?: ProjetoFilters) {
  const queryClient = useQueryClient();

  // Buscar projetos
  const { data: projetos, isLoading, error } = useQuery({
    queryKey: ['projetos-marketing', filters],
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
      if (typeof filters?.is_interno === 'boolean') {
        query = query.eq('is_interno', filters.is_interno);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Map DB status to UI status
      return (data as unknown[]).map((p: unknown) => {
        const projeto = p as Record<string, unknown>;
        return {
          ...projeto,
          status: toUIStatus(projeto.status as string)
        };
      }) as ProjetoMarketing[];
    }
  });

  // Buscar projeto específico
  const useProjeto = (id: string) => {
    return useQuery({
      queryKey: ['projeto-marketing', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('projetos_marketing')
          .select(`
            *,
            cliente:cliente_id(id, full_name, email),
            supervisor:supervisor_id(id, full_name),
            empreendimento:empreendimento_id(id, nome),
            briefing:briefing_id(id, codigo, cliente, tema, objetivo, formato_peca, composicao, head_titulo, sub_complemento, mensagem_chave, tom_comunicacao, estilo_visual, diretrizes_visuais, referencia, importante, observacoes, status),
            criador:created_by(id, full_name)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        return {
          ...data,
          status: toUIStatus(data.status)
        } as unknown as ProjetoMarketing;
      },
      enabled: !!id
    });
  };

  // Criar projeto (briefing)
  const createProjeto = useMutation({
    mutationFn: async (data: {
      titulo: string;
      descricao?: string;
      categoria: CategoriaProjeto;
      prioridade?: PrioridadeProjeto;
      cliente_id?: string;
      supervisor_id?: string;
      empreendimento_id?: string;
      briefing_texto?: string;
      briefing_id?: string;
      data_previsao?: string;
      is_interno?: boolean;
    }) => {
      // Buscar a primeira etapa ativa (Triagem) para novos tickets
      const { data: primeiraEtapa } = await supabase
        .from('ticket_etapas')
        .select('id')
        .eq('is_active', true)
        .order('ordem', { ascending: true })
        .limit(1)
        .single();

      // Obter user_id para created_by
      const { data: { user } } = await supabase.auth.getUser();

      const { data: result, error } = await (supabase
        .from('projetos_marketing') as any)
        .insert({
          ...data,
          codigo: '', // Será gerado pelo trigger
          status: 'briefing' as StatusProjetoDB,
          is_interno: data.is_interno ?? false,
          ticket_etapa_id: primeiraEtapa?.id || null,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Atividade de produção criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar atividade de produção: ' + error.message);
    }
  });

  // Atualizar projeto
  const updateProjeto = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProjetoMarketing> & { id: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Atividade de produção atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  // Mover projeto no Kanban (mudar status) - com Optimistic Update
  const moveProjetoKanban = useMutation({
    mutationFn: async ({ 
      projetoId, 
      novoStatus, 
      novaOrdem,
      ticketEtapaId,
      observacao 
    }: { 
      projetoId: string; 
      novoStatus: StatusTicket; 
      novaOrdem: number;
      ticketEtapaId?: string | null;
      observacao?: string;
    }) => {
      const dbStatus = toDBStatus(novoStatus);
      
      // Buscar status atual e data_inicio
      const { data: projeto } = await supabase
        .from('projetos_marketing')
        .select('status, data_inicio')
        .eq('id', projetoId)
        .single();

      // Atualizar projeto
      const { error: updateError } = await supabase
        .from('projetos_marketing')
        .update({ 
          status: dbStatus, 
          ordem_kanban: novaOrdem,
          ...(typeof ticketEtapaId !== 'undefined' && { ticket_etapa_id: ticketEtapaId }),
          ...(dbStatus === 'em_producao' && !projeto?.data_inicio && { data_inicio: new Date().toISOString().split('T')[0] }),
          ...(dbStatus === 'concluido' && { data_entrega: new Date().toISOString().split('T')[0] })
        })
        .eq('id', projetoId);

      if (updateError) throw updateError;

      // Registrar histórico
      if (projeto?.status !== dbStatus) {
        const { error: histError } = await supabase
          .from('projeto_historico')
          .insert({
            projeto_id: projetoId,
            status_anterior: projeto?.status,
            status_novo: dbStatus,
            observacao,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (histError) throw histError;
      }
    },
    // OPTIMISTIC UPDATE - Atualiza UI instantaneamente em TODOS os caches
    onMutate: async ({ projetoId, novoStatus, novaOrdem, ticketEtapaId }) => {
      // Cancelar TODAS as queries de projetos-marketing (incluindo com filtros)
      await queryClient.cancelQueries({ queryKey: ['projetos-marketing'] });
      
      // Obter TODOS os caches ativos de projetos-marketing
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['projetos-marketing'] });
      
      // Guardar todos os estados anteriores para rollback
      const previousStates: { queryKey: readonly unknown[]; data: unknown }[] = [];
      
      queries.forEach(query => {
        previousStates.push({
          queryKey: query.queryKey,
          data: query.state.data
        });
        
        // Atualizar CADA cache encontrado
        queryClient.setQueryData(query.queryKey, (old: ProjetoMarketing[] | undefined) => {
          if (!old) return old;
          return old.map(p => 
            p.id === projetoId 
              ? { 
                  ...p,
                  status: novoStatus,
                  ordem_kanban: novaOrdem,
                  ...(typeof ticketEtapaId !== 'undefined' && { ticket_etapa_id: ticketEtapaId })
                }
              : p
          );
        });
      });
      
      return { previousStates };
    },
    onError: (error: Error, variables, context) => {
      // Reverter TODOS os caches em caso de erro
      if (context?.previousStates) {
        context.previousStates.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Erro ao mover ticket: ' + error.message);
    },
    onSuccess: () => {
      // Refetch após optimistic update para sincronizar com o banco
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
      }, 300);
    }
  });

  // Arquivar projeto
  const arquivarProjeto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projetos_marketing')
        .update({ status: 'arquivado' as StatusProjetoDB })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Atividade de produção arquivada!');
    }
  });

  // Excluir projeto definitivamente
  const deleteProjeto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projetos_marketing')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      queryClient.invalidateQueries({ queryKey: ['projeto-marketing'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Atividade de produção excluída!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir atividade de produção: ' + error.message);
    }
  });

  return {
    projetos,
    isLoading,
    error,
    useProjeto,
    createProjeto,
    updateProjeto,
    moveProjetoKanban,
    arquivarProjeto,
    deleteProjeto
  };
}

// Hook para tarefas do projeto
export function useTarefasProjeto(projetoId: string) {
  const queryClient = useQueryClient();

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ['tarefas-projeto', projetoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefas_projeto')
        .select(`
          *,
          responsavel:responsavel_id(id, full_name)
        `)
        .eq('projeto_id', projetoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as unknown as TarefaProjeto[];
    },
    enabled: !!projetoId
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
          projeto_id: projetoId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-projeto', projetoId] });
      toast.success('Tarefa adicionada!');
    }
  });

  const updateTarefa = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TarefaProjeto> & { id: string }) => {
      const { error } = await supabase
        .from('tarefas_projeto')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-projeto', projetoId] });
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
      queryClient.invalidateQueries({ queryKey: ['tarefas-projeto', projetoId] });
      toast.success('Tarefa removida!');
    }
  });

  return { tarefas, isLoading, createTarefa, updateTarefa, deleteTarefa };
}

// Hook para comentários
export function useComentariosProjeto(projetoId: string) {
  const queryClient = useQueryClient();

  const { data: comentarios, isLoading } = useQuery({
    queryKey: ['comentarios-projeto', projetoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projeto_comentarios')
        .select(`
          *,
          user:user_id(id, full_name, avatar_url)
        `)
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ProjetoComentario[];
    },
    enabled: !!projetoId
  });

  const createComentario = useMutation({
    mutationFn: async (data: { comentario: string; anexo_url?: string }) => {
      const { error } = await supabase
        .from('projeto_comentarios')
        .insert({
          ...data,
          projeto_id: projetoId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios-projeto', projetoId] });
      toast.success('Comentário adicionado!');
    }
  });

  return { comentarios, isLoading, createComentario };
}

// Hook para histórico
export function useHistoricoProjeto(projetoId: string) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ['historico-projeto', projetoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projeto_historico')
        .select(`
          *,
          user:user_id(id, full_name)
        `)
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map DB status to UI status
      return (data as unknown[]).map((h: unknown) => {
        const hist = h as Record<string, unknown>;
        return {
          ...hist,
          status_anterior: hist.status_anterior ? toUIStatus(hist.status_anterior as string) : null,
          status_novo: toUIStatus(hist.status_novo as string)
        };
      }) as ProjetoHistorico[];
    },
    enabled: !!projetoId
  });

  return { historico, isLoading };
}