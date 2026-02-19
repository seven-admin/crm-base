import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invalidateDashboards } from '@/lib/invalidateDashboards';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Nome em UPPERCASE exato como o trigger uppercase_clientes() armazena no banco
const CLIENTE_HISTORICO_NOME = 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)';

export interface VendaHistoricaData {
  unidade_ids: string[];
  empreendimento_id: string;
  data_venda: string;
  valor_total: number;
  corretor_id?: string;
  imobiliaria_id?: string;
}

interface VendaHistoricaResult {
  cliente_id: string;
  negociacao_id: string;
  contrato_id: string;
  unidades_atualizadas: number;
}

async function getOrCreateClienteHistorico(empreendimentoId: string): Promise<string> {
  // Buscar cliente histórico existente (ilike: case-insensitive, à prova do trigger uppercase)
  const { data: clienteExistente } = await supabase
    .from('clientes')
    .select('id')
    .ilike('nome', CLIENTE_HISTORICO_NOME)
    .maybeSingle();

  if (clienteExistente) {
    return clienteExistente.id;
  }

  // Criar novo cliente histórico (global — sem empreendimento_id para ser reutilizável)
  const { data: novoCliente, error } = await supabase
    .from('clientes')
    .insert({
      nome: CLIENTE_HISTORICO_NOME,
      fase: 'comprador',
      observacoes: 'Cliente genérico para vendas anteriores à implantação do sistema. Não representa um comprador real específico.',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Erro ao criar cliente histórico: ${error.message}`);
  return novoCliente.id;
}

async function gerarCodigoNegociacao(): Promise<string> {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `NEG-HIST-${timestamp}`;
}

async function gerarNumeroContrato(): Promise<string> {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `CONT-HIST-${timestamp}`;
}

async function buscarEtapaFinalSucesso(empreendimentoId: string): Promise<string | null> {
  // Buscar funil do empreendimento
  const { data: funil } = await db
    .from('funis')
    .select('id')
    .eq('empreendimento_id', empreendimentoId)
    .eq('is_active', true)
    .maybeSingle();

  if (!funil) {
    // Tentar funil padrão (sem empreendimento)
    const { data: funilPadrao } = await db
      .from('funis')
      .select('id')
      .is('empreendimento_id', null)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!funilPadrao) return null;
    
    const { data: etapa } = await db
      .from('funil_etapas')
      .select('id')
      .eq('funil_id', funilPadrao.id)
      .eq('is_final_sucesso', true)
      .maybeSingle();
    
    return etapa?.id || null;
  }

  // Buscar etapa final de sucesso do funil
  const { data: etapa } = await db
    .from('funil_etapas')
    .select('id')
    .eq('funil_id', funil.id)
    .eq('is_final_sucesso', true)
    .maybeSingle();

  return etapa?.id || null;
}

export function useVendaHistorica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VendaHistoricaData): Promise<VendaHistoricaResult> => {
      const {
        unidade_ids,
        empreendimento_id,
        data_venda,
        valor_total,
        corretor_id,
        imobiliaria_id,
      } = data;

      // 1. Buscar ou criar cliente histórico
      const cliente_id = await getOrCreateClienteHistorico(empreendimento_id);

      // 2. Buscar etapa final de sucesso do funil
      const funil_etapa_id = await buscarEtapaFinalSucesso(empreendimento_id);

      // 3. Gerar código da negociação
      const codigo = await gerarCodigoNegociacao();

      // 4. Criar negociação
      const { data: negociacao, error: negError } = await db
        .from('negociacoes')
        .insert({
          codigo,
          cliente_id,
          empreendimento_id,
          corretor_id: corretor_id || null,
          imobiliaria_id: imobiliaria_id || null,
          funil_etapa_id,
          status_proposta: 'convertida',
          valor_negociacao: valor_total,
          data_fechamento: data_venda,
          observacoes: `Venda histórica registrada em ${new Date().toLocaleDateString('pt-BR')}. Esta negociação foi criada automaticamente para registrar uma venda anterior à implantação do sistema.`,
        })
        .select('id')
        .single();

      if (negError) throw new Error(`Erro ao criar negociação: ${negError.message}`);

      // 5. Vincular unidades à negociação (buscar valores de tabela)
      const { data: unidadesData } = await supabase
        .from('unidades')
        .select('id, valor')
        .in('id', unidade_ids);

      const valorPorUnidade = valor_total / unidade_ids.length;
      
      const negociacaoUnidades = unidade_ids.map((unidade_id) => {
        const unidadeInfo = unidadesData?.find(u => u.id === unidade_id);
        return {
          negociacao_id: negociacao.id,
          unidade_id,
          valor_tabela: unidadeInfo?.valor || valorPorUnidade,
          valor_unidade: valorPorUnidade,
          valor_proposta: valorPorUnidade,
        };
      });

      const { error: negUnidError } = await db
        .from('negociacao_unidades')
        .insert(negociacaoUnidades);

      if (negUnidError) throw new Error(`Erro ao vincular unidades à negociação: ${negUnidError.message}`);

      // 6. Gerar número do contrato
      const numero = await gerarNumeroContrato();

      // 7. Criar contrato
      const { data: contrato, error: contError } = await supabase
        .from('contratos')
        .insert({
          numero,
          cliente_id,
          empreendimento_id,
          corretor_id: corretor_id || null,
          imobiliaria_id: imobiliaria_id || null,
          negociacao_id: negociacao.id,
          status: 'assinado',
          valor_contrato: valor_total,
          data_assinatura: data_venda,
          data_geracao: data_venda,
          observacoes: `Contrato histórico - Venda anterior à implantação do sistema. Registrado automaticamente em ${new Date().toLocaleDateString('pt-BR')}.`,
        })
        .select('id')
        .single();

      if (contError) throw new Error(`Erro ao criar contrato: ${contError.message}`);

      // 8. Vincular unidades ao contrato
      const contratoUnidades = unidade_ids.map((unidade_id) => ({
        contrato_id: contrato.id,
        unidade_id,
        valor_unidade: valorPorUnidade,
      }));

      const { error: contUnidError } = await supabase
        .from('contrato_unidades')
        .insert(contratoUnidades);

      if (contUnidError) throw new Error(`Erro ao vincular unidades ao contrato: ${contUnidError.message}`);

      // 9. Atualizar negociação com contrato_id
      await db
        .from('negociacoes')
        .update({ contrato_id: contrato.id })
        .eq('id', negociacao.id);

      // 10. Atualizar status das unidades para 'vendida'
      const { error: unidError } = await supabase
        .from('unidades')
        .update({ status: 'vendida' })
        .in('id', unidade_ids);

      if (unidError) throw new Error(`Erro ao atualizar status das unidades: ${unidError.message}`);

      return {
        cliente_id,
        negociacao_id: negociacao.id,
        contrato_id: contrato.id,
        unidades_atualizadas: unidade_ids.length,
      };
    },
    onSuccess: (result) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contratos-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento'] });
      invalidateDashboards(queryClient);
      
      toast.success(
        `Venda histórica registrada! ${result.unidades_atualizadas} unidade(s) marcada(s) como vendida(s).`
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar venda histórica: ${error.message}`);
    },
  });
}
