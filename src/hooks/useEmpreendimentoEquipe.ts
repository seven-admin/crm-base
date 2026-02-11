import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EmpreendimentoCorretor, EmpreendimentoImobiliaria } from '@/types/empreendimentos.types';

export function useEmpreendimentoCorretores(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['empreendimento-corretores', empreendimentoId],
    queryFn: async (): Promise<EmpreendimentoCorretor[]> => {
      if (!empreendimentoId) return [];

      const { data, error } = await supabase
        .from('empreendimento_corretores')
        .select(`
          *,
          corretor:corretores(id, nome_completo, email, telefone, creci)
        `)
        .eq('empreendimento_id', empreendimentoId)
        .order('autorizado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!empreendimentoId,
  });
}

export function useEmpreendimentoImobiliarias(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['empreendimento-imobiliarias', empreendimentoId],
    queryFn: async (): Promise<EmpreendimentoImobiliaria[]> => {
      if (!empreendimentoId) return [];

      const { data, error } = await supabase
        .from('empreendimento_imobiliarias')
        .select(`
          *,
          imobiliaria:imobiliarias(id, nome, email, telefone)
        `)
        .eq('empreendimento_id', empreendimentoId)
        .order('autorizado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!empreendimentoId,
  });
}

export function useAddCorretorToEmpreendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, corretorId }: { empreendimentoId: string; corretorId: string }) => {
      const { data: result, error } = await supabase
        .from('empreendimento_corretores')
        .insert({
          empreendimento_id: empreendimentoId,
          corretor_id: corretorId,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-corretores', empreendimentoId] });
      toast.success('Corretor adicionado ao empreendimento!');
    },
    onError: (error: Error) => {
      console.error('Erro ao adicionar corretor:', error);
      if (error.message.includes('duplicate')) {
        toast.error('Corretor já está vinculado a este empreendimento');
      } else {
        toast.error('Erro ao adicionar corretor');
      }
    },
  });
}

export function useRemoveCorretorFromEmpreendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId }: { id: string; empreendimentoId: string }) => {
      const { error } = await supabase
        .from('empreendimento_corretores')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-corretores', empreendimentoId] });
      toast.success('Corretor removido do empreendimento!');
    },
    onError: (error) => {
      console.error('Erro ao remover corretor:', error);
      toast.error('Erro ao remover corretor');
    },
  });
}

export function useAddImobiliariaToEmpreendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      empreendimentoId, 
      imobiliariaId, 
      comissaoPercentual 
    }: { 
      empreendimentoId: string; 
      imobiliariaId: string; 
      comissaoPercentual?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('empreendimento_imobiliarias')
        .insert({
          empreendimento_id: empreendimentoId,
          imobiliaria_id: imobiliariaId,
          comissao_percentual: comissaoPercentual,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-imobiliarias', empreendimentoId] });
      toast.success('Imobiliária adicionada ao empreendimento!');
    },
    onError: (error: Error) => {
      console.error('Erro ao adicionar imobiliária:', error);
      if (error.message.includes('duplicate')) {
        toast.error('Imobiliária já está vinculada a este empreendimento');
      } else {
        toast.error('Erro ao adicionar imobiliária');
      }
    },
  });
}

export function useRemoveImobiliariaFromEmpreendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId }: { id: string; empreendimentoId: string }) => {
      const { error } = await supabase
        .from('empreendimento_imobiliarias')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-imobiliarias', empreendimentoId] });
      toast.success('Imobiliária removida do empreendimento!');
    },
    onError: (error) => {
      console.error('Erro ao remover imobiliária:', error);
      toast.error('Erro ao remover imobiliária');
    },
  });
}

export function useUpdateImobiliariaComissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      empreendimentoId, 
      comissaoPercentual 
    }: { 
      id: string; 
      empreendimentoId: string; 
      comissaoPercentual: number;
    }) => {
      const { data: result, error } = await supabase
        .from('empreendimento_imobiliarias')
        .update({ comissao_percentual: comissaoPercentual })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-imobiliarias', empreendimentoId] });
      toast.success('Comissão atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar comissão:', error);
      toast.error('Erro ao atualizar comissão');
    },
  });
}
