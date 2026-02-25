import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AtividadeEtapa {
  id: string;
  nome: string;
  cor: string;
  cor_bg: string;
  ordem: number;
  is_inicial: boolean;
  is_final: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AtividadeEtapaFormData {
  nome: string;
  cor?: string;
  cor_bg?: string;
  ordem?: number;
  is_inicial?: boolean;
  is_final?: boolean;
}

export function useAtividadeEtapas() {
  return useQuery({
    queryKey: ['atividade-etapas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividade_etapas')
        .select('*')
        .eq('is_active', true)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data as AtividadeEtapa[];
    },
  });
}

export function useAtividadeEtapasConfig() {
  return useQuery({
    queryKey: ['atividade-etapas-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividade_etapas')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data as AtividadeEtapa[];
    },
  });
}

export function useCreateAtividadeEtapa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AtividadeEtapaFormData) => {
      const { data: result, error } = await supabase
        .from('atividade_etapas')
        .insert({
          nome: data.nome,
          cor: data.cor || '#3b82f6',
          cor_bg: data.cor_bg || '#dbeafe',
          ordem: data.ordem || 0,
          is_inicial: data.is_inicial || false,
          is_final: data.is_final || false,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividade-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['atividade-etapas-config'] });
      toast({ title: 'Etapa criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar etapa', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAtividadeEtapa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<AtividadeEtapa> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('atividade_etapas')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividade-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['atividade-etapas-config'] });
      toast({ title: 'Etapa atualizada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar etapa', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAtividadeEtapa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('atividade_etapas')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividade-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['atividade-etapas-config'] });
      toast({ title: 'Etapa removida!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover etapa', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReorderAtividadeEtapas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (etapas: { id: string; ordem: number }[]) => {
      const promises = etapas.map(({ id, ordem }) =>
        supabase.from('atividade_etapas').update({ ordem }).eq('id', id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividade-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['atividade-etapas-config'] });
    },
  });
}
