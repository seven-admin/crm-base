import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Evento, EventoTarefa } from '@/types/marketing.types';

export function useEventos() {
  const queryClient = useQueryClient();

  const { data: eventos, isLoading, error } = useQuery({
    queryKey: ['eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          *,
          empreendimento:empreendimento_id(id, nome),
          responsavel:responsavel_id(id, full_name)
        `)
        .eq('is_active', true)
        .order('data_evento', { ascending: true });

      if (error) throw error;
      return data as unknown as Evento[];
    }
  });

  const useEvento = (id: string) => {
    return useQuery({
      queryKey: ['evento', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('eventos')
          .select(`
            *,
            empreendimento:empreendimento_id(id, nome),
            responsavel:responsavel_id(id, full_name)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        return data as unknown as Evento;
      },
      enabled: !!id
    });
  };

  const createEvento = useMutation({
    mutationFn: async (data: {
      nome: string;
      descricao?: string;
      empreendimento_id?: string;
      data_evento: string;
      local?: string;
      responsavel_id?: string;
      orcamento?: number;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;
      
      const { data: result, error } = await supabase
        .from('eventos')
        .insert({
          ...data,
          codigo: '',
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      toast.success('Evento criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar evento: ' + error.message);
    }
  });

  const updateEvento = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Evento> & { id: string }) => {
      const { error } = await supabase
        .from('eventos')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      toast.success('Evento atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  const deleteEvento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('eventos')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      toast.success('Evento removido!');
    }
  });

  return {
    eventos,
    isLoading,
    error,
    useEvento,
    createEvento,
    updateEvento,
    deleteEvento
  };
}

// Hook para tarefas do evento
export function useTarefasEvento(eventoId: string) {
  const queryClient = useQueryClient();

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ['tarefas-evento', eventoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_tarefas')
        .select(`
          *,
          responsavel:responsavel_id(id, full_name)
        `)
        .eq('evento_id', eventoId)
        .order('data_inicio', { ascending: true })
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as unknown as EventoTarefa[];
    },
    enabled: !!eventoId
  });

  const createTarefa = useMutation({
    mutationFn: async (data: {
      titulo: string;
      responsavel_id?: string;
      data_inicio?: string;
      data_fim?: string;
      dependencia_id?: string;
      status?: string;
    }) => {
      const { error } = await supabase
        .from('evento_tarefas')
        .insert({
          ...data,
          evento_id: eventoId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-evento', eventoId] });
    }
  });

  const updateTarefa = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EventoTarefa> & { id: string }) => {
      const { error } = await supabase
        .from('evento_tarefas')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-evento', eventoId] });
    }
  });

  const deleteTarefa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('evento_tarefas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-evento', eventoId] });
      toast.success('Tarefa removida!');
    }
  });

  return { tarefas, isLoading, createTarefa, updateTarefa, deleteTarefa };
}
