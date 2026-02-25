import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TipoAtendimentoConfig {
  id: string;
  nome: string;
  tipo_atividade: string;
  descricao: string | null;
  is_active: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useTiposAtendimento() {
  return useQuery({
    queryKey: ['tipos-atendimento-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_atendimento_config' as any)
        .select('*')
        .order('ordem');
      if (error) throw error;
      return (data as any[]) as TipoAtendimentoConfig[];
    },
  });
}

export function useTiposAtendimentoAtivos() {
  return useQuery({
    queryKey: ['tipos-atendimento-config', 'ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_atendimento_config' as any)
        .select('*')
        .eq('is_active', true)
        .order('ordem');
      if (error) throw error;
      return (data as any[]) as TipoAtendimentoConfig[];
    },
  });
}

export function useUpdateTipoAtendimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TipoAtendimentoConfig> }) => {
      const { error } = await supabase
        .from('tipos_atendimento_config' as any)
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-atendimento-config'] });
      toast.success('Tipo de atendimento atualizado');
    },
    onError: () => toast.error('Erro ao atualizar tipo de atendimento'),
  });
}

export function useCreateTipoAtendimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; tipo_atividade: string; descricao?: string; ordem?: number }) => {
      const { error } = await supabase
        .from('tipos_atendimento_config' as any)
        .insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-atendimento-config'] });
      toast.success('Tipo de atendimento criado');
    },
    onError: () => toast.error('Erro ao criar tipo de atendimento'),
  });
}

export function useDeleteTipoAtendimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tipos_atendimento_config' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-atendimento-config'] });
      toast.success('Tipo de atendimento removido');
    },
    onError: () => toast.error('Erro ao remover tipo de atendimento'),
  });
}
