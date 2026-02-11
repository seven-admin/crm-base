import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Proposta, 
  PropostaFormData, 
  PropostaFilters, 
  PropostaUnidade,
  PropostaCondicaoPagamento
} from '@/types/propostas.types';
import { useAuth } from '@/contexts/AuthContext';

// Helper para queries na tabela propostas (tabela nova ainda não está nos types)
const propostasTable = () => supabase.from('propostas' as any);
const propostaUnidadesTable = () => supabase.from('proposta_unidades' as any);
const propostaCondicoesTable = () => supabase.from('proposta_condicoes_pagamento' as any);

// Buscar todas as propostas
export const usePropostas = (filters?: PropostaFilters) => {
  return useQuery({
    queryKey: ['propostas', filters],
    queryFn: async () => {
      let query = propostasTable()
        .select(`
          *,
          cliente:clientes(id, nome, telefone, email, cpf),
          empreendimento:empreendimentos(id, nome),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          gestor:profiles(id, full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }
      if (filters?.cliente_id) {
        query = query.eq('cliente_id', filters.cliente_id);
      }
      if (filters?.corretor_id) {
        query = query.eq('corretor_id', filters.corretor_id);
      }
      if (filters?.data_inicio) {
        query = query.gte('data_emissao', filters.data_inicio);
      }
      if (filters?.data_fim) {
        query = query.lte('data_emissao', filters.data_fim);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as Proposta[];
    },
  });
};

// Buscar proposta por ID
export const useProposta = (id: string | undefined) => {
  return useQuery({
    queryKey: ['proposta', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: proposta, error } = await propostasTable()
        .select(`
          *,
          cliente:clientes(id, nome, telefone, email, cpf),
          empreendimento:empreendimentos(id, nome),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          gestor:profiles(id, full_name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Buscar unidades da proposta
      const { data: unidades, error: unidadesError } = await propostaUnidadesTable()
        .select(`
          *,
          unidade:unidades(
            id, 
            codigo, 
            area_privativa, 
            valor_tabela,
            bloco:blocos(nome),
            tipologia:tipologias(nome)
          )
        `)
        .eq('proposta_id', id);
      
      if (unidadesError) throw unidadesError;
      
      // Buscar condições de pagamento
      const { data: condicoes, error: condicoesError } = await propostaCondicoesTable()
        .select('*')
        .eq('proposta_id', id)
        .eq('is_active', true)
        .order('ordem');
      
      if (condicoesError) throw condicoesError;
      
      const propostaData = proposta as unknown as Proposta;
      
      return {
        ...propostaData,
        unidades: unidades as unknown as PropostaUnidade[],
        condicoes_pagamento: condicoes as unknown as PropostaCondicaoPagamento[],
      } as Proposta;
    },
  });
};

// Criar proposta
export const useCreateProposta = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: PropostaFormData) => {
      // Calcular valores
      const valor_tabela = data.valor_tabela ?? 
        data.unidades.reduce((acc, u) => acc + (u.valor_tabela ?? 0), 0);
      
      const valor_proposta = data.valor_proposta ?? 
        data.unidades.reduce((acc, u) => acc + (u.valor_proposta ?? u.valor_tabela ?? 0), 0);
      
      const desconto_valor = valor_tabela - valor_proposta;
      const desconto_percentual = valor_tabela > 0 ? (desconto_valor / valor_tabela) * 100 : 0;
      
      // Criar proposta
      const { data: proposta, error: propostaError } = await propostasTable()
        .insert({
          cliente_id: data.cliente_id,
          empreendimento_id: data.empreendimento_id,
          corretor_id: data.corretor_id,
          imobiliaria_id: data.imobiliaria_id,
          gestor_id: data.gestor_id ?? user?.id,
          valor_tabela,
          valor_proposta,
          desconto_percentual,
          desconto_valor,
          data_validade: data.data_validade,
          observacoes: data.observacoes,
          simulacao_dados: data.simulacao_dados,
          status: 'rascunho',
          created_by: user?.id,
        } as any)
        .select()
        .single();
      
      if (propostaError) throw propostaError;
      
      const propostaId = (proposta as any).id;
      
      // Inserir unidades
      if (data.unidades.length > 0) {
        const unidadesData = data.unidades.map(u => ({
          proposta_id: propostaId,
          unidade_id: u.unidade_id,
          valor_tabela: u.valor_tabela,
          valor_proposta: u.valor_proposta ?? u.valor_tabela,
        }));
        
        const { error: unidadesError } = await propostaUnidadesTable()
          .insert(unidadesData as any);
        
        if (unidadesError) throw unidadesError;
      }
      
      // Inserir condições de pagamento
      if (data.condicoes_pagamento && data.condicoes_pagamento.length > 0) {
        const condicoesData = data.condicoes_pagamento.map(c => ({
          proposta_id: propostaId,
          ...c,
        }));
        
        const { error: condicoesError } = await propostaCondicoesTable()
          .insert(condicoesData as any);
        
        if (condicoesError) throw condicoesError;
      }
      
      return proposta as unknown as Proposta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro detalhado ao criar proposta:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      const errorMessage = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao criar proposta: ${errorMessage}`);
    },
  });
};

// Atualizar proposta
export const useUpdateProposta = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PropostaFormData> }) => {
      const { error } = await propostasTable()
        .update({
          ...data,
          updated_by: user?.id,
        } as any)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      queryClient.invalidateQueries({ queryKey: ['proposta', id] });
      toast.success('Proposta atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar proposta:', error);
      toast.error('Erro ao atualizar proposta');
    },
  });
};

// Enviar proposta (muda status para 'enviada')
export const useEnviarProposta = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (propostaId: string) => {
      const { error } = await propostasTable()
        .update({
          status: 'enviada',
          updated_by: user?.id,
        } as any)
        .eq('id', propostaId);
      
      if (error) throw error;
    },
    onSuccess: (_, propostaId) => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      queryClient.invalidateQueries({ queryKey: ['proposta', propostaId] });
      toast.success('Proposta enviada!');
    },
    onError: (error) => {
      console.error('Erro ao enviar proposta:', error);
      toast.error('Erro ao enviar proposta');
    },
  });
};

// Aceitar proposta
export const useAceitarPropostaNew = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (propostaId: string) => {
      const { error } = await propostasTable()
        .update({
          status: 'aceita',
          data_aceite: new Date().toISOString().split('T')[0],
          updated_by: user?.id,
        } as any)
        .eq('id', propostaId);
      
      if (error) throw error;
    },
    onSuccess: (_, propostaId) => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      queryClient.invalidateQueries({ queryKey: ['proposta', propostaId] });
      toast.success('Proposta aceita!');
    },
    onError: (error) => {
      console.error('Erro ao aceitar proposta:', error);
      toast.error('Erro ao aceitar proposta');
    },
  });
};

// Recusar proposta
export const useRecusarPropostaNew = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ propostaId, motivo }: { propostaId: string; motivo: string }) => {
      const { error } = await propostasTable()
        .update({
          status: 'recusada',
          motivo_recusa: motivo,
          updated_by: user?.id,
        } as any)
        .eq('id', propostaId);
      
      if (error) throw error;
    },
    onSuccess: (_, { propostaId }) => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      queryClient.invalidateQueries({ queryKey: ['proposta', propostaId] });
      toast.success('Proposta recusada');
    },
    onError: (error) => {
      console.error('Erro ao recusar proposta:', error);
      toast.error('Erro ao recusar proposta');
    },
  });
};

// Converter proposta em negociação
export const useConverterPropostaEmNegociacao = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ propostaId, etapaInicialId }: { propostaId: string; etapaInicialId?: string }) => {
      // Buscar dados da proposta
      const { data: proposta, error: propostaError } = await propostasTable()
        .select(`
          *,
          unidades:proposta_unidades(unidade_id, valor_proposta),
          condicoes:proposta_condicoes_pagamento(*)
        `)
        .eq('id', propostaId)
        .single();
      
      if (propostaError) throw propostaError;
      
      const propostaData = proposta as any;
      
      // Buscar primeira etapa do funil se não informada
      let etapaId = etapaInicialId;
      if (!etapaId) {
        const { data: etapas } = await supabase
          .from('funil_etapas')
          .select('id')
          .eq('is_active', true)
          .order('ordem')
          .limit(1);
        
        etapaId = etapas?.[0]?.id;
      }
      
      // Criar negociação
      const negociacaoData = {
        cliente_id: propostaData.cliente_id,
        empreendimento_id: propostaData.empreendimento_id,
        corretor_id: propostaData.corretor_id,
        imobiliaria_id: propostaData.imobiliaria_id,
        gestor_id: propostaData.gestor_id ?? user?.id,
        funil_etapa_id: etapaId,
        valor_tabela: propostaData.valor_tabela,
        valor_proposta: propostaData.valor_proposta,
        desconto_percentual: propostaData.desconto_percentual,
        desconto_valor: propostaData.desconto_valor,
        proposta_origem_id: propostaId,
        observacoes: propostaData.observacoes,
        status_proposta: 'aceita', // Negociação criada a partir de proposta aceita
        data_aceite: propostaData.data_aceite,
        created_by: user?.id,
      };
      
      const { data: negociacao, error: negociacaoError } = await supabase
        .from('negociacoes')
        .insert([negociacaoData] as any)
        .select()
        .single();
      
      if (negociacaoError) throw negociacaoError;
      
      // Copiar unidades para negociação
      if (propostaData.unidades && propostaData.unidades.length > 0) {
        const unidadesNegociacao = propostaData.unidades.map((u: any) => ({
          negociacao_id: negociacao.id,
          unidade_id: u.unidade_id,
          valor_proposta: u.valor_proposta,
        }));
        
        await supabase
          .from('negociacao_unidades')
          .insert(unidadesNegociacao);
      }
      
      // Copiar condições de pagamento para negociação
      if (propostaData.condicoes && propostaData.condicoes.length > 0) {
        const condicoesNegociacao = propostaData.condicoes.map((c: any) => ({
          negociacao_id: negociacao.id,
          tipo_parcela_codigo: c.tipo_parcela_codigo,
          quantidade: c.quantidade,
          valor: c.valor,
          valor_tipo: c.valor_tipo,
          intervalo_dias: c.intervalo_dias,
          com_correcao: c.com_correcao,
          indice_correcao: c.indice_correcao,
          forma_pagamento: c.forma_pagamento,
          descricao: c.descricao,
          ordem: c.ordem,
        }));
        
        await supabase
          .from('negociacao_condicoes_pagamento')
          .insert(condicoesNegociacao);
      }
      
      // Atualizar status da proposta para convertida
      await propostasTable()
        .update({
          status: 'convertida',
          updated_by: user?.id,
        } as any)
        .eq('id', propostaId);
      
      return negociacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      toast.success('Proposta convertida em negociação!');
    },
    onError: (error) => {
      console.error('Erro ao converter proposta:', error);
      toast.error('Erro ao converter proposta em negociação');
    },
  });
};

// Deletar proposta (soft delete)
export const useDeleteProposta = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await propostasTable()
        .update({ is_active: false } as any)
        .eq('id', id);
      
      if (error) {
        console.error('Erro Supabase ao remover proposta:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta removida');
    },
    onError: (error: any) => {
      console.error('Erro completo ao remover proposta:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      const errorCode = error?.code ? ` (${error.code})` : '';
      toast.error(`Erro ao remover proposta: ${errorMessage}${errorCode}`);
    },
  });
};
