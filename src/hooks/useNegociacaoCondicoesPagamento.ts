import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CondicaoPagamentoFormData } from '@/types/condicoesPagamento.types';

// Type assertion helper for new table
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface NegociacaoCondicaoPagamento {
  id: string;
  negociacao_id: string;
  tipo_parcela_codigo: string;
  ordem: number;
  quantidade: number;
  valor?: number | null;
  valor_tipo: string;
  data_vencimento?: string | null;
  intervalo_dias: number;
  evento_vencimento?: string | null;
  com_correcao: boolean;
  indice_correcao: string;
  parcelas_sem_correcao: number;
  forma_pagamento: string;
  forma_quitacao: string;
  descricao?: string | null;
  observacao_texto?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useNegociacaoCondicoesPagamento(negociacaoId: string | undefined) {
  return useQuery({
    queryKey: ['negociacao-condicoes-pagamento', negociacaoId],
    queryFn: async () => {
      if (!negociacaoId) return [];
      
      const { data, error } = await db
        .from('negociacao_condicoes_pagamento')
        .select('*')
        .eq('negociacao_id', negociacaoId)
        .eq('is_active', true)
        .order('ordem');
      
      if (error) throw error;
      return data as NegociacaoCondicaoPagamento[];
    },
    enabled: !!negociacaoId,
  });
}

export function useCreateNegociacaoCondicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { negociacao_id: string } & CondicaoPagamentoFormData & { ordem: number }) => {
      const { data: result, error } = await db
        .from('negociacao_condicoes_pagamento')
        .insert({
          negociacao_id: data.negociacao_id,
          tipo_parcela_codigo: data.tipo_parcela_codigo,
          ordem: data.ordem,
          descricao: data.descricao,
          quantidade: data.quantidade,
          valor: data.valor,
          valor_tipo: data.valor_tipo,
          data_vencimento: data.data_vencimento,
          intervalo_dias: data.intervalo_dias,
          evento_vencimento: data.evento_vencimento,
          com_correcao: data.com_correcao,
          indice_correcao: data.indice_correcao,
          parcelas_sem_correcao: data.parcelas_sem_correcao,
          forma_quitacao: data.forma_quitacao,
          forma_pagamento: data.forma_pagamento,
          observacao_texto: data.observacao_texto,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['negociacao-condicoes-pagamento', variables.negociacao_id] });
    },
  });
}

export function useUpdateNegociacaoCondicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, negociacaoId, ...data }: { id: string; negociacaoId: string } & Partial<CondicaoPagamentoFormData> & { ordem?: number }) => {
      const { data: result, error } = await db
        .from('negociacao_condicoes_pagamento')
        .update({
          tipo_parcela_codigo: data.tipo_parcela_codigo,
          ordem: data.ordem,
          descricao: data.descricao,
          quantidade: data.quantidade,
          valor: data.valor,
          valor_tipo: data.valor_tipo,
          data_vencimento: data.data_vencimento,
          intervalo_dias: data.intervalo_dias,
          evento_vencimento: data.evento_vencimento,
          com_correcao: data.com_correcao,
          indice_correcao: data.indice_correcao,
          parcelas_sem_correcao: data.parcelas_sem_correcao,
          forma_quitacao: data.forma_quitacao,
          forma_pagamento: data.forma_pagamento,
          observacao_texto: data.observacao_texto,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['negociacao-condicoes-pagamento', variables.negociacaoId] });
    },
  });
}

export function useDeleteNegociacaoCondicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, negociacaoId }: { id: string; negociacaoId: string }) => {
      const { error } = await db
        .from('negociacao_condicoes_pagamento')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['negociacao-condicoes-pagamento', variables.negociacaoId] });
    },
  });
}

// Copiar condições de uma negociação para um contrato
export function useCopyNegociacaoCondicoesToContrato() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ negociacaoId, contratoId }: { negociacaoId: string; contratoId: string }) => {
      // Buscar condições da negociação
      const { data: negociacaoCondicoes, error: fetchError } = await db
        .from('negociacao_condicoes_pagamento')
        .select('*')
        .eq('negociacao_id', negociacaoId)
        .eq('is_active', true)
        .order('ordem');
      
      if (fetchError) throw fetchError;
      if (!negociacaoCondicoes?.length) return [];
      
      // Copiar para o contrato
      const condicoesContrato = negociacaoCondicoes.map((nc: NegociacaoCondicaoPagamento) => ({
        contrato_id: contratoId,
        tipo_parcela_codigo: nc.tipo_parcela_codigo,
        ordem: nc.ordem,
        descricao: nc.descricao,
        quantidade: nc.quantidade,
        valor: nc.valor,
        valor_tipo: nc.valor_tipo,
        data_vencimento: nc.data_vencimento,
        intervalo_dias: nc.intervalo_dias,
        evento_vencimento: nc.evento_vencimento,
        com_correcao: nc.com_correcao,
        indice_correcao: nc.indice_correcao,
        parcelas_sem_correcao: nc.parcelas_sem_correcao,
        forma_quitacao: nc.forma_quitacao,
        forma_pagamento: nc.forma_pagamento,
        observacao_texto: nc.observacao_texto,
      }));
      
      const { data: result, error: insertError } = await supabase
        .from('contrato_condicoes_pagamento')
        .insert(condicoesContrato)
        .select();
      
      if (insertError) throw insertError;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-condicoes-pagamento', variables.contratoId] });
    },
  });
}
