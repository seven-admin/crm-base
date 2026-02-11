import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ContratoSignatario, SignatarioFormData, SignatarioStatus } from '@/types/assinaturas.types';
import { toast } from 'sonner';

export function useContratoSignatarios(contratoId: string | undefined) {
  return useQuery({
    queryKey: ['contrato-signatarios', contratoId],
    queryFn: async () => {
      if (!contratoId) return [];
      
      const { data, error } = await supabase
        .from('contrato_signatarios')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as ContratoSignatario[];
    },
    enabled: !!contratoId
  });
}

export function useAddSignatario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, data }: { contratoId: string; data: SignatarioFormData }) => {
      // Generate token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_signature_token');
      
      if (tokenError) throw tokenError;

      const { data: result, error } = await supabase
        .from('contrato_signatarios')
        .insert({
          contrato_id: contratoId,
          ...data,
          token_assinatura: tokenData
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-signatarios', variables.contratoId] });
      toast.success('Signatário adicionado com sucesso');
    },
    onError: (error) => {
      console.error('Error adding signatario:', error);
      toast.error('Erro ao adicionar signatário');
    }
  });
}

export function useUpdateSignatario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, contratoId, data }: { id: string; contratoId: string; data: Partial<SignatarioFormData> }) => {
      const { data: result, error } = await supabase
        .from('contrato_signatarios')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-signatarios', variables.contratoId] });
      toast.success('Signatário atualizado');
    },
    onError: (error) => {
      console.error('Error updating signatario:', error);
      toast.error('Erro ao atualizar signatário');
    }
  });
}

export function useUpdateSignatarioStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      contratoId, 
      status, 
      extras 
    }: { 
      id: string; 
      contratoId: string; 
      status: SignatarioStatus;
      extras?: Record<string, unknown>;
    }) => {
      const updateData: Record<string, unknown> = { status, ...extras };

      // Set appropriate timestamp based on status
      if (status === 'enviado') updateData.data_envio = new Date().toISOString();
      if (status === 'visualizado') updateData.data_visualizacao = new Date().toISOString();
      if (status === 'assinado') updateData.data_assinatura = new Date().toISOString();

      const { data, error } = await supabase
        .from('contrato_signatarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-signatarios', variables.contratoId] });
    },
    onError: (error) => {
      console.error('Error updating signatario status:', error);
      toast.error('Erro ao atualizar status');
    }
  });
}

export function useDeleteSignatario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, contratoId }: { id: string; contratoId: string }) => {
      const { error } = await supabase
        .from('contrato_signatarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-signatarios', variables.contratoId] });
      toast.success('Signatário removido');
    },
    onError: (error) => {
      console.error('Error deleting signatario:', error);
      toast.error('Erro ao remover signatário');
    }
  });
}

export function useSignatarioByToken(token: string | undefined) {
  return useQuery({
    queryKey: ['signatario-token', token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from('contrato_signatarios')
        .select(`
          *,
          contrato:contratos(
            id,
            numero,
            conteudo_html,
            valor_contrato,
            cliente:clientes(nome, cpf, email),
            empreendimento:empreendimentos(nome)
          )
        `)
        .eq('token_assinatura', token)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!token
  });
}
