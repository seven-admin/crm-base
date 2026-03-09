import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AtividadeResponsavel {
  id: string;
  atividade_id: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function useAtividadeResponsaveis(atividadeId?: string) {
  const queryClient = useQueryClient();

  const { data: responsaveis, isLoading } = useQuery({
    queryKey: ['atividade-responsaveis', atividadeId],
    queryFn: async () => {
      if (!atividadeId) return [];
      
      const { data, error } = await supabase
        .from('atividade_responsaveis')
        .select(`
          *,
          user:profiles!user_id(id, full_name, email)
        `)
        .eq('atividade_id', atividadeId)
        .order('created_at');

      if (error) throw error;
      return data as AtividadeResponsavel[];
    },
    enabled: !!atividadeId
  });

  const addResponsavel = useMutation({
    mutationFn: async ({ atividadeId, userId }: { atividadeId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('atividade_responsaveis')
        .insert({ atividade_id: atividadeId, user_id: userId })
        .select(`
          *,
          user:profiles!user_id(id, full_name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['atividade-responsaveis', variables.atividadeId] });
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      toast.success('Responsável adicionado');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('Este responsável já está atribuído');
      } else {
        toast.error('Erro ao adicionar responsável');
      }
    }
  });

  const removeResponsavel = useMutation({
    mutationFn: async ({ id, atividadeId }: { id: string; atividadeId: string }) => {
      const { error } = await supabase
        .from('atividade_responsaveis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return atividadeId;
    },
    onSuccess: (atividadeId) => {
      queryClient.invalidateQueries({ queryKey: ['atividade-responsaveis', atividadeId] });
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      toast.success('Responsável removido');
    },
    onError: () => {
      toast.error('Erro ao remover responsável');
    }
  });

  return {
    responsaveis,
    isLoading,
    addResponsavel,
    removeResponsavel
  };
}
