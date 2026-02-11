import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TipoParcela {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  is_active: boolean;
  created_at: string;
}

export function useTiposParcelaAll() {
  return useQuery({
    queryKey: ['tipos-parcela-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_parcela')
        .select('*')
        .order('ordem');
      
      if (error) throw error;
      return data as TipoParcela[];
    },
  });
}

export function useCreateTipoParcela() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<TipoParcela, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('tipos_parcela')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-parcela'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-parcela-all'] });
    },
  });
}

export function useUpdateTipoParcela() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TipoParcela> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('tipos_parcela')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-parcela'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-parcela-all'] });
    },
  });
}

export function useDeleteTipoParcela() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tipos_parcela')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-parcela'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-parcela-all'] });
    },
  });
}

export function useReorderTiposParcela() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; ordem: number }[]) => {
      const promises = items.map(({ id, ordem }) =>
        supabase
          .from('tipos_parcela')
          .update({ ordem })
          .eq('id', id)
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-parcela'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-parcela-all'] });
    },
  });
}
