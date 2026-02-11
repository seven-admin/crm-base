import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Bloco, BlocoFormData } from '@/types/empreendimentos.types';

interface BlocoComContagem extends Bloco {
  total_unidades_cadastradas: number;
}

export function useBlocos(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['blocos', empreendimentoId],
    queryFn: async (): Promise<Bloco[]> => {
      if (!empreendimentoId) return [];

      const { data, error } = await supabase
        .from('blocos')
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

export function useBlocosComContagem(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['blocos-contagem', empreendimentoId],
    queryFn: async (): Promise<BlocoComContagem[]> => {
      if (!empreendimentoId) return [];

      // Buscar blocos
      const { data: blocos, error: blocosError } = await supabase
        .from('blocos')
        .select('*')
        .eq('empreendimento_id', empreendimentoId)
        .eq('is_active', true)
        .order('nome');

      if (blocosError) throw blocosError;

      if (!blocos || blocos.length === 0) return [];

      // Buscar contagem de unidades por bloco
      const blocoIds = blocos.map(b => b.id);
      const { data: contagemData, error: contagemError } = await supabase
        .from('unidades')
        .select('bloco_id')
        .in('bloco_id', blocoIds)
        .eq('is_active', true);

      if (contagemError) throw contagemError;

      // Montar mapa de contagem
      const contagemMap: Record<string, number> = {};
      contagemData?.forEach(u => {
        if (u.bloco_id) {
          contagemMap[u.bloco_id] = (contagemMap[u.bloco_id] || 0) + 1;
        }
      });

      return blocos.map(b => ({
        ...b,
        total_unidades_cadastradas: contagemMap[b.id] || 0,
      }));
    },
    enabled: !!empreendimentoId,
  });
}

export function useCreateBloco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, data }: { empreendimentoId: string; data: BlocoFormData }) => {
      const { data: result, error } = await supabase
        .from('blocos')
        .insert({ ...data, empreendimento_id: empreendimentoId })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['blocos', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['blocos-contagem', empreendimentoId] });
      toast.success('Bloco/Torre criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar bloco:', error);
      toast.error('Erro ao criar bloco');
    },
  });
}

// Versão silenciosa para uso em importação (sem toast ou invalidação automática)
export function useCreateBlocoSilent() {
  return useMutation({
    mutationFn: async ({ empreendimentoId, data }: { empreendimentoId: string; data: BlocoFormData }) => {
      const { data: result, error } = await supabase
        .from('blocos')
        .insert({ ...data, empreendimento_id: empreendimentoId })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onError: (error) => {
      console.error('Erro ao criar bloco:', error);
    },
  });
}

export function useUpdateBloco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId, data }: { id: string; empreendimentoId: string; data: Partial<BlocoFormData> }) => {
      const { data: result, error } = await supabase
        .from('blocos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['blocos', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['blocos-contagem', empreendimentoId] });
      toast.success('Bloco/Torre atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar bloco:', error);
      toast.error('Erro ao atualizar bloco');
    },
  });
}

export function useDeleteBloco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId }: { id: string; empreendimentoId: string }) => {
      // Desvincular unidades do bloco antes de excluir
      const { error: updateError } = await supabase
        .from('unidades')
        .update({ bloco_id: null })
        .eq('bloco_id', id);

      if (updateError) throw updateError;

      // Soft delete do bloco
      const { error } = await supabase
        .from('blocos')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['blocos', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['blocos-contagem', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['unidades', empreendimentoId] });
      toast.success('Bloco/Torre removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover bloco:', error);
      toast.error('Erro ao remover bloco');
    },
  });
}

// Hook para atualizar contagem de unidades/lotes de cada bloco
export function useAtualizarContagemBlocos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (empreendimentoId: string) => {
      // Buscar todos os blocos do empreendimento
      const { data: blocos, error: blocosError } = await supabase
        .from('blocos')
        .select('id')
        .eq('empreendimento_id', empreendimentoId)
        .eq('is_active', true);

      if (blocosError) throw blocosError;
      if (!blocos || blocos.length === 0) return;

      // Para cada bloco, contar unidades e atualizar
      for (const bloco of blocos) {
        const { count, error: countError } = await supabase
          .from('unidades')
          .select('*', { count: 'exact', head: true })
          .eq('bloco_id', bloco.id)
          .eq('is_active', true);

        if (countError) continue;

        await supabase
          .from('blocos')
          .update({ unidades_por_andar: count })
          .eq('id', bloco.id);
      }
    },
    onSuccess: (_, empreendimentoId) => {
      queryClient.invalidateQueries({ queryKey: ['blocos', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['blocos-contagem', empreendimentoId] });
    },
  });
}
