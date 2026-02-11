import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Negociacao } from '@/types/negociacoes.types';
import { toast } from 'sonner';

// Type assertion helper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface SolicitacaoFilters {
  empreendimento_id?: string;
  corretor_id?: string;
  status_aprovacao?: 'pendente' | 'aprovada' | 'rejeitada';
}

export interface ConflitosUnidade {
  unidade_id: string;
  unidade_codigo: string;
  negociacoes_concorrentes: {
    id: string;
    codigo: string;
    corretor_nome?: string;
    solicitada_em?: string;
  }[];
}

// Fetch all pending solicitações for gestores
export interface SolicitacaoComPosicao extends Negociacao {
  posicao_fila: number;
}

export function useSolicitacoesPendentes(filters?: SolicitacaoFilters) {
  return useQuery({
    queryKey: ['solicitacoes-pendentes', filters],
    queryFn: async () => {
      let query = db
        .from('negociacoes')
        .select(`
          *,
          cliente:clientes(id, nome, email, telefone),
          empreendimento:empreendimentos(id, nome),
          corretor:corretores(id, nome_completo, email, telefone),
          imobiliaria:imobiliarias(id, nome),
          funil_etapa:funil_etapas(id, nome, cor),
          unidades:negociacao_unidades(
            id,
            unidade_id,
            valor_tabela,
            valor_proposta,
            unidade:unidades(id, codigo, numero, valor, status, bloco:blocos(nome))
          )
        `)
        .eq('is_active', true)
        .eq('status_aprovacao', 'pendente')
        .order('solicitada_em', { ascending: true });

      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }

      if (filters?.corretor_id) {
        query = query.eq('corretor_id', filters.corretor_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Adicionar posição na fila (por ordem de entrada global)
      const solicitacoesComPosicao: SolicitacaoComPosicao[] = (data || []).map(
        (sol: Negociacao, index: number) => ({
          ...sol,
          posicao_fila: index + 1
        })
      );
      
      return solicitacoesComPosicao;
    }
  });
}

// Detect conflicts for a specific negociação
export function useDetectarConflitos(negociacaoId: string | undefined) {
  return useQuery({
    queryKey: ['conflitos-negociacao', negociacaoId],
    queryFn: async () => {
      if (!negociacaoId) return [];

      // Get unidades of this negociação
      const { data: unidadesNeg, error: unidadesError } = await db
        .from('negociacao_unidades')
        .select('unidade_id, unidade:unidades(id, codigo, numero)')
        .eq('negociacao_id', negociacaoId);

      if (unidadesError) throw unidadesError;
      if (!unidadesNeg || unidadesNeg.length === 0) return [];

      const unidadeIds = unidadesNeg.map((u: { unidade_id: string }) => u.unidade_id);

      // Find other pending negociações with same unidades
      const { data: conflitantes, error: conflitosError } = await db
        .from('negociacao_unidades')
        .select(`
          unidade_id,
          negociacao:negociacoes(
            id, 
            codigo, 
            solicitada_em, 
            status_aprovacao,
            corretor:corretores(nome_completo)
          )
        `)
        .in('unidade_id', unidadeIds)
        .neq('negociacao_id', negociacaoId);

      if (conflitosError) throw conflitosError;

      // Group by unidade_id
      const conflitos: ConflitosUnidade[] = [];
      
      unidadesNeg.forEach((un: { unidade_id: string; unidade: { codigo: string } }) => {
        const concorrentes = (conflitantes || [])
          .filter((c: { unidade_id: string; negociacao: { status_aprovacao: string } }) => 
            c.unidade_id === un.unidade_id && 
            c.negociacao?.status_aprovacao === 'pendente'
          )
          .map((c: { negociacao: { id: string; codigo: string; corretor: { nome_completo: string }; solicitada_em: string } }) => ({
            id: c.negociacao.id,
            codigo: c.negociacao.codigo,
            corretor_nome: c.negociacao.corretor?.nome_completo,
            solicitada_em: c.negociacao.solicitada_em
          }));

        if (concorrentes.length > 0) {
          conflitos.push({
            unidade_id: un.unidade_id,
            unidade_codigo: un.unidade?.codigo || '',
            negociacoes_concorrentes: concorrentes
          });
        }
      });

      return conflitos;
    },
    enabled: !!negociacaoId
  });
}

// Aprovar solicitação via RPC
export function useAprovarSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ negociacaoId, gestorId }: { negociacaoId: string; gestorId: string }) => {
      const { data, error } = await db.rpc('aprovar_solicitacao_negociacao', {
        p_negociacao_id: negociacaoId,
        p_gestor_id: gestorId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; conflitantes_rejeitadas?: number; unidades_reservadas?: number };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao aprovar solicitação');
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      
      let message = 'Solicitação aprovada com sucesso!';
      if (result.conflitantes_rejeitadas && result.conflitantes_rejeitadas > 0) {
        message += ` ${result.conflitantes_rejeitadas} solicitação(ões) conflitante(s) rejeitada(s) automaticamente.`;
      }
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error('Erro ao aprovar: ' + error.message);
    }
  });
}

