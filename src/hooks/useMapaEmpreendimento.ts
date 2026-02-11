import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MapaEmpreendimento {
  id: string;
  empreendimento_id: string;
  imagem_url: string;
  largura: number | null;
  altura: number | null;
  created_at: string;
  updated_at: string;
}

export interface MapaFormData {
  imagem_url: string;
  largura?: number;
  altura?: number;
}

export function useMapaEmpreendimento(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['mapa-empreendimento', empreendimentoId],
    queryFn: async (): Promise<MapaEmpreendimento | null> => {
      if (!empreendimentoId) return null;

      const { data, error } = await supabase
        .from('mapa_empreendimento')
        .select('*')
        .eq('empreendimento_id', empreendimentoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!empreendimentoId,
  });
}

export function useCreateMapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, data }: { empreendimentoId: string; data: MapaFormData }) => {
      const { data: result, error } = await supabase
        .from('mapa_empreendimento')
        .insert({ ...data, empreendimento_id: empreendimentoId })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['mapa-empreendimento', empreendimentoId] });
      toast.success('Mapa criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar mapa:', error);
      toast.error('Erro ao criar mapa');
    },
  });
}

export function useUpdateMapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId, data }: { id: string; empreendimentoId: string; data: Partial<MapaFormData> }) => {
      const { data: result, error } = await supabase
        .from('mapa_empreendimento')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['mapa-empreendimento', empreendimentoId] });
      toast.success('Mapa atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar mapa:', error);
      toast.error('Erro ao atualizar mapa');
    },
  });
}

export function useDeleteMapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId }: { id: string; empreendimentoId: string }) => {
      const { error } = await supabase
        .from('mapa_empreendimento')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['mapa-empreendimento', empreendimentoId] });
      toast.success('Mapa removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover mapa:', error);
      toast.error('Erro ao remover mapa');
    },
  });
}
