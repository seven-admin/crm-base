import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tipologia, TipologiaFormData } from '@/types/empreendimentos.types';

export function useTipologias(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['tipologias', empreendimentoId],
    queryFn: async (): Promise<Tipologia[]> => {
      if (!empreendimentoId) return [];

      const { data, error } = await supabase
        .from('tipologias')
        .select('*')
        .eq('empreendimento_id', empreendimentoId)
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
    enabled: !!empreendimentoId,
  });
}

export function useCreateTipologia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, data }: { empreendimentoId: string; data: TipologiaFormData }) => {
      const { data: result, error } = await supabase
        .from('tipologias')
        .insert({ ...data, empreendimento_id: empreendimentoId })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['tipologias', empreendimentoId] });
      toast.success('Tipologia criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar tipologia:', error);
      toast.error('Erro ao criar tipologia');
    },
  });
}

// Versão silenciosa para uso em importação (sem toast ou invalidação automática)
export function useCreateTipologiaSilent() {
  return useMutation({
    mutationFn: async ({ empreendimentoId, data }: { empreendimentoId: string; data: TipologiaFormData }) => {
      const { data: result, error } = await supabase
        .from('tipologias')
        .insert({ ...data, empreendimento_id: empreendimentoId })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onError: (error) => {
      console.error('Erro ao criar tipologia:', error);
    },
  });
}

export function useUpdateTipologia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId, data }: { id: string; empreendimentoId: string; data: Partial<TipologiaFormData> }) => {
      const { data: result, error } = await supabase
        .from('tipologias')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['tipologias', empreendimentoId] });
      toast.success('Tipologia atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar tipologia:', error);
      toast.error('Erro ao atualizar tipologia');
    },
  });
}

export function useDeleteTipologia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId }: { id: string; empreendimentoId: string }) => {
      const { error } = await supabase
        .from('tipologias')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['tipologias', empreendimentoId] });
      toast.success('Tipologia removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover tipologia:', error);
      toast.error('Erro ao remover tipologia');
    },
  });
}
