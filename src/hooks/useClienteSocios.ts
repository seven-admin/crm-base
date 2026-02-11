import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClienteSocio, ClienteSocioFormData } from '@/types/clientes.types';
import { toast } from 'sonner';

export function useClienteSocios(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['cliente-socios', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];

      const { data, error } = await supabase
        .from('cliente_socios')
        .select(`
          id,
          cliente_id,
          socio_id,
          percentual_participacao,
          observacao,
          created_at,
          socio:clientes!cliente_socios_socio_id_fkey(id, nome, cpf)
        `)
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ClienteSocio[];
    },
    enabled: !!clienteId
  });
}

export function useAddClienteSocio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClienteSocioFormData) => {
      const { data: socio, error } = await supabase
        .from('cliente_socios')
        .insert({
          cliente_id: data.cliente_id,
          socio_id: data.socio_id,
          percentual_participacao: data.percentual_participacao || null,
          observacao: data.observacao || null,
        })
        .select()
        .single();

      if (error) throw error;
      return socio;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-socios', variables.cliente_id] });
      toast.success('Sócio adicionado com sucesso!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este cliente já está cadastrado como sócio.');
      } else if (error.message.includes('check')) {
        toast.error('Não é possível adicionar o próprio cliente como sócio.');
      } else {
        toast.error('Erro ao adicionar sócio: ' + error.message);
      }
    }
  });
}

export function useUpdateClienteSocio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      clienteId,
      data 
    }: { 
      id: string; 
      clienteId: string;
      data: Partial<Pick<ClienteSocioFormData, 'percentual_participacao' | 'observacao'>> 
    }) => {
      const { data: socio, error } = await supabase
        .from('cliente_socios')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return socio;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-socios', variables.clienteId] });
      toast.success('Sócio atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar sócio: ' + error.message);
    }
  });
}

export function useRemoveClienteSocio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clienteId }: { id: string; clienteId: string }) => {
      const { error } = await supabase
        .from('cliente_socios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-socios', variables.clienteId] });
      toast.success('Sócio removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover sócio: ' + error.message);
    }
  });
}
