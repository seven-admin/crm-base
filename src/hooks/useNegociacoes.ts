import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Negociacao, 
  NegociacaoFormData, 
  MoverNegociacaoData,
  GerarPropostaData,
  RecusarPropostaData,
  NegociacaoFilters,
  StatusProposta
} from '@/types/negociacoes.types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { invalidateDashboards } from '@/lib/invalidateDashboards';

// Type assertion helper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useNegociacoes(filters?: NegociacaoFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['negociacoes', filters],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      let query = db
        .from('negociacoes')
        .select(`
          *,
          cliente:clientes(id, nome, email, telefone),
          empreendimento:empreendimentos(id, nome),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          gestor:profiles!gestor_id(id, full_name),
          funil_etapa:funil_etapas(id, nome, cor, cor_bg, is_inicial, is_final_sucesso, is_final_perda, ordem),
          unidades:negociacao_unidades(
            id,
            unidade_id,
            valor_unidade,
            valor_tabela,
            valor_proposta,
            unidade:unidades(id, numero, valor, bloco:blocos(nome))
          )
        `)
        .eq('is_active', true)
        .order('ordem_kanban', { ascending: true });

      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }

      if (filters?.corretor_id) {
        query = query.eq('corretor_id', filters.corretor_id);
      }

      if (filters?.funil_etapa_id) {
        query = query.eq('funil_etapa_id', filters.funil_etapa_id);
      }

      if (filters?.status_proposta) {
        query = query.eq('status_proposta', filters.status_proposta);
      }

      if (filters?.com_proposta === true) {
        query = query.not('numero_proposta', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Negociacao[];
    }
  });
}

// Versão leve para Kanban/listagem (reduz joins/payload e melhora TTFB)
export function useNegociacoesKanban(filters?: NegociacaoFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['negociacoes-kanban', filters],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      let query = db
        .from('negociacoes')
        .select(`
          id,
          codigo,
          valor_negociacao,
          valor_proposta,
          numero_proposta,
          status_proposta,
          funil_etapa_id,
          gestor_id,
          ordem_kanban,
          cliente:clientes(id, nome),
          empreendimento:empreendimentos(id, nome),
          gestor:profiles!gestor_id(id, full_name),
          unidades:negociacao_unidades(id)
        `)
        .eq('is_active', true)
        .order('ordem_kanban', { ascending: true });

      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }

      if (filters?.corretor_id) {
        query = query.eq('corretor_id', filters.corretor_id);
      }

      if (filters?.funil_etapa_id) {
        query = query.eq('funil_etapa_id', filters.funil_etapa_id);
      }

      if (filters?.status_proposta) {
        query = query.eq('status_proposta', filters.status_proposta);
      }

      if (filters?.com_proposta === true) {
        query = query.not('numero_proposta', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Negociacao[];
    },
    staleTime: 1000 * 30,
  });
}

