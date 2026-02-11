import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  PlanejamentoItem, 
  PlanejamentoItemWithRelations, 
  PlanejamentoItemCreate, 
  PlanejamentoItemUpdate,
  PlanejamentoFilters 
} from '@/types/planejamento.types';

export function usePlanejamentoItens(filters?: PlanejamentoFilters) {
  const queryClient = useQueryClient();

  const { data: itens, isLoading, refetch } = useQuery({
    queryKey: ['planejamento-itens', filters],
    queryFn: async () => {
      let query = supabase
        .from('planejamento_itens')
        .select(`
          *,
          fase:planejamento_fases(id, nome, cor, ordem),
          status:planejamento_status(id, nome, cor, is_final),
          responsavel:profiles!responsavel_tecnico_id(id, full_name, email),
          responsaveis:planejamento_item_responsaveis(
            id,
            user_id,
            papel,
            created_at,
            user:profiles!user_id(id, full_name, email)
          ),
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('is_active', true)
        .order('ordem');

      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }

      if (filters?.fase_id) {
        query = query.eq('fase_id', filters.fase_id);
      }

      if (filters?.status_id) {
        query = query.eq('status_id', filters.status_id);
      }

      if (filters?.responsavel_tecnico_id) {
        query = query.eq('responsavel_tecnico_id', filters.responsavel_tecnico_id);
      }

      if (filters?.busca) {
        query = query.ilike('item', `%${filters.busca}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PlanejamentoItemWithRelations[];
    },
    enabled: !!filters?.empreendimento_id || !filters
  });

  const createItem = useMutation({
    mutationFn: async (item: PlanejamentoItemCreate) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('planejamento_itens')
        .insert({
          ...item,
          created_by: userData.user?.id
        })
        .select(`
          *,
          fase:planejamento_fases(id, nome, cor, ordem),
          status:planejamento_status(id, nome, cor, is_final),
          responsavel:profiles!responsavel_tecnico_id(id, full_name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
      toast.success('Item criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar item: ' + error.message);
    }
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: PlanejamentoItemUpdate) => {
      const { data, error } = await supabase
        .from('planejamento_itens')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          fase:planejamento_fases(id, nome, cor, ordem),
          status:planejamento_status(id, nome, cor, is_final),
          responsavel:profiles!responsavel_tecnico_id(id, full_name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar item: ' + error.message);
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planejamento_itens')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
      toast.success('Item removido com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao remover item: ' + error.message);
    }
  });

  const duplicateItem = useMutation({
    mutationFn: async (id: string) => {
      // Buscar o item original
      const { data: original, error: fetchError } = await supabase
        .from('planejamento_itens')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { data: userData } = await supabase.auth.getUser();

      // Criar cópia
      const { id: _, created_at, updated_at, ...itemData } = original;
      const { data, error } = await supabase
        .from('planejamento_itens')
        .insert({
          ...itemData,
          item: `${itemData.item} (cópia)`,
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
      toast.success('Item duplicado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao duplicar item: ' + error.message);
    }
  });

  const createItemsBulk = useMutation({
    mutationFn: async (items: PlanejamentoItemCreate[]) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const itemsWithUser = items.map((item, index) => ({
        ...item,
        created_by: userData.user?.id,
        ordem: item.ordem ?? index + 1
      }));
      
      const { data, error } = await supabase
        .from('planejamento_itens')
        .insert(itemsWithUser)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
      toast.success(`${data.length} itens importados com sucesso`);
    },
    onError: (error) => {
      toast.error('Erro ao importar itens: ' + error.message);
    }
  });

  const reorderItems = useMutation({
    mutationFn: async (items: { id: string; ordem: number }[]) => {
      const promises = items.map(({ id, ordem }) =>
        supabase
          .from('planejamento_itens')
          .update({ ordem })
          .eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
    }
  });

  const deleteItemsBulk = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('planejamento_itens')
        .update({ is_active: false })
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
      toast.success(`${count} item(ns) removido(s) com sucesso`);
    },
    onError: (error) => {
      toast.error('Erro ao remover itens: ' + error.message);
    }
  });

  return {
    itens,
    isLoading,
    refetch,
    createItem,
    updateItem,
    deleteItem,
    duplicateItem,
    reorderItems,
    createItemsBulk,
    deleteItemsBulk
  };
}
