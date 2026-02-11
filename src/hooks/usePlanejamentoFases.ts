import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlanejamentoFase } from '@/types/planejamento.types';

export function usePlanejamentoFases() {
  const queryClient = useQueryClient();

  const { data: fases, isLoading } = useQuery({
    queryKey: ['planejamento-fases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planejamento_fases')
        .select('*')
        .eq('is_active', true)
        .order('ordem');

      if (error) throw error;
      return data as PlanejamentoFase[];
    }
  });

  const createFase = useMutation({
    mutationFn: async (fase: { nome: string; cor?: string; ordem?: number }) => {
      const { data, error } = await supabase
        .from('planejamento_fases')
        .insert([fase])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-fases'] });
      toast.success('Fase criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar fase: ' + error.message);
    }
  });

  const updateFase = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlanejamentoFase> & { id: string }) => {
      const { data, error } = await supabase
        .from('planejamento_fases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-fases'] });
      toast.success('Fase atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar fase: ' + error.message);
    }
  });

  const deleteFase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planejamento_fases')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-fases'] });
      toast.success('Fase removida com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao remover fase: ' + error.message);
    }
  });

  return {
    fases,
    isLoading,
    createFase,
    updateFase,
    deleteFase
  };
}
