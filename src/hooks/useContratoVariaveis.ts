import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContratoVariavel {
  id: string;
  chave: string;
  label: string;
  exemplo?: string;
  categoria: string;
  tipo: string;
  origem?: string;
  campo_origem?: string;
  is_sistema: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useContratoVariaveis() {
  return useQuery({
    queryKey: ['contrato-variaveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrato_variaveis')
        .select('*')
        .order('categoria')
        .order('label');

      if (error) throw error;
      return data as ContratoVariavel[];
    },
  });
}

export function useActiveContratoVariaveis() {
  return useQuery({
    queryKey: ['contrato-variaveis-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrato_variaveis')
        .select('*')
        .eq('is_active', true)
        .order('categoria')
        .order('label');

      if (error) throw error;
      return data as ContratoVariavel[];
    },
  });
}

export function useCreateContratoVariavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ContratoVariavel, 'id' | 'created_at' | 'updated_at' | 'is_sistema'>) => {
      const { error } = await supabase
        .from('contrato_variaveis')
        .insert({
          ...data,
          is_sistema: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-variaveis'] });
      queryClient.invalidateQueries({ queryKey: ['contrato-variaveis-active'] });
      toast.success('Variável criada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar variável:', error);
      toast.error('Erro ao criar variável');
    },
  });
}

export function useUpdateContratoVariavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContratoVariavel> }) => {
      const { error } = await supabase
        .from('contrato_variaveis')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-variaveis'] });
      queryClient.invalidateQueries({ queryKey: ['contrato-variaveis-active'] });
      toast.success('Variável atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar variável:', error);
      toast.error('Erro ao atualizar variável');
    },
  });
}

export function useDeleteContratoVariavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Exclusão real para variáveis não-sistema
      const { error } = await supabase
        .from('contrato_variaveis')
        .delete()
        .eq('id', id)
        .eq('is_sistema', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-variaveis'] });
      queryClient.invalidateQueries({ queryKey: ['contrato-variaveis-active'] });
      toast.success('Variável excluída');
    },
    onError: (error) => {
      console.error('Erro ao excluir variável:', error);
      toast.error('Erro ao excluir variável');
    },
  });
}