// Rejeitar solicitação via RPC
export function useRejeitarSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      negociacaoId, 
      motivo, 
      gestorId 
    }: { 
      negociacaoId: string; 
      motivo: string; 
      gestorId: string 
    }) => {
      const { data, error } = await db.rpc('rejeitar_solicitacao_negociacao', {
        p_negociacao_id: negociacaoId,
        p_motivo: motivo,
        p_gestor_id: gestorId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      toast.success('Solicitação rejeitada');
    },
    onError: (error: Error) => {
      toast.error('Erro ao rejeitar: ' + error.message);
    }
  });
}

// Remover item de solicitação pendente
export function useRemoverItemSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      negociacaoId, 
      unidadeId 
    }: { 
      negociacaoId: string; 
      unidadeId: string 
    }) => {
      const { error } = await db
        .from('negociacao_unidades')
        .delete()
        .eq('negociacao_id', negociacaoId)
        .eq('unidade_id', unidadeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      toast.success('Item removido da solicitação');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover item: ' + error.message);
    }
  });
}

// Criar solicitação de reserva (usado pelo corretor no mapa)
export function useCriarSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      empreendimentoId,
      clienteId,
      clienteNome,
      clienteEmail,
      clienteTelefone,
      corretorId,
      imobiliariaId,
      unidadeIds,
      funilEtapaId,
      observacoes
    }: {
      empreendimentoId: string;
      clienteId?: string;
      clienteNome?: string;
      clienteEmail?: string;
      clienteTelefone?: string;
      corretorId?: string;
      imobiliariaId?: string;
      unidadeIds: string[];
      funilEtapaId: string;
      observacoes?: string;
    }) => {
      let finalClienteId = clienteId;

      // Create cliente if not exists
      if (!clienteId && clienteNome) {
        const { data: novoCliente, error: clienteError } = await db
          .from('clientes')
          .insert({
            nome: clienteNome,
            email: clienteEmail || null,
            telefone: clienteTelefone || null,
            corretor_id: corretorId || null,
            imobiliaria_id: imobiliariaId || null
          })
          .select()
          .single();

        if (clienteError) {
          console.error('Erro ao criar cliente:', clienteError);
          throw new Error(`Erro ao cadastrar cliente: ${clienteError.message}`);
        }
        finalClienteId = novoCliente.id;
      }

      if (!finalClienteId) {
        throw new Error('Cliente é obrigatório');
      }

      // Get max ordem_kanban
      const { data: maxOrdem } = await db
        .from('negociacoes')
        .select('ordem_kanban')
        .eq('funil_etapa_id', funilEtapaId)
        .order('ordem_kanban', { ascending: false })
        .limit(1)
        .maybeSingle();

      const novaOrdem = (maxOrdem?.ordem_kanban || 0) + 1;

      // Calculate total value
      const { data: unidadesData } = await supabase
        .from('unidades')
        .select('id, valor')
        .in('id', unidadeIds);

      const valorTotal = unidadesData?.reduce((sum, u) => sum + (u.valor || 0), 0) || 0;

      // Create negociação with status_aprovacao = 'pendente'
      const { data: negociacao, error: negError } = await db
        .from('negociacoes')
        .insert({
          empreendimento_id: empreendimentoId,
          funil_etapa_id: funilEtapaId,
          cliente_id: finalClienteId,
          corretor_id: corretorId,
          imobiliaria_id: imobiliariaId,
          valor_negociacao: valorTotal,
          observacoes,
          ordem_kanban: novaOrdem,
          status_aprovacao: 'pendente',
          solicitada_em: new Date().toISOString()
        })
        .select()
        .single();

      if (negError) throw negError;

      // Add unidades (NÃO reservar ainda - só na aprovação)
      for (const unidadeId of unidadeIds) {
        const unidadeInfo = unidadesData?.find(u => u.id === unidadeId);
        await db
          .from('negociacao_unidades')
          .insert({ 
            negociacao_id: negociacao.id, 
            unidade_id: unidadeId,
            valor_tabela: unidadeInfo?.valor
          });
      }

      // Add initial history
      await db
        .from('negociacao_historico')
        .insert({
          negociacao_id: negociacao.id,
          funil_etapa_nova_id: funilEtapaId,
          observacao: 'Solicitação de reserva enviada'
        });

      return negociacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Solicitação de reserva enviada! Aguarde aprovação.');
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar solicitação: ' + error.message);
    }
  });
}
