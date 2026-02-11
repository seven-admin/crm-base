import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlanejamentoItemResponsavel {
  id: string;
  item_id: string;
  user_id: string;
  papel: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function usePlanejamentoItemResponsaveis(itemId?: string) {
  const queryClient = useQueryClient();

  const { data: responsaveis, isLoading } = useQuery({
    queryKey: ['planejamento-item-responsaveis', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      
      const { data, error } = await supabase
        .from('planejamento_item_responsaveis')
        .select(`
          *,
          user:profiles!user_id(id, full_name, email)
        `)
        .eq('item_id', itemId)
        .order('created_at');

      if (error) throw error;
      return data as PlanejamentoItemResponsavel[];
    },
    enabled: !!itemId
  });

  const addResponsavel = useMutation({
    mutationFn: async ({ itemId, userId, papel = 'responsavel' }: { itemId: string; userId: string; papel?: string }) => {
      const { data, error } = await supabase
        .from('planejamento_item_responsaveis')
        .insert({ item_id: itemId, user_id: userId, papel })
        .select(`
          *,
          user:profiles!user_id(id, full_name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-item-responsaveis', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
      toast.success('Responsável adicionado');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('Este responsável já está atribuído');
      } else {
        toast.error('Erro ao adicionar responsável');
      }
    }
  });

  const removeResponsavel = useMutation({
    mutationFn: async ({ id, itemId }: { id: string; itemId: string }) => {
      const { error } = await supabase
        .from('planejamento_item_responsaveis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return itemId;
    },
    onSuccess: (itemId) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-item-responsaveis', itemId] });
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
      toast.success('Responsável removido');
    },
    onError: () => {
      toast.error('Erro ao remover responsável');
    }
  });

  const setResponsaveis = useMutation({
    mutationFn: async ({ itemId, userIds }: { itemId: string; userIds: string[] }) => {
      // Remove todos os atuais
      await supabase
        .from('planejamento_item_responsaveis')
        .delete()
        .eq('item_id', itemId);

      // Adiciona os novos
      if (userIds.length > 0) {
        const { error } = await supabase
          .from('planejamento_item_responsaveis')
          .insert(userIds.map(userId => ({ item_id: itemId, user_id: userId })));

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-item-responsaveis', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar responsáveis');
    }
  });

  const addResponsaveisToMultiple = useMutation({
    mutationFn: async ({ itemIds, userIds }: { itemIds: string[]; userIds: string[] }) => {
      const inserts = itemIds.flatMap(itemId => 
        userIds.map(userId => ({ item_id: itemId, user_id: userId }))
      );

      const { error } = await supabase
        .from('planejamento_item_responsaveis')
        .upsert(inserts, { onConflict: 'item_id,user_id', ignoreDuplicates: true });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-item-responsaveis'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
    },
    onError: () => {
      toast.error('Erro ao adicionar responsáveis em lote');
    }
  });

  const removeAllResponsaveis = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const { error } = await supabase
        .from('planejamento_item_responsaveis')
        .delete()
        .in('item_id', itemIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-item-responsaveis'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
    },
    onError: () => {
      toast.error('Erro ao remover responsáveis');
    }
  });

  return {
    responsaveis,
    isLoading,
    addResponsavel,
    removeResponsavel,
    setResponsaveis,
    addResponsaveisToMultiple,
    removeAllResponsaveis
  };
}
