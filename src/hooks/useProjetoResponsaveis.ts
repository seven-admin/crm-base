import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjetoResponsavel {
  id: string;
  projeto_id: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export function useProjetoResponsaveis(projetoId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: responsaveis = [], isLoading } = useQuery({
    queryKey: ['projeto-responsaveis', projetoId],
    queryFn: async (): Promise<ProjetoResponsavel[]> => {
      if (!projetoId) return [];
      const { data, error } = await supabase
        .from('projeto_responsaveis')
        .select('*, user:profiles(id, full_name, avatar_url)')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ProjetoResponsavel[];
    },
    enabled: !!projetoId,
  });

  const addResponsavel = useMutation({
    mutationFn: async (userId: string) => {
      if (!projetoId) throw new Error('Projeto ID obrigatório');
      const { error } = await supabase
        .from('projeto_responsaveis')
        .insert({ projeto_id: projetoId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projeto-responsaveis', projetoId] });
      toast.success('Responsável adicionado!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast.error('Este responsável já está vinculado.');
      } else {
        toast.error('Erro ao adicionar responsável.');
      }
    },
  });

  const removeResponsavel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projeto_responsaveis')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projeto-responsaveis', projetoId] });
      toast.success('Responsável removido!');
    },
    onError: () => toast.error('Erro ao remover responsável.'),
  });

  return { responsaveis, isLoading, addResponsavel, removeResponsavel };
}
