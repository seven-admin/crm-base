import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TicketCriativo } from '@/types/marketing.types';

export function useTicketCriativos(projetoId: string) {
  const queryClient = useQueryClient();

  // Buscar criativos do projeto
  const { data: criativos = [], isLoading } = useQuery({
    queryKey: ['ticket-criativos', projetoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_criativos')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TicketCriativo[];
    },
    enabled: !!projetoId,
  });

  // Adicionar link externo
  const addLink = useMutation({
    mutationFn: async ({ nome, url }: { nome?: string; url: string }) => {
      const { data, error } = await supabase
        .from('ticket_criativos')
        .insert({
          projeto_id: projetoId,
          tipo: 'link',
          nome: nome || url,
          url: url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-criativos', projetoId] });
      toast.success('Link adicionado com sucesso');
    },
    onError: (error: Error) => {
      console.error('Erro ao adicionar link:', error);
      toast.error('Erro ao adicionar link');
    },
  });

  // Deletar criativo
  const deleteCriativo = useMutation({
    mutationFn: async (criativo: TicketCriativo) => {
      const { error } = await supabase
        .from('ticket_criativos')
        .delete()
        .eq('id', criativo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-criativos', projetoId] });
      toast.success('Link removido');
    },
    onError: (error: Error) => {
      console.error('Erro ao remover link:', error);
      toast.error('Erro ao remover link');
    },
  });

  // Marcar como final
  const toggleFinal = useMutation({
    mutationFn: async ({ id, is_final }: { id: string; is_final: boolean }) => {
      const { error } = await supabase
        .from('ticket_criativos')
        .update({ is_final })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-criativos', projetoId] });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  return {
    criativos,
    isLoading,
    addLink,
    deleteCriativo,
    toggleFinal,
  };
}