export function useNegociacao(id: string | undefined) {
  return useQuery({
    queryKey: ['negociacao', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await db
        .from('negociacoes')
        .select(`
          *,
          cliente:clientes(*),
          empreendimento:empreendimentos(id, nome),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          funil_etapa:funil_etapas(id, nome, cor, cor_bg, is_inicial, is_final_sucesso, is_final_perda, ordem),
          unidades:negociacao_unidades(
            id,
            unidade_id,
            valor_unidade,
            valor_tabela,
            valor_proposta,
            unidade:unidades(id, numero, valor, bloco:blocos(nome))
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Negociacao | null;
    },
    enabled: !!id
  });
}

export function useNegociacoesPorEtapa(filters?: Omit<NegociacaoFilters, 'funil_etapa_id'>) {
  const { data: negociacoes = [], ...rest } = useNegociacoes(filters);

  const porEtapa = negociacoes.reduce((acc, neg) => {
    const etapaId = neg.funil_etapa_id || 'sem_etapa';
    if (!acc[etapaId]) {
      acc[etapaId] = [];
    }
    acc[etapaId].push(neg);
    return acc;
  }, {} as Record<string, Negociacao[]>);

  return { data: porEtapa, negociacoes, ...rest };
}

// ====================================================
// Hooks de Proposta (integrados à Negociação)
// ====================================================

export function useNegociacoesComProposta(filters?: Omit<NegociacaoFilters, 'com_proposta'>) {
  return useNegociacoes({ ...filters, com_proposta: true });
}

export function useNegociacoesPropostaVencendo(dias: number = 7) {
  return useQuery({
    queryKey: ['negociacoes-proposta-vencendo', dias],
    queryFn: async () => {
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + dias);

      const { data, error } = await db
        .from('negociacoes')
        .select(`
          *,
          cliente:clientes(id, nome, email, telefone),
          empreendimento:empreendimentos(id, nome),
          corretor:corretores(id, nome_completo)
        `)
        .eq('is_active', true)
        .eq('status_proposta', 'enviada')
        .lte('data_validade_proposta', dataLimite.toISOString().split('T')[0])
        .gte('data_validade_proposta', hoje.toISOString().split('T')[0])
        .order('data_validade_proposta', { ascending: true });

      if (error) throw error;
      return (data || []) as Negociacao[];
    }
  });
}

export function useGerarProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GerarPropostaData }) => {
      // Get next proposal number
      const { data: numeroData, error: seqError } = await db.rpc('generate_negociacao_proposta_numero');
      
      if (seqError) throw seqError;

      const updateData = {
        numero_proposta: numeroData,
        status_proposta: 'rascunho' as StatusProposta,
        data_emissao_proposta: new Date().toISOString().split('T')[0],
        data_validade_proposta: data.data_validade,
        valor_tabela: data.valor_tabela,
        valor_proposta: data.valor_proposta,
        desconto_percentual: data.desconto_percentual,
        desconto_valor: data.desconto_valor,
        condicao_pagamento: data.condicao_pagamento,
        simulacao_dados: data.simulacao_dados,
        data_proposta_gerada: new Date().toISOString()
      };

      const { error } = await db
        .from('negociacoes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      return { id, numero_proposta: numeroData };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['negociacao', result.id] });
      invalidateDashboards(queryClient);
      toast.success(`Proposta ${result.numero_proposta} gerada com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao gerar proposta: ' + error.message);
    }
  });
}

export function useEnviarProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('negociacoes')
        .update({ status_proposta: 'enviada' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      invalidateDashboards(queryClient);
      toast.success('Proposta enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar proposta: ' + error.message);
    }
  });
}

export function useAceitarProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('negociacoes')
        .update({ 
          status_proposta: 'aceita',
          data_aceite: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      invalidateDashboards(queryClient);
      toast.success('Proposta aceita!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao aceitar proposta: ' + error.message);
    }
  });
}

export function useRecusarProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RecusarPropostaData }) => {
      const { error } = await db
        .from('negociacoes')
        .update({ 
          status_proposta: 'recusada',
          motivo_recusa: data.motivo_recusa
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      invalidateDashboards(queryClient);
      toast.success('Proposta recusada');
    },
    onError: (error: Error) => {
      toast.error('Erro ao recusar proposta: ' + error.message);
    }
  });
}

