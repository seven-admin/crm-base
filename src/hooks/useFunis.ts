import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Funil, FunilEtapa, FunilFormData, FunilEtapaFormData } from '@/types/funis.types';

// ============ FUNIS ============

export function useFunis() {
  return useQuery({
    queryKey: ['funis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funis')
        .select(`
          *,
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('nome');

      if (error) throw error;
      return data as Funil[];
    },
  });
}

export function useFunil(id: string | undefined) {
  return useQuery({
    queryKey: ['funis', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('funis')
        .select(`
          *,
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Funil;
    },
    enabled: !!id,
  });
}

export function useFunilPadrao() {
  return useQuery({
    queryKey: ['funis', 'padrao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funis')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as Funil;
    },
  });
}

export function useCreateFunil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FunilFormData) => {
      // Se for padrão, desmarcar outros
      if (data.is_default) {
        await supabase
          .from('funis')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { data: funil, error } = await supabase
        .from('funis')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return funil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
      toast.success('Funil criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar funil: ' + error.message);
    },
  });
}

export function useUpdateFunil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FunilFormData> }) => {
      // Se for padrão, desmarcar outros
      if (data.is_default) {
        await supabase
          .from('funis')
          .update({ is_default: false })
          .neq('id', id)
          .eq('is_default', true);
      }

      const { data: funil, error } = await supabase
        .from('funis')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return funil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
      toast.success('Funil atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar funil: ' + error.message);
    },
  });
}

export function useDeleteFunil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funis')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
      toast.success('Funil excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir funil: ' + error.message);
    },
  });
}

export function useDuplicarFunil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (funilId: string) => {
      // Buscar funil original com etapas
      const { data: funilOriginal, error: fetchError } = await supabase
        .from('funis')
        .select('*')
        .eq('id', funilId)
        .single();

      if (fetchError) throw fetchError;

      const { data: etapasOriginais, error: etapasError } = await supabase
        .from('funil_etapas')
        .select('*')
        .eq('funil_id', funilId)
        .eq('is_active', true)
        .order('ordem');

      if (etapasError) throw etapasError;

      // Criar novo funil
      const { data: novoFunil, error: createError } = await supabase
        .from('funis')
        .insert({
          nome: `${funilOriginal.nome} (cópia)`,
          descricao: funilOriginal.descricao,
          empreendimento_id: funilOriginal.empreendimento_id,
          is_default: false,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Duplicar etapas
      if (etapasOriginais && etapasOriginais.length > 0) {
        const novasEtapas = etapasOriginais.map((etapa) => ({
          funil_id: novoFunil.id,
          nome: etapa.nome,
          codigo: etapa.codigo,
          cor: etapa.cor,
          cor_bg: etapa.cor_bg,
          icone: etapa.icone,
          ordem: etapa.ordem,
          is_inicial: etapa.is_inicial,
          is_final_sucesso: etapa.is_final_sucesso,
          is_final_perda: etapa.is_final_perda,
        }));

        const { error: etapasInsertError } = await supabase
          .from('funil_etapas')
          .insert(novasEtapas);

        if (etapasInsertError) throw etapasInsertError;
      }

      return novoFunil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
      toast.success('Funil duplicado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao duplicar funil: ' + error.message);
    },
  });
}

// ============ ETAPAS ============

export function useFunilEtapas(funilId: string | undefined) {
  return useQuery({
    queryKey: ['funil_etapas', funilId],
    queryFn: async () => {
      if (!funilId) return [];
      const { data, error } = await supabase
        .from('funil_etapas')
        .select('*')
        .eq('funil_id', funilId)
        .eq('is_active', true)
        .order('ordem');

      if (error) throw error;
      return data as FunilEtapa[];
    },
    enabled: !!funilId,
  });
}

export function useEtapasPadraoAtivas() {
  return useQuery({
    queryKey: ['funil_etapas', 'padrao'],
    queryFn: async () => {
      // 1 request: filtra etapas do funil padrão via join
      const { data, error } = await supabase
        .from('funil_etapas')
        .select('*, funis!inner(is_default, is_active)')
        .eq('is_active', true)
        .eq('funis.is_default', true)
        .eq('funis.is_active', true)
        .order('ordem');

      if (error) throw error;
      return data as FunilEtapa[];
    },
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

export function useCreateEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ funilId, data }: { funilId: string; data: FunilEtapaFormData }) => {
      const { data: etapa, error } = await supabase
        .from('funil_etapas')
        .insert({ ...data, funil_id: funilId })
        .select()
        .single();

      if (error) throw error;
      return etapa;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['funil_etapas', variables.funilId] });
      toast.success('Etapa criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar etapa: ' + error.message);
    },
  });
}

export function useUpdateEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FunilEtapaFormData> }) => {
      const { data: etapa, error } = await supabase
        .from('funil_etapas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return etapa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funil_etapas'] });
      toast.success('Etapa atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar etapa: ' + error.message);
    },
  });
}

export function useDeleteEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funil_etapas')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funil_etapas'] });
      toast.success('Etapa excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir etapa: ' + error.message);
    },
  });
}

export function useReordenarEtapas(funilId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapas: { id: string; ordem: number }[]) => {
      const promises = etapas.map(({ id, ordem }) =>
        supabase.from('funil_etapas').update({ ordem }).eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidar query específica do funil
      if (funilId) {
        queryClient.invalidateQueries({ queryKey: ['funil_etapas', funilId] });
      }
      // E também a de etapas padrão (usada no Kanban)
      queryClient.invalidateQueries({ queryKey: ['funil_etapas', 'padrao'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao reordenar etapas: ' + error.message);
    },
  });
}
