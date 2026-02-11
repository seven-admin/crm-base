import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlanejamentoStatus } from '@/types/planejamento.types';

export function usePlanejamentoStatus() {
  const queryClient = useQueryClient();

  const { data: statusList, isLoading } = useQuery({
    queryKey: ['planejamento-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planejamento_status')
        .select('*')
        .eq('is_active', true)
        .order('ordem');

      if (error) throw error;
      return data as PlanejamentoStatus[];
    }
  });

  const createStatus = useMutation({
    mutationFn: async (status: { nome: string; cor?: string; ordem?: number; is_final?: boolean }) => {
      const { data, error } = await supabase
        .from('planejamento_status')
        .insert([status])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-status'] });
      toast.success('Status criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar status: ' + error.message);
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlanejamentoStatus> & { id: string }) => {
      const { data, error } = await supabase
        .from('planejamento_status')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-status'] });
      toast.success('Status atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });

  const deleteStatus = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planejamento_status')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-status'] });
      toast.success('Status removido com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao remover status: ' + error.message);
    }
  });

  return {
    statusList,
    isLoading,
    createStatus,
    updateStatus,
    deleteStatus
  };
}
