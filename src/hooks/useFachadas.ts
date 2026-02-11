import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Fachada {
  id: string;
  empreendimento_id: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FachadaFormData {
  nome: string;
  descricao?: string;
  imagem_url?: string;
}

export function useFachadas(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['fachadas', empreendimentoId],
    queryFn: async (): Promise<Fachada[]> => {
      if (!empreendimentoId) return [];

      const { data, error } = await supabase
        .from('fachadas')
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

export function useCreateFachada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, data }: { empreendimentoId: string; data: FachadaFormData }) => {
      const { data: result, error } = await supabase
        .from('fachadas')
        .insert({ ...data, empreendimento_id: empreendimentoId })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['fachadas', empreendimentoId] });
      toast.success('Fachada criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar fachada:', error);
      toast.error('Erro ao criar fachada');
    },
  });
}

export function useUpdateFachada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId, data }: { id: string; empreendimentoId: string; data: Partial<FachadaFormData> }) => {
      const { data: result, error } = await supabase
        .from('fachadas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['fachadas', empreendimentoId] });
      toast.success('Fachada atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar fachada:', error);
      toast.error('Erro ao atualizar fachada');
    },
  });
}

export function useDeleteFachada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId }: { id: string; empreendimentoId: string }) => {
      const { error } = await supabase
        .from('fachadas')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['fachadas', empreendimentoId] });
      toast.success('Fachada removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover fachada:', error);
      toast.error('Erro ao remover fachada');
    },
  });
}