export function useConverterPropostaEmContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch complete negotiation data
      const { data: negociacao, error: fetchError } = await db
        .from('negociacoes')
        .select(`
          *,
          cliente:clientes(id, nome, cpf, rg, email, telefone),
          empreendimento:empreendimentos(id, nome),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          unidades:negociacao_unidades(unidade_id, valor_unidade, valor_proposta)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!negociacao) throw new Error('Negociação não encontrada');

      // 2. Fetch negotiation payment conditions (from proposal)
      const { data: negociacaoCondicoes } = await db
        .from('negociacao_condicoes_pagamento')
        .select('*')
        .eq('negociacao_id', id)
        .eq('is_active', true)
        .order('ordem');

      // 3. Find default template for the empreendimento
      let templateId: string | null = null;
      let conteudoHtml: string | null = null;

      // Try: template linked to empreendimento first
      const { data: templateEmp } = await supabase
        .from('contrato_templates')
        .select('id, conteudo_html')
        .eq('empreendimento_id', negociacao.empreendimento_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (templateEmp && templateEmp.length > 0) {
        templateId = templateEmp[0].id;
        conteudoHtml = templateEmp[0].conteudo_html;
      } else {
        // Fallback: global template (no empreendimento_id)
        const { data: templateGlobal } = await supabase
          .from('contrato_templates')
          .select('id, conteudo_html')
          .is('empreendimento_id', null)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (templateGlobal && templateGlobal.length > 0) {
          templateId = templateGlobal[0].id;
          conteudoHtml = templateGlobal[0].conteudo_html;
        }
      }

      // 4. Create contrato with inherited data
      const { data: contrato, error: contratoError } = await supabase
        .from('contratos')
        .insert({
          numero: 'TEMP', // Will be replaced by trigger
          cliente_id: negociacao.cliente_id,
          empreendimento_id: negociacao.empreendimento_id,
          corretor_id: negociacao.corretor_id ?? null,
          imobiliaria_id: negociacao.imobiliaria_id ?? null,
          valor_contrato: negociacao.valor_proposta ?? negociacao.valor_negociacao ?? null,
          negociacao_id: negociacao.id,
          modalidade_id: negociacao.modalidade_id ?? null,
          observacoes: negociacao.observacoes ?? null,
          template_id: templateId,
          conteudo_html: conteudoHtml,
        })
        .select()
        .single();

      if (contratoError) throw contratoError;

      // 5. Copy units from negotiation to contract
      if (negociacao.unidades && negociacao.unidades.length > 0) {
        const unidadesData = negociacao.unidades.map((u: { unidade_id: string; valor_unidade?: number; valor_proposta?: number }) => ({
          contrato_id: contrato.id,
          unidade_id: u.unidade_id,
          valor_unidade: u.valor_proposta ?? u.valor_unidade ?? null,
        }));

        await supabase.from('contrato_unidades').insert(unidadesData);

        // Update units status to "vendida"
        await supabase
          .from('unidades')
          .update({ status: 'vendida' })
          .in('id', negociacao.unidades.map((u: { unidade_id: string }) => u.unidade_id));
      }

      // 6. Copy payment conditions from negotiation to contract (PRIORITY)
      if (negociacaoCondicoes && negociacaoCondicoes.length > 0) {
        // Use conditions configured in the proposal
        const condicoesData = negociacaoCondicoes.map((nc: { 
          tipo_parcela_codigo: string; 
          quantidade: number; 
          valor: number; 
          valor_tipo: string;
          intervalo_dias: number; 
          com_correcao: boolean; 
          indice_correcao: string;
          parcelas_sem_correcao: number;
          forma_pagamento: string;
          forma_quitacao: string;
          descricao?: string;
          observacao_texto?: string;
          data_vencimento?: string;
          evento_vencimento?: string;
          ordem: number;
        }) => ({
          contrato_id: contrato.id,
          tipo_parcela_codigo: nc.tipo_parcela_codigo,
          quantidade: nc.quantidade,
          valor: nc.valor,
          valor_tipo: nc.valor_tipo,
          intervalo_dias: nc.intervalo_dias,
          com_correcao: nc.com_correcao,
          indice_correcao: nc.indice_correcao,
          parcelas_sem_correcao: nc.parcelas_sem_correcao,
          forma_pagamento: nc.forma_pagamento,
          forma_quitacao: nc.forma_quitacao,
          descricao: nc.descricao,
          observacao_texto: nc.observacao_texto,
          data_vencimento: nc.data_vencimento,
          evento_vencimento: nc.evento_vencimento,
          ordem: nc.ordem,
        }));

        await supabase.from('contrato_condicoes_pagamento').insert(condicoesData);
      } else if (negociacao.modalidade_id) {
        // Fallback: Copy modality conditions if no proposal conditions exist
        const { data: componentes } = await db
          .from('modalidade_componentes')
          .select('*')
          .eq('modalidade_id', negociacao.modalidade_id)
          .order('ordem');

        if (componentes && componentes.length > 0) {
          const valorContrato = negociacao.valor_proposta ?? negociacao.valor_negociacao ?? 0;
          const condicoesData = componentes.map((comp: { tipo_parcela_codigo: string; quantidade: number; valor_percentual: number; intervalo_dias: number; com_correcao: boolean; indice_correcao?: string }, index: number) => ({
            contrato_id: contrato.id,
            tipo_parcela_codigo: comp.tipo_parcela_codigo,
            quantidade: comp.quantidade,
            valor: valorContrato * (comp.valor_percentual / 100),
            valor_tipo: 'percentual',
            intervalo_dias: comp.intervalo_dias,
            com_correcao: comp.com_correcao,
            indice_correcao: comp.indice_correcao,
            ordem: index + 1,
          }));

          await supabase.from('contrato_condicoes_pagamento').insert(condicoesData);
        }
      }

      // 7. Update negotiation with conversion data
      const { error: updateError } = await db
        .from('negociacoes')
        .update({ 
          status_proposta: 'convertida',
          data_conversao: new Date().toISOString().split('T')[0],
          contrato_id: contrato.id,
          data_contrato_gerado: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return { negociacao_id: id, contrato_id: contrato.id, numero_contrato: contrato.numero };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contratos-paginated'] });
      invalidateDashboards(queryClient);
      toast.success(`Contrato gerado com sucesso!`);
      return result;
    },
    onError: (error: Error) => {
      toast.error('Erro ao gerar contrato: ' + error.message);
    }
  });
}

export function useExcluirProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('negociacoes')
        .update({ 
          numero_proposta: null,
          status_proposta: null,
          data_emissao_proposta: null,
          data_validade_proposta: null,
          valor_proposta: null,
          desconto_percentual: null,
          desconto_valor: null,
          condicao_pagamento: null,
          simulacao_dados: null,
          motivo_recusa: null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      invalidateDashboards(queryClient);
      toast.success('Proposta excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir proposta: ' + error.message);
    }
  });
}

// ====================================================
// Hooks de Negociação (existentes)
// ====================================================

export function useCreateNegociacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: NegociacaoFormData) => {
      const { cliente_id, cliente_nome, cliente_email, cliente_telefone, unidade_ids, funil_etapa_id, condicoes_pagamento, ...negociacaoData } = formData;

      let finalClienteId = cliente_id;

      // Create cliente if not exists
      if (!cliente_id && cliente_nome) {
        const { data: novoCliente, error: clienteError } = await db
          .from('clientes')
          .insert({
            nome: cliente_nome,
            email: cliente_email,
            telefone: cliente_telefone,
            corretor_id: formData.corretor_id
          })
          .select()
          .single();

        if (clienteError) throw clienteError;
        finalClienteId = novoCliente.id;
      }

      if (!finalClienteId) {
        throw new Error('Cliente é obrigatório');
      }

      // Get max ordem_kanban for the etapa
      const { data: maxOrdem } = await db
        .from('negociacoes')
        .select('ordem_kanban')
        .eq('funil_etapa_id', funil_etapa_id)
        .order('ordem_kanban', { ascending: false })
        .limit(1)
        .maybeSingle();

      const novaOrdem = (maxOrdem?.ordem_kanban || 0) + 1;

      // Create negociacao
      const { data: negociacao, error: negError } = await db
        .from('negociacoes')
        .insert({
          empreendimento_id: negociacaoData.empreendimento_id,
          funil_etapa_id: funil_etapa_id,
          cliente_id: finalClienteId,
          corretor_id: negociacaoData.corretor_id,
          imobiliaria_id: negociacaoData.imobiliaria_id,
          valor_negociacao: negociacaoData.valor_negociacao,
          valor_entrada: negociacaoData.valor_entrada,
          condicao_pagamento: negociacaoData.condicao_pagamento,
          observacoes: negociacaoData.observacoes,
          data_previsao_fechamento: negociacaoData.data_previsao_fechamento,
          ordem_kanban: novaOrdem,
          data_primeiro_atendimento: new Date().toISOString()
        })
        .select()
        .single();

      if (negError) throw negError;

      // Add unidades
      if (unidade_ids && unidade_ids.length > 0) {
        for (const unidade_id of unidade_ids) {
          await db
            .from('negociacao_unidades')
            .insert({ negociacao_id: negociacao.id, unidade_id });
        }

        // Reserve units
        await supabase
          .from('unidades')
          .update({ status: 'reservada' })
          .in('id', unidade_ids);
      }

      // Add payment conditions
      if (condicoes_pagamento && condicoes_pagamento.length > 0) {
        const condicoesData = condicoes_pagamento.map((c, index) => ({
          negociacao_id: negociacao.id,
          ordem: index,
          tipo_parcela_codigo: c.tipo_parcela_codigo,
          quantidade: c.quantidade,
          valor: c.valor,
          valor_tipo: c.valor_tipo || 'fixo',
          forma_quitacao: c.forma_quitacao || 'dinheiro',
          forma_pagamento: c.forma_pagamento || 'boleto',
          intervalo_dias: c.intervalo_dias || 30,
          com_correcao: c.com_correcao || false,
          indice_correcao: c.indice_correcao || 'INCC',
          parcelas_sem_correcao: c.parcelas_sem_correcao || 0,
          descricao: c.descricao,
          observacao_texto: c.observacao_texto,
          data_vencimento: c.data_vencimento,
          evento_vencimento: c.evento_vencimento,
        }));

        const { error: condicoesError } = await db
          .from('negociacao_condicoes_pagamento')
          .insert(condicoesData);

        if (condicoesError) {
          console.error('Erro ao criar condições de pagamento:', condicoesError);
          // Não lança erro para não bloquear a criação da negociação
        }
      }

      // Add initial history
      await db
        .from('negociacao_historico')
        .insert({
          negociacao_id: negociacao.id,
          funil_etapa_nova_id: funil_etapa_id,
          observacao: 'Negociação criada'
        });

      return negociacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['negociacao-condicoes-pagamento'] });
      invalidateDashboards(queryClient);
      toast.success('Negociação criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar negociação: ' + error.message);
    }
  });
}

export function useMoverNegociacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      etapa_anterior_id, 
      targetEtapa,
      data 
    }: { 
      id: string; 
      etapa_anterior_id?: string;
      targetEtapa?: { is_final_sucesso: boolean; is_final_perda: boolean };
      data: MoverNegociacaoData 
    }) => {
      const updateData: Record<string, unknown> = {
        funil_etapa_id: data.funil_etapa_id
      };

      // Handle final loss stage
      if (targetEtapa?.is_final_perda) {
        updateData.motivo_perda = data.motivo_perda;
        
        const { data: negUnidades } = await db
          .from('negociacao_unidades')
          .select('unidade_id')
          .eq('negociacao_id', id);

        if (negUnidades && negUnidades.length > 0) {
          await supabase
            .from('unidades')
            .update({ status: 'disponivel' })
            .in('id', negUnidades.map((u: { unidade_id: string }) => u.unidade_id));
        }
      }

      // Handle final success stage
      if (targetEtapa?.is_final_sucesso) {
        updateData.data_fechamento = data.data_fechamento || new Date().toISOString().split('T')[0];
        
        const { data: negUnidades } = await db
          .from('negociacao_unidades')
          .select('unidade_id')
          .eq('negociacao_id', id);

        if (negUnidades && negUnidades.length > 0) {
          await supabase
            .from('unidades')
            .update({ status: 'vendida' })
            .in('id', negUnidades.map((u: { unidade_id: string }) => u.unidade_id));
        }
      }

      const { error: updateError } = await db
        .from('negociacoes')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      const { error: histError } = await db
        .from('negociacao_historico')
        .insert({
          negociacao_id: id,
          user_id: user?.id,
          funil_etapa_anterior_id: etapa_anterior_id,
          funil_etapa_nova_id: data.funil_etapa_id,
          observacao: data.observacao
        });

      if (histError) throw histError;

      // Dispatch webhooks for final stages
      if (targetEtapa?.is_final_sucesso || targetEtapa?.is_final_perda) {
        try {
          // Fetch complete negotiation data for webhook payload
          const { data: negociacaoCompleta } = await db
            .from('negociacoes')
            .select(`
              *,
              cliente:clientes(id, nome, email, telefone, cpf, whatsapp),
              empreendimento:empreendimentos(id, nome),
              corretor:corretores(id, nome_completo, email, telefone),
              imobiliaria:imobiliarias(id, nome),
              unidades:negociacao_unidades(
                unidade_id,
                valor_unidade,
                valor_proposta,
                unidade:unidades(id, numero, valor, bloco:blocos(nome))
              )
            `)
            .eq('id', id)
            .single();

          const evento = targetEtapa.is_final_sucesso ? 'negociacao_fechada' : 'negociacao_perdida';
          
          const webhookPayload = {
            evento,
            dados: {
              negociacao_id: id,
              negociacao_codigo: negociacaoCompleta?.codigo,
              cliente_id: negociacaoCompleta?.cliente_id,
              cliente_nome: negociacaoCompleta?.cliente?.nome,
              cliente_email: negociacaoCompleta?.cliente?.email,
              cliente_telefone: negociacaoCompleta?.cliente?.telefone || negociacaoCompleta?.cliente?.whatsapp,
              cliente_cpf: negociacaoCompleta?.cliente?.cpf,
              empreendimento_id: negociacaoCompleta?.empreendimento_id,
              empreendimento_nome: negociacaoCompleta?.empreendimento?.nome,
              corretor_id: negociacaoCompleta?.corretor_id,
              corretor_nome: negociacaoCompleta?.corretor?.nome_completo,
              imobiliaria_id: negociacaoCompleta?.imobiliaria_id,
              imobiliaria_nome: negociacaoCompleta?.imobiliaria?.nome,
              valor_negociacao: negociacaoCompleta?.valor_negociacao,
              data_fechamento: updateData.data_fechamento,
              motivo_perda: targetEtapa.is_final_perda ? data.motivo_perda : undefined,
              observacao: data.observacao,
              unidades: negociacaoCompleta?.unidades?.map((u: { unidade_id: string; valor_unidade: number; valor_proposta: number; unidade: { numero: string; valor: number; bloco: { nome: string } } }) => ({
                unidade_id: u.unidade_id,
                numero: u.unidade?.numero,
                bloco: u.unidade?.bloco?.nome,
                valor_tabela: u.unidade?.valor,
                valor_negociado: u.valor_proposta || u.valor_unidade
              }))
            }
          };

          // Dispatch webhook (fire and forget - don't block the mutation)
          supabase.functions.invoke('webhook-dispatcher', {
            body: webhookPayload
          }).then(({ error: webhookError }) => {
            if (webhookError) {
              console.error('Erro ao disparar webhook:', webhookError);
            } else {
              console.log(`Webhook ${evento} disparado com sucesso`);
            }
          });
        } catch (webhookErr) {
          // Log but don't fail the mutation
          console.error('Erro ao preparar webhook:', webhookErr);
        }
      }

      return { id, targetEtapa };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      invalidateDashboards(queryClient);
      toast.success('Negociação movida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao mover negociação: ' + error.message);
    }
  });
}

export function useReordenarNegociacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, novaOrdem }: { id: string; novaOrdem: number }) => {
      const { error } = await db
        .from('negociacoes')
        .update({ ordem_kanban: novaOrdem })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
    }
  });
}

export function useUpdateNegociacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NegociacaoFormData> }) => {
      const { unidade_ids, ...negData } = data;

      const { error } = await db
        .from('negociacoes')
        .update(negData)
        .eq('id', id);

      if (error) throw error;

      // Update unidades if provided
      if (unidade_ids !== undefined) {
        // Get current unidades
        const { data: currentUnidades } = await db
          .from('negociacao_unidades')
          .select('unidade_id')
          .eq('negociacao_id', id);

        const currentIds = (currentUnidades || []).map((u: { unidade_id: string }) => u.unidade_id);
        
        // Remove old ones
        const toRemove = currentIds.filter((uid: string) => !unidade_ids.includes(uid));
        if (toRemove.length > 0) {
          await db
            .from('negociacao_unidades')
            .delete()
            .eq('negociacao_id', id)
            .in('unidade_id', toRemove);

          await supabase
            .from('unidades')
            .update({ status: 'disponivel' })
            .in('id', toRemove);
        }

        // Add new ones
        const toAdd = unidade_ids.filter((uid: string) => !currentIds.includes(uid));
        if (toAdd.length > 0) {
          for (const unidade_id of toAdd) {
            await db
              .from('negociacao_unidades')
              .insert({ negociacao_id: id, unidade_id });
          }

          await supabase
            .from('unidades')
            .update({ status: 'reservada' })
            .in('id', toAdd);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['negociacao', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      invalidateDashboards(queryClient);
      toast.success('Negociação atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar negociação: ' + error.message);
    }
  });
}

export function useDeleteNegociacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Release units
      const { data: negUnidades } = await db
        .from('negociacao_unidades')
        .select('unidade_id')
        .eq('negociacao_id', id);

      if (negUnidades && negUnidades.length > 0) {
        await supabase
          .from('unidades')
          .update({ status: 'disponivel' })
          .in('id', negUnidades.map((u: { unidade_id: string }) => u.unidade_id));
      }

      const { error } = await db
        .from('negociacoes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      invalidateDashboards(queryClient);
      toast.success('Ficha removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover ficha: ' + error.message);
    }
  });
}

// ====================================================
// Hook para Solicitar Reserva
// ====================================================

export function useSolicitarReserva() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // Verificar se a ficha está completa
      const { data: result, error: checkError } = await db.rpc('verificar_ficha_proposta_completa', { neg_id: id });
      
      if (checkError) throw checkError;
      if (!result) {
        throw new Error('A ficha de proposta não está completa. Preencha todos os campos obrigatórios.');
      }

      // Atualizar status de aprovação para pendente
      const { error } = await db
        .from('negociacoes')
        .update({ 
          status_aprovacao: 'pendente',
          solicitada_em: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;

      // Registrar histórico
      await db
        .from('negociacao_historico')
        .insert({
          negociacao_id: id,
          user_id: user?.id,
          observacao: 'Reserva solicitada - aguardando aprovação'
        });

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      invalidateDashboards(queryClient);
      toast.success('Reserva solicitada com sucesso! Aguardando aprovação.');
    },
    onError: (error: Error) => {
      toast.error('Erro ao solicitar reserva: ' + error.message);
    }
  });
}

// ====================================================
// Hooks de Validação Comercial
// ====================================================

export function useAprovarReserva() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const { error } = await db
        .from('negociacoes')
        .update({ 
          status_aprovacao: 'aprovada',
          aprovada_em: new Date().toISOString(),
          validacao_comercial_em: new Date().toISOString(),
          validacao_comercial_por: user?.id,
          motivo_validacao: motivo,
          updated_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;

      // Registrar histórico
      await db
        .from('negociacao_historico')
        .insert({
          negociacao_id: id,
          user_id: user?.id,
          observacao: `Reserva aprovada${motivo ? ': ' + motivo : ''}`
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      invalidateDashboards(queryClient);
      toast.success('Reserva aprovada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao aprovar reserva: ' + error.message);
    }
  });
}

export function useRejeitarReserva() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { error } = await db
        .from('negociacoes')
        .update({ 
          status_aprovacao: 'rejeitada',
          rejeitada_em: new Date().toISOString(),
          motivo_rejeicao: motivo,
          updated_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;

      // Registrar histórico
      await db
        .from('negociacao_historico')
        .insert({
          negociacao_id: id,
          user_id: user?.id,
          observacao: 'Reserva rejeitada: ' + motivo
        });

      // Liberar unidades
      const { data: negUnidades } = await db
        .from('negociacao_unidades')
        .select('unidade_id')
        .eq('negociacao_id', id);

      if (negUnidades && negUnidades.length > 0) {
        await supabase
          .from('unidades')
          .update({ status: 'disponivel' })
          .in('id', negUnidades.map((u: { unidade_id: string }) => u.unidade_id));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      invalidateDashboards(queryClient);
      toast.success('Reserva rejeitada');
    },
    onError: (error: Error) => {
      toast.error('Erro ao rejeitar reserva: ' + error.message);
    }
  });
}

// ====================================================
// Hook Paginado para Listagem em Tabela
// ====================================================

export interface NegociacoesPaginatedFilters {
  search?: string;
  empreendimento_id?: string;
  corretor_id?: string;
  gestor_id?: string;
  status_proposta?: string;
  funil_etapa_id?: string;
  page?: number;
  pageSize?: number;
}

export function useNegociacoesPaginated(filters: NegociacoesPaginatedFilters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;

  const countQuery = useQuery({
    queryKey: ['negociacoes-count', filters],
    queryFn: async () => {
      let query = db
        .from('negociacoes')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (filters.empreendimento_id) query = query.eq('empreendimento_id', filters.empreendimento_id);
      if (filters.corretor_id) query = query.eq('corretor_id', filters.corretor_id);
      if (filters.gestor_id) query = query.eq('gestor_id', filters.gestor_id);
      if (filters.status_proposta) query = query.eq('status_proposta', filters.status_proposta);
      if (filters.funil_etapa_id) query = query.eq('funil_etapa_id', filters.funil_etapa_id);
      if (filters.search) query = query.ilike('cliente.nome', `%${filters.search}%`);

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const dataQuery = useQuery({
    queryKey: ['negociacoes-paginated', filters],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = db
        .from('negociacoes')
        .select(`
          *,
          cliente:clientes!inner(id, nome, email, telefone),
          empreendimento:empreendimentos(id, nome),
          corretor:corretores(id, nome_completo),
          gestor:profiles!gestor_id(id, full_name),
          funil_etapa:funil_etapas(id, nome, cor, cor_bg, ordem),
          unidades:negociacao_unidades(id)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.empreendimento_id) query = query.eq('empreendimento_id', filters.empreendimento_id);
      if (filters.corretor_id) query = query.eq('corretor_id', filters.corretor_id);
      if (filters.gestor_id) query = query.eq('gestor_id', filters.gestor_id);
      if (filters.status_proposta) query = query.eq('status_proposta', filters.status_proposta);
      if (filters.funil_etapa_id) query = query.eq('funil_etapa_id', filters.funil_etapa_id);
      if (filters.search) query = query.ilike('cliente.nome', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Negociacao[];
    },
  });

  const total = countQuery.data || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    negociacoes: dataQuery.data || [],
    total,
    totalPages,
    isLoading: dataQuery.isLoading || countQuery.isLoading,
  };
}
