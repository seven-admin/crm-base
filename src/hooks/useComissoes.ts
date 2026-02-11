import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  Comissao, 
  ComissaoParcela, 
  ComissaoFormData, 
  ComissaoFilters,
  ComissaoStatus,
  ConfiguracaoComissoes,
  PagamentoData 
} from '@/types/comissoes.types';

// =====================================================
// COMISSOES HOOKS - Simplificado para Gestor do Produto
// =====================================================

export function useComissoes(filters?: ComissaoFilters) {
  return useQuery({
    queryKey: ['comissoes', filters],
    queryFn: async () => {
      let query = supabase
        .from('comissoes')
        .select(`
          *,
          contrato:contratos(numero),
          empreendimento:empreendimentos(nome),
          gestor:profiles!comissoes_gestor_id_fkey(full_name),
          corretor:corretores!comissoes_corretor_id_fkey(nome_completo),
          imobiliaria:imobiliarias!comissoes_imobiliaria_id_fkey(nome)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }
      if (filters?.gestor_id) {
        query = query.eq('gestor_id', filters.gestor_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Comissao[];
    },
  });
}

export function useComissoesPaginated(filters?: ComissaoFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['comissoes-paginated', filters, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('comissoes')
        .select(`
          *,
          contrato:contratos(numero),
          empreendimento:empreendimentos(nome),
          gestor:profiles!comissoes_gestor_id_fkey(full_name),
          corretor:corretores!comissoes_corretor_id_fkey(nome_completo),
          imobiliaria:imobiliarias!comissoes_imobiliaria_id_fkey(nome)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }
      if (filters?.gestor_id) {
        query = query.eq('gestor_id', filters.gestor_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        comissoes: data as unknown as Comissao[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
}

export function useComissao(id: string | null) {
  return useQuery({
    queryKey: ['comissao', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('comissoes')
        .select(`
          *,
          contrato:contratos(numero),
          empreendimento:empreendimentos(nome),
          gestor:profiles!comissoes_gestor_id_fkey(full_name)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as Comissao;
    },
    enabled: !!id,
  });
}

export function useCreateComissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ComissaoFormData) => {
      const { data, error } = await supabase
        .from('comissoes')
        .insert({
          numero: 'TEMP', // Will be replaced by trigger
          contrato_id: formData.contrato_id ?? null,
          empreendimento_id: formData.empreendimento_id,
          gestor_id: formData.gestor_id ?? null,
          valor_venda: formData.valor_venda,
          percentual_comissao: formData.percentual_comissao,
          valor_comissao: formData.valor_comissao,
          observacoes: formData.observacoes ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-paginated'] });
      toast.success('Comissão criada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar comissão:', error);
      toast.error('Erro ao criar comissão');
    },
  });
}

export function useUpdateComissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Comissao> & { id: string }) => {
      const { error } = await supabase
        .from('comissoes')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['comissao'] });
      toast.success('Comissão atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar comissão:', error);
      toast.error('Erro ao atualizar comissão');
    },
  });
}

export function useRegistrarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PagamentoData) => {
      const updateData: Record<string, unknown> = {
        status: 'pago' as ComissaoStatus,
        data_pagamento: data.data_pagamento,
      };
      
      if (data.nf_numero) {
        updateData.nf_numero = data.nf_numero;
      }

      const { error } = await supabase
        .from('comissoes')
        .update(updateData)
        .eq('id', data.comissao_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['comissao'] });
      toast.success('Pagamento registrado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    },
  });
}

// New hook that integrates with cash flow
interface PagamentoComissaoData {
  comissao_id: string;
  data_pagamento: string;
  centro_custo_id: string;
  categoria_fluxo_id?: string;
  nf_numero?: string;
  observacoes?: string;
}

export function useRegistrarPagamentoComissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PagamentoComissaoData) => {
      // 1. Fetch full commission data
      const { data: comissao, error: fetchError } = await supabase
        .from('comissoes')
        .select(`
          *,
          gestor:profiles!comissoes_gestor_id_fkey(id, full_name),
          empreendimento:empreendimentos(nome)
        `)
        .eq('id', data.comissao_id)
        .single();

      if (fetchError) throw fetchError;
      if (!comissao) throw new Error('Comissão não encontrada');

      // 2. Check if there's an existing linked financial entry
      const { data: lancamentoExistente } = await supabase
        .from('lancamentos_financeiros')
        .select('id')
        .eq('comissao_id', data.comissao_id)
        .maybeSingle();

      const descricao = `Comissão ${comissao.numero} - ${comissao.gestor?.full_name || 'Gestor'}`;

      // 3. If exists, update to paid status
      if (lancamentoExistente) {
        const { error: updateLancError } = await supabase
          .from('lancamentos_financeiros')
          .update({
            status: 'pago',
            data_pagamento: data.data_pagamento,
            centro_custo_id: data.centro_custo_id,
            categoria_fluxo_id: data.categoria_fluxo_id || null,
            nf_numero: data.nf_numero || null,
            observacoes: data.observacoes || null,
          })
          .eq('id', lancamentoExistente.id);

        if (updateLancError) throw updateLancError;
      } else {
        // 4. If doesn't exist, create new financial entry
        const { error: insertError } = await supabase
          .from('lancamentos_financeiros')
          .insert({
            tipo: 'saida',
            descricao,
            valor: comissao.valor_comissao || 0,
            data_vencimento: data.data_pagamento,
            data_pagamento: data.data_pagamento,
            status: 'pago',
            centro_custo_id: data.centro_custo_id,
            categoria_fluxo_id: data.categoria_fluxo_id || null,
            beneficiario_id: comissao.gestor_id || null,
            beneficiario_tipo: comissao.gestor_id ? 'gestor' : null,
            comissao_id: data.comissao_id,
            empreendimento_id: comissao.empreendimento_id,
            nf_numero: data.nf_numero || null,
            observacoes: data.observacoes || null,
          });

        if (insertError) throw insertError;
      }

      // 5. Update commission status to paid
      const { error: updateComissaoError } = await supabase
        .from('comissoes')
        .update({
          status: 'pago' as ComissaoStatus,
          data_pagamento: data.data_pagamento,
          nf_numero: data.nf_numero || null,
        })
        .eq('id', data.comissao_id);

      if (updateComissaoError) throw updateComissaoError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['comissao'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      toast.success('Pagamento registrado e lançado no fluxo de caixa');
    },
    onError: (error) => {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    },
  });
}

export function useDeleteComissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comissoes')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-paginated'] });
      toast.success('Comissão excluída com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao excluir comissão:', error);
      toast.error('Erro ao excluir comissão');
    },
  });
}

// =====================================================
// PARCELAS HOOKS
// =====================================================

export function useComissaoParcelas(comissaoId: string | null) {
  return useQuery({
    queryKey: ['comissao_parcelas', comissaoId],
    queryFn: async () => {
      if (!comissaoId) return [];
      const { data, error } = await supabase
        .from('comissao_parcelas')
        .select('*')
        .eq('comissao_id', comissaoId)
        .order('parcela', { ascending: true });
      if (error) throw error;
      return data as ComissaoParcela[];
    },
    enabled: !!comissaoId,
  });
}

export function useCreateParcela() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ComissaoParcela, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('comissao_parcelas')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissao_parcelas'] });
      toast.success('Parcela criada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar parcela:', error);
      toast.error('Erro ao criar parcela');
    },
  });
}

export function useUpdateParcela() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ComissaoParcela> & { id: string }) => {
      const { error } = await supabase
        .from('comissao_parcelas')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissao_parcelas'] });
      toast.success('Parcela atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar parcela:', error);
      toast.error('Erro ao atualizar parcela');
    },
  });
}

// =====================================================
// CONFIGURACAO HOOKS
// =====================================================

export function useConfiguracaoComissoes(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['configuracao_comissoes', empreendimentoId],
    queryFn: async () => {
      let query = supabase
        .from('configuracao_comissoes')
        .select('*');

      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ConfiguracaoComissoes[];
    },
  });
}

export function useUpsertConfiguracaoComissoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ConfiguracaoComissoes>) => {
      const { error } = await supabase
        .from('configuracao_comissoes')
        .upsert(data, { onConflict: 'empreendimento_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao_comissoes'] });
      toast.success('Configuração salva com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    },
  });
}

// =====================================================
// STATISTICS HOOKS - Simplificado para Gestor do Produto
// =====================================================

export function useComissaoStats(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['comissao_stats', empreendimentoId],
    queryFn: async () => {
      let query = supabase
        .from('comissoes')
        .select('*')
        .eq('is_active', true);

      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const comissoes = data as unknown as Comissao[];

      const totalVendas = comissoes.reduce((sum, c) => sum + Number(c.valor_venda), 0);
      const totalComissao = comissoes.reduce((sum, c) => sum + Number(c.valor_comissao || 0), 0);
      const totalPago = comissoes
        .filter(c => c.status === 'pago')
        .reduce((sum, c) => sum + Number(c.valor_comissao || 0), 0);
      const totalPendente = comissoes
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + Number(c.valor_comissao || 0), 0);

      return {
        totalVendas,
        totalComissao,
        totalPago,
        totalPendente,
        quantidadeComissoes: comissoes.length,
      };
    },
  });
}
