import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserEmpreendimento {
  id: string;
  user_id: string;
  empreendimento_id: string;
  created_at: string;
}

export interface EmpreendimentoWithLink {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  status: string;
  is_linked: boolean;
  unidades_count: number;
}

// Fetch user empreendimentos
export function useUserEmpreendimentos(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-empreendimentos', userId],
    queryFn: async (): Promise<UserEmpreendimento[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_empreendimentos')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });
}

// Fetch all empreendimentos with link status
export function useEmpreendimentosWithLinks(userId: string | undefined) {
  return useQuery({
    queryKey: ['empreendimentos-with-links', userId],
    queryFn: async (): Promise<EmpreendimentoWithLink[]> => {
      if (!userId) return [];

      // Fetch all active empreendimentos with unit count
      const { data: empreendimentos, error: empError } = await supabase
        .from('empreendimentos')
        .select('id, nome, endereco_cidade, endereco_uf, status, unidades(count)')
        .eq('is_active', true)
        .order('nome');

      if (empError) throw empError;

      // Fetch user links
      const { data: links, error: linksError } = await supabase
        .from('user_empreendimentos')
        .select('empreendimento_id')
        .eq('user_id', userId);

      if (linksError) throw linksError;

      const linkedIds = new Set((links || []).map(l => l.empreendimento_id));

      return (empreendimentos || []).map(emp => {
        const unidadesData = emp.unidades as unknown as { count: number }[] | null;
        const unidadesCount = unidadesData?.[0]?.count || 0;
        
        return {
          id: emp.id,
          nome: emp.nome,
          cidade: emp.endereco_cidade,
          uf: emp.endereco_uf,
          status: emp.status,
          is_linked: linkedIds.has(emp.id),
          unidades_count: unidadesCount
        };
      });
    },
    enabled: !!userId
  });
}

// Toggle empreendimento link
export function useToggleUserEmpreendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, empreendimentoId, link }: { userId: string; empreendimentoId: string; link: boolean }) => {
      if (link) {
        // Create link
        const { error } = await supabase
          .from('user_empreendimentos')
          .insert({
            user_id: userId,
            empreendimento_id: empreendimentoId
          });

        if (error) throw error;
      } else {
        // Remove link
        const { error } = await supabase
          .from('user_empreendimentos')
          .delete()
          .eq('user_id', userId)
          .eq('empreendimento_id', empreendimentoId);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-empreendimentos', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos-with-links', variables.userId] });
      toast.success(variables.link ? 'Empreendimento vinculado' : 'Empreendimento desvinculado');
    },
    onError: (error) => {
      console.error('Error toggling empreendimento:', error);
      toast.error('Erro ao atualizar vínculo');
    }
  });
}

// Bulk link empreendimentos
export function useBulkLinkEmpreendimentos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, empreendimentoIds }: { userId: string; empreendimentoIds: string[] }) => {
      // First, delete all existing links
      const { error: deleteError } = await supabase
        .from('user_empreendimentos')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then, insert all new links
      if (empreendimentoIds.length > 0) {
        const links = empreendimentoIds.map(empId => ({
          user_id: userId,
          empreendimento_id: empId
        }));

        const { error: insertError } = await supabase
          .from('user_empreendimentos')
          .insert(links);

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-empreendimentos', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos-with-links', variables.userId] });
      toast.success('Vínculos atualizados');
    },
    onError: (error) => {
      console.error('Error bulk linking:', error);
      toast.error('Erro ao atualizar vínculos');
    }
  });
}

// Clear all user empreendimento links
export function useClearUserEmpreendimentos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_empreendimentos')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['user-empreendimentos', userId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos-with-links', userId] });
      toast.success('Todos os vínculos removidos');
    },
    onError: (error) => {
      console.error('Error clearing links:', error);
      toast.error('Erro ao limpar vínculos');
    }
  });
}
