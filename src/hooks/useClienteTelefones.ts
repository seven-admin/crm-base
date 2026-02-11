import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClienteTelefone {
  id: string;
  cliente_id: string;
  numero: string;
  is_whatsapp: boolean;
  descricao?: string | null;
  principal: boolean;
  created_at: string;
}

export interface ClienteTelefoneFormData {
  numero: string;
  is_whatsapp?: boolean;
  descricao?: string;
  principal?: boolean;
}

export function useClienteTelefones(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['cliente-telefones', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];

      const { data, error } = await supabase
        .from('cliente_telefones')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('principal', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ClienteTelefone[];
    },
    enabled: !!clienteId,
  });
}

export function useCreateClienteTelefone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clienteId, 
      data 
    }: { 
      clienteId: string; 
      data: ClienteTelefoneFormData 
    }) => {
      const { data: result, error } = await supabase
        .from('cliente_telefones')
        .insert({
          cliente_id: clienteId,
          numero: data.numero,
          is_whatsapp: data.is_whatsapp ?? false,
          descricao: data.descricao || null,
          principal: data.principal ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-telefones', variables.clienteId] });
    },
    onError: (error) => {
      console.error('Erro ao adicionar telefone:', error);
      toast.error('Erro ao adicionar telefone');
    },
  });
}

export function useUpdateClienteTelefone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      clienteId,
      data 
    }: { 
      id: string; 
      clienteId: string;
      data: Partial<ClienteTelefoneFormData> 
    }) => {
      const { data: result, error } = await supabase
        .from('cliente_telefones')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-telefones', variables.clienteId] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar telefone:', error);
      toast.error('Erro ao atualizar telefone');
    },
  });
}

export function useDeleteClienteTelefone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      clienteId 
    }: { 
      id: string; 
      clienteId: string 
    }) => {
      const { error } = await supabase
        .from('cliente_telefones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-telefones', variables.clienteId] });
    },
    onError: (error) => {
      console.error('Erro ao remover telefone:', error);
      toast.error('Erro ao remover telefone');
    },
  });
}
