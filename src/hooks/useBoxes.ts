import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Box, BoxFormData, BoxBulkFormData } from '@/types/empreendimentos.types';

export function useBoxes(empreendimentoId: string | undefined, filters?: { blocoId?: string; status?: string }) {
  return useQuery({
    queryKey: ['boxes', empreendimentoId, filters],
    queryFn: async (): Promise<Box[]> => {
      if (!empreendimentoId) return [];

      let query = supabase
        .from('boxes')
        .select(`
          *,
          bloco:blocos(id, nome),
          unidade:unidades(id, numero)
        `)
        .eq('empreendimento_id', empreendimentoId)
        .eq('is_active', true)
        .order('numero', { ascending: true });

      if (filters?.blocoId) {
        query = query.eq('bloco_id', filters.blocoId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Box[];
    },
    enabled: !!empreendimentoId,
  });
}

export function useCreateBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, data }: { empreendimentoId: string; data: BoxFormData }) => {
      const { data: result, error } = await supabase
        .from('boxes')
        .insert({
          ...data,
          empreendimento_id: empreendimentoId,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', empreendimentoId] });
      toast.success('Box criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar box:', error);
      toast.error('Erro ao criar box');
    },
  });
}

export function useCreateBoxesBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, data }: { empreendimentoId: string; data: BoxBulkFormData }) => {
      const boxes = [];
      for (let i = 0; i < data.quantidade; i++) {
        const numero = data.prefixo 
          ? `${data.prefixo}${String(data.numero_inicial + i).padStart(3, '0')}`
          : String(data.numero_inicial + i).padStart(3, '0');
        
        boxes.push({
          empreendimento_id: empreendimentoId,
          bloco_id: data.bloco_id || null,
          numero,
          tipo: data.tipo,
          coberto: data.coberto,
          valor: data.valor || null,
        });
      }

      const { data: result, error } = await supabase
        .from('boxes')
        .insert(boxes)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: (data, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', empreendimentoId] });
      toast.success(`${data?.length || 0} boxes criados com sucesso!`);
    },
    onError: (error: any) => {
      console.error('Erro ao criar boxes:', error);
      if (error?.code === '23505') {
        toast.error('Já existem boxes com essa numeração');
      } else {
        toast.error('Erro ao criar boxes');
      }
    },
  });
}

export function useUpdateBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId, data }: { id: string; empreendimentoId: string; data: Partial<BoxFormData> }) => {
      const { data: result, error } = await supabase
        .from('boxes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', empreendimentoId] });
      toast.success('Box atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar box:', error);
      toast.error('Erro ao atualizar box');
    },
  });
}

export function useDeleteBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId }: { id: string; empreendimentoId: string }) => {
      const { error } = await supabase
        .from('boxes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', empreendimentoId] });
      toast.success('Box removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover box:', error);
      toast.error('Erro ao remover box');
    },
  });
}

export function useVincularBoxUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      boxId, 
      unidadeId, 
      empreendimentoId,
      status = 'reservado'
    }: { 
      boxId: string; 
      unidadeId: string | null; 
      empreendimentoId: string;
      status?: 'disponivel' | 'reservado' | 'vendido';
    }) => {
      const { data: result, error } = await supabase
        .from('boxes')
        .update({ 
          unidade_id: unidadeId,
          status: unidadeId ? status : 'disponivel'
        })
        .eq('id', boxId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', empreendimentoId] });
      toast.success('Vínculo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao vincular box:', error);
      toast.error('Erro ao vincular box');
    },
  });
}

// Excluir boxes em lote
export function useDeleteBoxesBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, empreendimentoId }: { ids: string[]; empreendimentoId: string }) => {
      const { error } = await supabase
        .from('boxes')
        .update({ is_active: false })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId, ids }) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', empreendimentoId] });
      toast.success(`${ids.length} box(es) removido(s) com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao remover boxes:', error);
      toast.error('Erro ao remover boxes');
    },
  });
}
