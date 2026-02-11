import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Unidade, UnidadeFormData, UnidadeStatus } from '@/types/empreendimentos.types';
import type { PolygonCoords } from '@/types/mapa.types';
import type { Json } from '@/integrations/supabase/types';

interface UnidadeFilters {
  blocoId?: string;
  tipologiaId?: string;
  status?: UnidadeStatus;
}

export function useUnidades(empreendimentoId: string | undefined, filters?: UnidadeFilters) {
  return useQuery({
    queryKey: ['unidades', empreendimentoId, filters],
    queryFn: async (): Promise<Unidade[]> => {
      if (!empreendimentoId) return [];

      let query = supabase
        .from('unidades')
        .select(`
          *,
          bloco:blocos(*),
          tipologia:tipologias(*),
          fachada:fachadas(id, nome, descricao, imagem_url)
        `)
        .eq('empreendimento_id', empreendimentoId)
        .eq('is_active', true)
        .order('andar', { ascending: true })
        .order('numero', { ascending: true });

      if (filters?.blocoId) {
        query = query.eq('bloco_id', filters.blocoId);
      }
      if (filters?.tipologiaId) {
        query = query.eq('tipologia_id', filters.tipologiaId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Cast polygon_coords from Json to PolygonCoords
      return (data || []).map((item) => ({
        ...item,
        polygon_coords: item.polygon_coords as unknown as PolygonCoords | null,
      })) as Unidade[];
    },
    enabled: !!empreendimentoId,
  });
}

export function useCreateUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, data }: { empreendimentoId: string; data: UnidadeFormData }) => {
      const insertData = {
        ...data,
        empreendimento_id: empreendimentoId,
        polygon_coords: data.polygon_coords as unknown as Json,
      };
      const { data: result, error } = await supabase
        .from('unidades')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['unidades', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success('Unidade criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar unidade:', error);
      toast.error('Erro ao criar unidade');
    },
  });
}

export function useCreateUnidadesBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, unidades }: { empreendimentoId: string; unidades: UnidadeFormData[] }) => {
      const unidadesWithEmp = unidades.map(u => ({
        ...u,
        empreendimento_id: empreendimentoId,
        polygon_coords: u.polygon_coords as unknown as Json,
      }));
      
      const { data: result, error } = await supabase
        .from('unidades')
        .insert(unidadesWithEmp)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: (data, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['unidades', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success(`${data?.length || 0} unidades criadas com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar unidades:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        toast.error('Erro: Há unidades duplicadas (mesmo número e bloco). Verifique o arquivo.');
      } else {
        toast.error('Erro ao criar unidades: ' + error.message);
      }
    },
  });
}

export function useUpdateUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId, data }: { id: string; empreendimentoId: string; data: Partial<UnidadeFormData> }) => {
      const updateData = {
        ...data,
        polygon_coords: data.polygon_coords as unknown as Json,
      };
      const { data: result, error } = await supabase
        .from('unidades')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['unidades', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success('Unidade atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar unidade:', error);
      toast.error('Erro ao atualizar unidade');
    },
  });
}

export function useDeleteUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId }: { id: string; empreendimentoId: string }) => {
      const { error } = await supabase
        .from('unidades')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['unidades', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success('Unidade removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover unidade:', error);
      toast.error('Erro ao remover unidade');
    },
  });
}

// Bulk update for editing multiple units at once - with history logging
export function useUpdateUnidadesBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      empreendimentoId, 
      updates,
      motivo
    }: { 
      empreendimentoId: string; 
      updates: Array<{ id: string; area_privativa?: number; valor?: number }>;
      motivo?: string;
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Fetch current values for history
      const { data: unidadesAtuais } = await supabase
        .from('unidades')
        .select('id, valor, area_privativa')
        .in('id', updates.map(u => u.id));

      // Prepare history entries
      const historicoEntries = updates
        .map(update => {
          const atual = unidadesAtuais?.find(u => u.id === update.id);
          if (!atual) return null;
          
          const valorMudou = update.valor !== undefined && update.valor !== atual.valor;
          const areaMudou = update.area_privativa !== undefined && update.area_privativa !== atual.area_privativa;
          
          if (!valorMudou && !areaMudou) return null;
          
          return {
            unidade_id: update.id,
            valor_anterior: atual.valor,
            valor_novo: update.valor ?? atual.valor,
            area_anterior: atual.area_privativa,
            area_nova: update.area_privativa ?? atual.area_privativa,
            alterado_por: userId,
            motivo: motivo || null,
          };
        })
        .filter((h): h is NonNullable<typeof h> => h !== null);

      // Insert history records
      if (historicoEntries.length > 0) {
        const { error: histError } = await supabase
          .from('unidade_historico_precos')
          .insert(historicoEntries);
        if (histError) console.error('Erro ao registrar histórico:', histError);
      }

      // Update each unit
      for (const update of updates) {
        const { error } = await supabase
          .from('unidades')
          .update({ 
            area_privativa: update.area_privativa, 
            valor: update.valor 
          })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['unidades', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      queryClient.invalidateQueries({ queryKey: ['unidade-historico-precos'] });
      toast.success('Valores atualizados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar valores:', error);
      toast.error('Erro ao atualizar valores');
    },
  });
}

// Bulk update for memorial, observations, fachada and area
export function useUpdateUnidadesMemorial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      empreendimentoId, 
      updates 
    }: { 
      empreendimentoId: string; 
      updates: Array<{ id: string; descricao?: string; observacoes?: string; fachada_id?: string | null; area_privativa?: number }> 
    }) => {
      // Update each unit
      for (const update of updates) {
        const updateData: Record<string, string | number | null | undefined> = {};
        if (update.descricao !== undefined) updateData.descricao = update.descricao;
        if (update.observacoes !== undefined) updateData.observacoes = update.observacoes;
        if (update.fachada_id !== undefined) updateData.fachada_id = update.fachada_id;
        if (update.area_privativa !== undefined) updateData.area_privativa = update.area_privativa;
        
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('unidades')
            .update(updateData)
            .eq('id', update.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['unidades', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      toast.success('Memorial e observações atualizados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar memorial:', error);
      toast.error('Erro ao atualizar memorial');
    },
  });
}

// Atualizar status em lote
export function useUpdateUnidadesStatusBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, empreendimentoId, status }: { ids: string[]; empreendimentoId: string; status: UnidadeStatus }) => {
      const { error } = await supabase
        .from('unidades')
        .update({ status })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId, ids }) => {
      queryClient.invalidateQueries({ queryKey: ['unidades', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success(`Status de ${ids.length} unidade(s) atualizado com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status das unidades');
    },
  });
}

// Excluir unidades em lote
export function useDeleteUnidadesBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, empreendimentoId }: { ids: string[]; empreendimentoId: string }) => {
      const { error } = await supabase
        .from('unidades')
        .update({ is_active: false })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId, ids }) => {
      queryClient.invalidateQueries({ queryKey: ['unidades', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success(`${ids.length} unidade(s) removida(s) com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao remover unidades:', error);
      toast.error('Erro ao remover unidades');
    },
  });
}
