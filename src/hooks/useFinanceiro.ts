import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addMonths, endOfYear, format } from 'date-fns';
import type { 
  LancamentoFinanceiro, 
  LancamentoFormData, 
  PlanoConta,
  TipoLancamento,
  StatusLancamento,
  RecorrenciaFrequencia
} from '@/types/financeiro.types';
import { RECORRENCIA_MESES } from '@/types/financeiro.types';

function normalizeUpper(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  return trimmed ? trimmed.toUpperCase() : trimmed;
}

function normalizeLancamentoForSave<T extends Record<string, any>>(data: T): T {
  return {
    ...data,
    descricao: normalizeUpper(data.descricao),
    subcategoria: normalizeUpper(data.subcategoria),
    observacoes: normalizeUpper(data.observacoes),
    categoria_fluxo: normalizeUpper(data.categoria_fluxo),
  };
}

interface LancamentoFilters {
  tipo?: TipoLancamento;
  status?: StatusLancamento;
  empreendimento_id?: string;
  data_inicio?: string;
  data_fim?: string;
  centro_custo_id?: string;
  categoria_fluxo?: string;
  beneficiario_id?: string;
}

// Fetch lançamentos
export function useLancamentos(filters?: LancamentoFilters) {
  return useQuery({
    queryKey: ['lancamentos', filters],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          conta:plano_contas(id, codigo, nome, tipo),
          centro_custo:centros_custo(id, nome),
          empreendimento:empreendimentos(id, nome),
          contrato:contratos(id, numero),
          beneficiario:profiles!lancamentos_financeiros_beneficiario_id_fkey(id, full_name)
        `)
        .order('data_vencimento', { ascending: true });

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }
      if (filters?.data_inicio) {
        query = query.gte('data_vencimento', filters.data_inicio);
      }
      if (filters?.data_fim) {
        query = query.lte('data_vencimento', filters.data_fim);
      }
      if (filters?.centro_custo_id) {
        query = query.eq('centro_custo_id', filters.centro_custo_id);
      }
      if (filters?.categoria_fluxo) {
        query = query.eq('categoria_fluxo', filters.categoria_fluxo);
      }
      if (filters?.beneficiario_id) {
        query = query.eq('beneficiario_id', filters.beneficiario_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as LancamentoFinanceiro[];
    }
  });
}

// Fetch plano de contas
export function usePlanoContas() {
  return useQuery({
    queryKey: ['plano-contas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plano_contas')
        .select('*')
        .eq('is_active', true)
        .order('codigo');

      if (error) throw error;
      return data as PlanoConta[];
    }
  });
}

// Fetch centros de custo
export function useCentrosCusto() {
  return useQuery({
    queryKey: ['centros-custo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_custo')
        .select('*')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    }
  });
}

// Fetch categorias de fluxo
export function useCategoriasFluxo(tipo?: string) {
  return useQuery({
    queryKey: ['categorias-fluxo', tipo],
    queryFn: async () => {
      let query = supabase
        .from('categorias_fluxo')
        .select('*')
        .eq('is_active', true)
        .order('ordem');

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
}

// Helper para gerar datas de lançamentos recorrentes até o fim do ano fiscal
function generateRecurringDates(
  startDate: string,
  frequencia: RecorrenciaFrequencia
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const currentYear = start.getFullYear();
  const endYear = endOfYear(new Date(currentYear, 11, 31)); // Dezembro do ano corrente
  const intervalMonths = RECORRENCIA_MESES[frequencia];

  let currentDate = start;
  
  while (currentDate <= endYear) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addMonths(currentDate, intervalMonths);
  }

  return dates;
}

// Create lançamento (com suporte a recorrência)
export function useCreateLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: LancamentoFormData) => {
      const normalized = normalizeLancamentoForSave(formData);
      const { data: user } = await supabase.auth.getUser();
      
      // Verificar se a categoria tem aprovação automática
      let statusConferencia = 'pendente';
      if (normalized.categoria_fluxo) {
        const { data: categoria } = await supabase
          .from('categorias_fluxo')
          .select('aprovacao_automatica')
          .eq('nome', normalized.categoria_fluxo)
          .single();
        
        if (categoria?.aprovacao_automatica) {
          statusConferencia = 'aprovado';
        }
      }
      
      // Se for recorrente, gerar múltiplos lançamentos
      if (normalized.is_recorrente && normalized.recorrencia_frequencia) {
        const dates = generateRecurringDates(
          normalized.data_vencimento,
          normalized.recorrencia_frequencia
        );

        // Criar o primeiro lançamento (pai)
        const { data: paiData, error: paiError } = await supabase
          .from('lancamentos_financeiros')
          .insert({
            tipo: normalized.tipo,
            categoria_fluxo: normalized.categoria_fluxo,
            subcategoria: normalized.subcategoria,
            centro_custo_id: normalized.centro_custo_id,
            descricao: normalized.descricao,
            valor: normalized.valor,
            data_vencimento: dates[0],
            data_competencia: normalized.data_competencia,
            empreendimento_id: normalized.empreendimento_id,
            contrato_id: normalized.contrato_id,
            observacoes: normalized.observacoes,
            is_recorrente: true,
            recorrencia_frequencia: normalized.recorrencia_frequencia,
            status_conferencia: statusConferencia,
            beneficiario_id: normalized.beneficiario_id || null,
            beneficiario_tipo: normalized.beneficiario_tipo || null,
            created_by: user.user?.id
          })
          .select()
          .single();

        if (paiError) throw paiError;

        // Criar os lançamentos filhos (a partir do segundo)
        if (dates.length > 1) {
          const filhos = dates.slice(1).map(date => ({
            tipo: normalized.tipo,
            categoria_fluxo: normalized.categoria_fluxo,
            subcategoria: normalized.subcategoria,
            centro_custo_id: normalized.centro_custo_id,
            descricao: normalized.descricao,
            valor: normalized.valor,
            data_vencimento: date,
            data_competencia: normalized.data_competencia,
            empreendimento_id: normalized.empreendimento_id,
            contrato_id: normalized.contrato_id,
            observacoes: normalized.observacoes,
            is_recorrente: true,
            recorrencia_pai_id: paiData.id,
            recorrencia_frequencia: normalized.recorrencia_frequencia,
            status_conferencia: statusConferencia,
            beneficiario_id: normalized.beneficiario_id || null,
            beneficiario_tipo: normalized.beneficiario_tipo || null,
            created_by: user.user?.id
          }));

          const { error: filhosError } = await supabase
            .from('lancamentos_financeiros')
            .insert(filhos);

          if (filhosError) throw filhosError;
        }

        return { count: dates.length };
      }
      
      // Lançamento simples (não recorrente)
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          tipo: normalized.tipo,
          categoria_fluxo: normalized.categoria_fluxo,
          subcategoria: normalized.subcategoria,
          centro_custo_id: normalized.centro_custo_id,
          descricao: normalized.descricao,
          valor: normalized.valor,
          data_vencimento: normalized.data_vencimento,
          data_competencia: normalized.data_competencia,
          empreendimento_id: normalized.empreendimento_id,
          contrato_id: normalized.contrato_id,
          observacoes: normalized.observacoes,
          is_recorrente: false,
          status_conferencia: statusConferencia,
          beneficiario_id: normalized.beneficiario_id || null,
          beneficiario_tipo: normalized.beneficiario_tipo || null,
          created_by: user.user?.id
        });

      if (error) throw error;
      return { count: 1 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      if (result && result.count > 1) {
        toast.success(`${result.count} lançamentos recorrentes criados`);
      } else {
        toast.success('Lançamento criado com sucesso');
      }
    },
    onError: (error) => {
      console.error('Erro ao criar lançamento:', error);
      toast.error('Erro ao criar lançamento');
    }
  });
}

// Atualizar série recorrente (todos os futuros)
export function useUpdateRecurringSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      recorrenciaPaiId, 
      valor, 
      descricao 
    }: { 
      recorrenciaPaiId: string; 
      valor?: number; 
      descricao?: string;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (valor !== undefined) updateData.valor = valor;
      if (descricao !== undefined) updateData.descricao = descricao;

      // Atualizar o pai
      const { error: paiError } = await supabase
        .from('lancamentos_financeiros')
        .update(updateData)
        .eq('id', recorrenciaPaiId)
        .eq('status', 'pendente');

      if (paiError) throw paiError;

      // Atualizar todos os filhos pendentes
      const { error: filhosError } = await supabase
        .from('lancamentos_financeiros')
        .update(updateData)
        .eq('recorrencia_pai_id', recorrenciaPaiId)
        .eq('status', 'pendente');

      if (filhosError) throw filhosError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Série recorrente atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar série:', error);
      toast.error('Erro ao atualizar série recorrente');
    }
  });
}

// Excluir série recorrente (todos os pendentes)
export function useDeleteRecurringSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recorrenciaPaiId: string) => {
      // Excluir filhos pendentes
      const { error: filhosError } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('recorrencia_pai_id', recorrenciaPaiId)
        .eq('status', 'pendente');

      if (filhosError) throw filhosError;

      // Verificar se o pai está pendente e excluir
      const { error: paiError } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('id', recorrenciaPaiId)
        .eq('status', 'pendente');

      if (paiError) throw paiError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Série recorrente excluída');
    },
    onError: (error) => {
      console.error('Erro ao excluir série:', error);
      toast.error('Erro ao excluir série recorrente');
    }
  });
}

// Update lançamento
export function useUpdateLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LancamentoFinanceiro> }) => {
      const payload = normalizeLancamentoForSave(data);
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Lançamento atualizado');
    },
    onError: (error) => {
      console.error('Erro ao atualizar lançamento:', error);
      toast.error('Erro ao atualizar lançamento');
    }
  });
}

// Registrar pagamento
export function useRegistrarPagamentoLancamento() {
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
        .from('lancamentos_financeiros')
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
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Pagamento registrado');
    },
    onError: (error) => {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
  });
}

// Aprovar lançamentos (conferência)
export function useAprovarLancamentos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .update({
          status_conferencia: 'aprovado',
          conferido_por: user.user?.id,
          conferido_em: new Date().toISOString()
        })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Lançamentos aprovados com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao aprovar lançamentos:', error);
      toast.error('Erro ao aprovar lançamentos');
    }
  });
}

// Registrar pagamento em lote
export function useRegistrarPagamentoEmLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ids, 
      data_pagamento 
    }: { 
      ids: string[]; 
      data_pagamento: string;
    }) => {
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .update({
          status: 'pago',
          data_pagamento,
          nf_quitada: true
        })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Pagamentos registrados com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao registrar pagamentos:', error);
      toast.error('Erro ao registrar pagamentos em lote');
    }
  });
}

// Delete lançamento
export function useDeleteLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Lançamento excluído');
    },
    onError: (error) => {
      console.error('Erro ao excluir lançamento:', error);
      toast.error('Erro ao excluir lançamento');
    }
  });
}

// Estatísticas financeiras
export function useFinanceiroStats(filters?: { empreendimento_id?: string; data_inicio?: string; data_fim?: string }) {
  return useQuery({
    queryKey: ['financeiro-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos_financeiros')
        .select('tipo, status, valor');

      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }
      if (filters?.data_inicio) {
        query = query.gte('data_vencimento', filters.data_inicio);
      }
      if (filters?.data_fim) {
        query = query.lte('data_vencimento', filters.data_fim);
      }

      const { data, error } = await query;
      if (error) throw error;

      const lancamentos = data as { tipo: string; status: string; valor: number }[];
      
      const totalReceber = lancamentos
        .filter(l => l.tipo === 'receber')
        .reduce((acc, l) => acc + (l.valor || 0), 0);
      
      const totalPagar = lancamentos
        .filter(l => l.tipo === 'pagar')
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      const receberPendente = lancamentos
        .filter(l => l.tipo === 'receber' && l.status === 'pendente')
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      const pagarPendente = lancamentos
        .filter(l => l.tipo === 'pagar' && l.status === 'pendente')
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      const receberPago = lancamentos
        .filter(l => l.tipo === 'receber' && l.status === 'pago')
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      const pagarPago = lancamentos
        .filter(l => l.tipo === 'pagar' && l.status === 'pago')
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      return {
        totalReceber,
        totalPagar,
        saldo: totalReceber - totalPagar,
        receberPendente,
        pagarPendente,
        receberPago,
        pagarPago,
        saldoRealizado: receberPago - pagarPago
      };
    }
  });
}