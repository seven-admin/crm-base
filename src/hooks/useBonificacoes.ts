import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getClientesHistoricosIds } from '@/lib/contratoFilters';
import { toast } from 'sonner';
import type { 
  Bonificacao, 
  BonificacaoFormData,
  UsuarioEmpreendimentoBonus,
  TipoBonificacao,
  StatusBonificacao
} from '@/types/financeiro.types';

interface BonificacaoFilters {
  empreendimento_id?: string;
  user_id?: string;
  tipo?: TipoBonificacao;
  status?: StatusBonificacao;
}

// Fetch bonificações
export function useBonificacoes(filters?: BonificacaoFilters) {
  return useQuery({
    queryKey: ['bonificacoes', filters],
    queryFn: async () => {
      let query = supabase
        .from('bonificacoes')
        .select(`
          *,
          empreendimento:empreendimentos(id, nome),
          user:profiles(id, full_name)
        `)
        .order('periodo_inicio', { ascending: false });

      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Bonificacao[];
    }
  });
}

// Create bonificação
export function useCreateBonificacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: BonificacaoFormData) => {
      const { error } = await supabase
        .from('bonificacoes')
        .insert(formData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonificacoes'] });
      toast.success('Bonificação criada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar bonificação:', error);
      toast.error('Erro ao criar bonificação');
    }
  });
}

// Update bonificação
export function useUpdateBonificacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Bonificacao> }) => {
      const { error } = await supabase
        .from('bonificacoes')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonificacoes'] });
      toast.success('Bonificação atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar bonificação:', error);
      toast.error('Erro ao atualizar bonificação');
    }
  });
}

// Registrar pagamento de bonificação
export function useRegistrarPagamentoBonificacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data_pagamento, 
      nf_numero 
    }: { 
      id: string; 
      data_pagamento: string; 
      nf_numero?: string;
    }) => {
      const { error } = await supabase
        .from('bonificacoes')
        .update({
          status: 'pago',
          data_pagamento,
          nf_numero,
          nf_quitada: true
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonificacoes'] });
      toast.success('Pagamento registrado');
    },
    onError: (error) => {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
  });
}

// Calcular bonificação
export function useCalcularBonificacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar bonificação
      const { data: bonificacao, error: fetchError } = await supabase
        .from('bonificacoes')
        .select('*, empreendimento:empreendimentos(id, nome, meta_6_meses, meta_12_meses)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Contar unidades vendidas no período (excluindo comprador histórico)
      const historicosIds = await getClientesHistoricosIds();

      let contratosQuery = supabase
        .from('contratos')
        .select('id', { count: 'exact' })
        .eq('empreendimento_id', bonificacao.empreendimento_id)
        .gte('data_geracao', bonificacao.periodo_inicio)
        .lte('data_geracao', bonificacao.periodo_fim)
        .eq('status', 'assinado');

      if (historicosIds.length > 0) {
        contratosQuery = contratosQuery.not('cliente_id', 'in', `(${historicosIds.join(',')})`);
      }

      const { count, error: countError } = await contratosQuery;

      if (countError) throw countError;

      const unidadesVendidas = count || 0;
      const meta = bonificacao.meta_unidades || 
        (bonificacao.tipo === 'meta_6_meses' 
          ? (bonificacao.empreendimento as unknown as { meta_6_meses: number })?.meta_6_meses 
          : (bonificacao.empreendimento as unknown as { meta_12_meses: number })?.meta_12_meses) || 0;
      
      const percentualAtingimento = meta > 0 ? (unidadesVendidas / meta) * 100 : 0;

      // Atualizar bonificação
      const { error: updateError } = await supabase
        .from('bonificacoes')
        .update({
          unidades_vendidas: unidadesVendidas,
          percentual_atingimento: percentualAtingimento,
          status: 'calculado'
        })
        .eq('id', id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonificacoes'] });
      toast.success('Bonificação calculada');
    },
    onError: (error) => {
      console.error('Erro ao calcular bonificação:', error);
      toast.error('Erro ao calcular bonificação');
    }
  });
}

// Lançar bonificação no fluxo de caixa
export function useLancarBonificacaoNoFinanceiro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bonificacaoId: string) => {
      // Buscar bonificação com dados completos
      const { data: bonificacao, error: fetchError } = await supabase
        .from('bonificacoes')
        .select(`
          *,
          empreendimento:empreendimentos(id, nome),
          user:profiles(id, full_name)
        `)
        .eq('id', bonificacaoId)
        .single();

      if (fetchError) throw fetchError;

      // Criar lançamento financeiro
      const { data: lancamento, error: insertError } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          tipo: 'pagar',
          descricao: `Bonificação - ${(bonificacao.user as any)?.full_name} - ${(bonificacao.empreendimento as any)?.nome}`,
          valor: bonificacao.valor_bonificacao || 0,
          data_vencimento: bonificacao.periodo_fim,
          empreendimento_id: bonificacao.empreendimento_id,
          bonificacao_id: bonificacaoId,
          status: 'pendente',
          status_conferencia: 'aprovado'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualizar bonificação com status 'lancado'
      const { error: updateError } = await supabase
        .from('bonificacoes')
        .update({ 
          status: 'lancado'
        })
        .eq('id', bonificacaoId);

      if (updateError) throw updateError;

      return lancamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success('Bonificação lançada no fluxo de caixa');
    },
    onError: (error) => {
      console.error('Erro ao lançar bonificação:', error);
      toast.error('Erro ao lançar no financeiro');
    }
  });
}

// Elegibilidade de usuários
export function useUsuarioEmpreendimentoBonus(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['usuario-empreendimento-bonus', empreendimentoId],
    queryFn: async () => {
      let query = supabase
        .from('usuario_empreendimento_bonus')
        .select(`
          *,
          user:profiles(id, full_name, email)
        `);

      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as (UsuarioEmpreendimentoBonus & { user: { id: string; full_name: string; email: string } })[];
    },
    enabled: !!empreendimentoId
  });
}

// Upsert elegibilidade
export function useUpsertUsuarioEmpreendimentoBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { user_id: string; empreendimento_id: string; elegivel_bonificacao: boolean }) => {
      const { error } = await supabase
        .from('usuario_empreendimento_bonus')
        .upsert(data, { onConflict: 'user_id,empreendimento_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuario-empreendimento-bonus'] });
      toast.success('Elegibilidade atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar elegibilidade:', error);
      toast.error('Erro ao atualizar elegibilidade');
    }
  });
}