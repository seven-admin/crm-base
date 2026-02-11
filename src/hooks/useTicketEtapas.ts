import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TicketEtapa {
  id: string;
  nome: string;
  cor: string | null;
  cor_bg: string | null;
  ordem: number;
  categoria: string | null;
  is_inicial: boolean;
  is_final: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketEtapaFormData {
  nome: string;
  cor?: string;
  cor_bg?: string;
  ordem?: number;
  categoria?: string | null;
  is_inicial?: boolean;
  is_final?: boolean;
}

// Buscar todas as etapas de tickets ativas
export function useTicketEtapas(categoria?: string | null) {
  return useQuery({
    queryKey: ['ticket-etapas', categoria],
    queryFn: async () => {
      let query = supabase
        .from('ticket_etapas')
        .select('*')
        .eq('is_active', true)
        .order('ordem', { ascending: true });
      
      // Se categoria especificada, buscar etapas dessa categoria OU etapas globais (categoria = null)
      if (categoria) {
        query = query.or(`categoria.is.null,categoria.eq.${categoria}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TicketEtapa[];
    }
  });
}

// Buscar todas as etapas para configuração (inclui inativas)
export function useTicketEtapasConfig() {
  return useQuery({
    queryKey: ['ticket-etapas-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_etapas')
        .select('*')
        .order('categoria', { ascending: true, nullsFirst: true })
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as TicketEtapa[];
    }
  });
}

// Criar nova etapa
export function useCreateTicketEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TicketEtapaFormData) => {
      const { data: result, error } = await supabase
        .from('ticket_etapas')
        .insert({
          nome: data.nome,
          cor: data.cor || '#6b7280',
          cor_bg: data.cor_bg || '#f3f4f6',
          ordem: data.ordem || 0,
          categoria: data.categoria || null,
          is_inicial: data.is_inicial || false,
          is_final: data.is_final || false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-etapas-config'] });
      toast({ title: 'Etapa criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar etapa', description: error.message, variant: 'destructive' });
    }
  });
}

// Atualizar etapa
export function useUpdateTicketEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TicketEtapa> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('ticket_etapas')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-etapas-config'] });
      toast({ title: 'Etapa atualizada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar etapa', description: error.message, variant: 'destructive' });
    }
  });
}

// Excluir etapa (soft delete)
export function useDeleteTicketEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ticket_etapas')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-etapas-config'] });
      toast({ title: 'Etapa removida!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover etapa', description: error.message, variant: 'destructive' });
    }
  });
}

// Reordenar etapas
export function useReorderTicketEtapas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapas: { id: string; ordem: number }[]) => {
      const promises = etapas.map(({ id, ordem }) =>
        supabase
          .from('ticket_etapas')
          .update({ ordem })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-etapas-config'] });
    }
  });
}
