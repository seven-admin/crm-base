import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { gerarTextoCondicoesPagamento } from '@/lib/gerarTextoCondicoes';
import { invalidateDashboards } from '@/lib/invalidateDashboards';
import type { Contrato, ContratoFormData, ContratoFilters, ContratoTemplate, ContratoVersao, ContratoDocumento, ContratoPendencia, DocumentoContratoStatus, PendenciaStatus } from '@/types/contratos.types';
import type { ContratoCondicaoPagamento } from '@/types/condicoesPagamento.types';

// Fetch contratos
export function useContratos(filters?: ContratoFilters) {
  return useQuery({
    queryKey: ['contratos', filters],
    queryFn: async () => {
      let query = supabase
        .from('contratos')
        .select(`
          *,
          cliente:clientes(id, nome, cpf, rg, telefone, email, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf),
          empreendimento:empreendimentos(id, nome, matricula_mae, registro_incorporacao),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          gestor:profiles!contratos_gestor_id_fkey(id, full_name),
          template:contrato_templates(id, nome),
          unidades:contrato_unidades(
            id,
            unidade_id,
            valor_unidade,
            unidade:unidades(id, numero, andar, valor, area_privativa, descricao, observacoes, bloco:blocos(nome), tipologia:tipologias(nome))
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }
      if (filters?.corretor_id) {
        query = query.eq('corretor_id', filters.corretor_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      const resultado = (data || []).filter((c: any) => 
        !c.cliente?.nome?.toUpperCase().includes('COMPRADOR HISTÓRICO')
      );
      return resultado as unknown as Contrato[];
    },
  });
}

export function useContratosPaginated(filters?: ContratoFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['contratos-paginated', filters, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('contratos')
        .select(`
          *,
          cliente:clientes(id, nome, cpf, rg, telefone, email, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf),
          empreendimento:empreendimentos(id, nome, matricula_mae, registro_incorporacao),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          gestor:profiles!contratos_gestor_id_fkey(id, full_name),
          template:contrato_templates(id, nome),
          unidades:contrato_unidades(
            id,
            unidade_id,
            valor_unidade,
            unidade:unidades(id, numero, andar, valor, area_privativa, descricao, observacoes, bloco:blocos(nome), tipologia:tipologias(nome))
          )
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }
      if (filters?.corretor_id) {
        query = query.eq('corretor_id', filters.corretor_id);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      const contratos = (data || []).filter((c: any) => 
        !c.cliente?.nome?.toUpperCase().includes('COMPRADOR HISTÓRICO')
      );
      
      return {
        contratos: contratos as unknown as Contrato[],
        total: contratos.length,
        totalPages: Math.ceil(contratos.length / pageSize),
      };
    },
  });
}

// Fetch single contrato
export function useContrato(id: string | undefined) {
  return useQuery({
    queryKey: ['contrato', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('contratos')
        .select(`
          *,
          cliente:clientes(id, nome, cpf, rg, telefone, email, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf),
          empreendimento:empreendimentos(id, nome, matricula_mae, registro_incorporacao),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          gestor:profiles!contratos_gestor_id_fkey(id, full_name),
          template:contrato_templates(id, nome, conteudo_html),
          unidades:contrato_unidades(
            id,
            unidade_id,
            valor_unidade,
            unidade:unidades(id, numero, andar, valor, area_privativa, descricao, observacoes, bloco:blocos(nome), tipologia:tipologias(nome))
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Contrato | null;
    },
    enabled: !!id,
  });
}

// Create contrato
export function useCreateContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ContratoFormData) => {
      const { unidade_ids, negociacao_id, modalidade_id, ...contratoData } = formData;

      // Se tem template, buscar conteúdo HTML
      let conteudoHtml: string | null = null;
      if (contratoData.template_id) {
        const { data: template } = await supabase
          .from('contrato_templates')
          .select('conteudo_html')
          .eq('id', contratoData.template_id)
          .single();
        
        if (template) {
          conteudoHtml = template.conteudo_html;
        }
      }

      // Create contrato - numero is auto-generated by trigger
      const { data: contrato, error: contratoError } = await supabase
        .from('contratos')
        .insert({
          numero: 'TEMP', // Will be replaced by trigger
          cliente_id: contratoData.cliente_id,
          empreendimento_id: contratoData.empreendimento_id,
          corretor_id: contratoData.corretor_id ?? null,
          imobiliaria_id: contratoData.imobiliaria_id ?? null,
          gestor_id: contratoData.gestor_id ?? null,
          template_id: contratoData.template_id ?? null,
          valor_contrato: contratoData.valor_contrato ?? null,
          observacoes: contratoData.observacoes ?? null,
          negociacao_id: negociacao_id ?? null,
          modalidade_id: modalidade_id ?? null,
          conteudo_html: conteudoHtml,
        })
        .select()
        .single();

      if (contratoError) throw contratoError;

      // Create contrato_unidades
      if (unidade_ids.length > 0) {
        const unidadesData = unidade_ids.map(unidade_id => ({
          contrato_id: contrato.id,
          unidade_id,
        }));

        const { error: unidadesError } = await supabase
          .from('contrato_unidades')
          .insert(unidadesData);

        if (unidadesError) throw unidadesError;
      }

      // Copiar condições de pagamento do template para o contrato
      if (contratoData.template_id) {
        const { data: templateCondicoes } = await supabase
          .from('template_condicoes_pagamento')
          .select('*')
          .eq('template_id', contratoData.template_id)
          .eq('is_active', true);

        if (templateCondicoes?.length) {
          const condicoesContrato = templateCondicoes.map(tc => ({
            contrato_id: contrato.id,
            tipo_parcela_codigo: tc.tipo_parcela_codigo,
            ordem: tc.ordem,
            descricao: tc.descricao,
            quantidade: tc.quantidade,
            valor: tc.valor,
            valor_tipo: tc.valor_tipo,
            data_vencimento: tc.data_vencimento,
            intervalo_dias: tc.intervalo_dias,
            evento_vencimento: tc.evento_vencimento,
            com_correcao: tc.com_correcao,
            indice_correcao: tc.indice_correcao,
            parcelas_sem_correcao: tc.parcelas_sem_correcao,
            forma_quitacao: tc.forma_quitacao,
            forma_pagamento: tc.forma_pagamento,
            observacao_texto: tc.observacao_texto,
          }));
          await supabase.from('contrato_condicoes_pagamento').insert(condicoesContrato);
        }
      }

      // Criar versão inicial na tabela contrato_versoes
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('contrato_versoes')
        .insert({
          contrato_id: contrato.id,
          versao: 1,
          conteudo_html: conteudoHtml || '',
          motivo_alteracao: 'Contrato criado',
          alterado_por: user?.id,
        });

      return contrato;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['contratos-paginated'], refetchType: 'all' });
      invalidateDashboards(queryClient);
      toast.success('Contrato criado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar contrato:', error);
      toast.error('Erro ao criar contrato');
    },
  });
}

// Update contrato
export function useUpdateContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contrato> }) => {
      const { error } = await supabase
        .from('contratos')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contratos-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['contrato'] });
      invalidateDashboards(queryClient);
      toast.success('Contrato atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar contrato:', error);
      toast.error('Erro ao atualizar contrato');
    },
  });
}

// Update contrato status
export function useUpdateContratoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, motivo_reprovacao }: { id: string; status: string; motivo_reprovacao?: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      // Set appropriate date based on status
      if (status === 'enviado_assinatura') {
        updateData.data_envio_assinatura = new Date().toISOString().split('T')[0];
      } else if (status === 'assinado') {
        updateData.data_assinatura = new Date().toISOString().split('T')[0];
      } else if (status === 'enviado_incorporador') {
        updateData.data_envio_incorporador = new Date().toISOString().split('T')[0];
      } else if (status === 'aprovado') {
        updateData.data_aprovacao = new Date().toISOString().split('T')[0];
      } else if (status === 'reprovado' && motivo_reprovacao) {
        updateData.motivo_reprovacao = motivo_reprovacao;
      }

      const { error } = await supabase
        .from('contratos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['contratos-paginated'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['contrato'], refetchType: 'all' });
      invalidateDashboards(queryClient);
      toast.success('Status do contrato atualizado');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    },
  });
}

// Delete contrato
export function useDeleteContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contratos')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Erro Supabase ao excluir contrato:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contratos-paginated'] });
      invalidateDashboards(queryClient);
      toast.success('Contrato excluído com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro completo ao excluir contrato:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      const errorCode = error?.code ? ` (${error.code})` : '';
      toast.error(`Erro ao excluir contrato: ${errorMessage}${errorCode}`);
    },
  });
}

// Templates
export function useContratoTemplates(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['contrato-templates', empreendimentoId],
    queryFn: async () => {
      let query = supabase
        .from('contrato_templates')
        .select(`
          *,
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('is_active', true)
        .order('nome');

      if (empreendimentoId) {
        query = query.or(`empreendimento_id.is.null,empreendimento_id.eq.${empreendimentoId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContratoTemplate[];
    },
  });
}

export function useCreateContratoTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ContratoTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: created, error } = await supabase
        .from('contrato_templates')
        .insert(data)
        .select(`*, empreendimento:empreendimentos(id, nome)`)
        .single();

      if (error) throw error;
      return created as ContratoTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-templates'] });
      queryClient.invalidateQueries({ queryKey: ['all-contrato-templates'] });
    },
    onError: (error) => {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    },
  });
}

export function useUpdateContratoTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContratoTemplate> }) => {
      const { error } = await supabase
        .from('contrato_templates')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-templates'] });
      queryClient.invalidateQueries({ queryKey: ['all-contrato-templates'] });
      toast.success('Template atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
    },
  });
}

// Fetch all templates (for management)
export function useAllContratoTemplates() {
  return useQuery({
    queryKey: ['all-contrato-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrato_templates')
        .select(`
          *,
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data as ContratoTemplate[];
    },
  });
}

export function useDeleteContratoTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contrato_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-templates'] });
      queryClient.invalidateQueries({ queryKey: ['all-contrato-templates'] });
      toast.success('Template excluído com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    },
  });
}

// Versões
export function useContratoVersoes(contratoId: string | undefined) {
  return useQuery({
    queryKey: ['contrato-versoes', contratoId],
    queryFn: async () => {
      if (!contratoId) return [];
      const { data, error } = await supabase
        .from('contrato_versoes')
        .select(`
          *,
          alterado_por_profile:profiles!contrato_versoes_alterado_por_fkey(id, full_name)
        `)
        .eq('contrato_id', contratoId)
        .order('versao', { ascending: false });

      if (error) throw error;
      return data as ContratoVersao[];
    },
    enabled: !!contratoId,
  });
}

export function useCreateContratoVersao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { contrato_id: string; versao: number; conteudo_html: string; motivo_alteracao?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('contrato_versoes')
        .insert({
          ...data,
          alterado_por: user?.id,
        });

      if (error) throw error;

      // Update contrato version
      const { error: updateError } = await supabase
        .from('contratos')
        .update({ versao: data.versao, conteudo_html: data.conteudo_html })
        .eq('id', data.contrato_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-versoes'] });
      queryClient.invalidateQueries({ queryKey: ['contrato'] });
      toast.success('Nova versão salva');
    },
    onError: (error) => {
      console.error('Erro ao salvar versão:', error);
      toast.error('Erro ao salvar versão');
    },
  });
}

// Documentos
export function useContratoDocumentos(contratoId: string | undefined) {
  return useQuery({
    queryKey: ['contrato-documentos', contratoId],
    queryFn: async () => {
      if (!contratoId) return [];
      const { data, error } = await supabase
        .from('contrato_documentos')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('obrigatorio', { ascending: false })
        .order('nome');

      if (error) throw error;
      return data as ContratoDocumento[];
    },
    enabled: !!contratoId,
  });
}

export function useCreateContratoDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ContratoDocumento, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('contrato_documentos')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-documentos'] });
      toast.success('Documento adicionado');
    },
    onError: (error) => {
      console.error('Erro ao adicionar documento:', error);
      toast.error('Erro ao adicionar documento');
    },
  });
}

export function useUpdateContratoDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContratoDocumento> }) => {
      const { error } = await supabase
        .from('contrato_documentos')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-documentos'] });
      toast.success('Documento atualizado');
    },
    onError: (error) => {
      console.error('Erro ao atualizar documento:', error);
      toast.error('Erro ao atualizar documento');
    },
  });
}

// Pendências
export function useContratoPendencias(contratoId: string | undefined) {
  return useQuery({
    queryKey: ['contrato-pendencias', contratoId],
    queryFn: async () => {
      if (!contratoId) return [];
      const { data, error } = await supabase
        .from('contrato_pendencias')
        .select(`
          *,
          responsavel:profiles!contrato_pendencias_responsavel_id_fkey(id, full_name)
        `)
        .eq('contrato_id', contratoId)
        .order('status')
        .order('prazo');

      if (error) throw error;
      return data as ContratoPendencia[];
    },
    enabled: !!contratoId,
  });
}

export function useCreateContratoPendencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ContratoPendencia, 'id' | 'created_at' | 'updated_at' | 'responsavel'>) => {
      const { error } = await supabase
        .from('contrato_pendencias')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-pendencias'] });
      toast.success('Pendência criada');
    },
    onError: (error) => {
      console.error('Erro ao criar pendência:', error);
      toast.error('Erro ao criar pendência');
    },
  });
}

export function useUpdateContratoPendencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContratoPendencia> }) => {
      const { error } = await supabase
        .from('contrato_pendencias')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato-pendencias'] });
      toast.success('Pendência atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar pendência:', error);
      toast.error('Erro ao atualizar pendência');
    },
  });
}

// Utility function to replace variables in template
export async function substituirVariaveisContratoAsync(
  template: string,
  contrato: Contrato
): Promise<string> {
  const cliente = contrato.cliente;
  const empreendimento = contrato.empreendimento;
  const unidades = contrato.unidades || [];

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const endereco = cliente
    ? [
        cliente.endereco_logradouro,
        cliente.endereco_numero,
        cliente.endereco_bairro,
        cliente.endereco_cidade,
        cliente.endereco_uf
      ].filter(Boolean).join(', ')
    : '';

  const unidadesTexto = unidades.map(u => u.unidade?.numero).filter(Boolean).join(', ');
  const blocosTexto = [...new Set(unidades.map(u => u.unidade?.bloco?.nome).filter(Boolean))].join(', ');
  
  // Tipologias e descrições das unidades
  const tipologiasTexto = [...new Set(
    unidades.map(u => u.unidade?.tipologia?.nome).filter(Boolean)
  )].join(', ');
  
  // Descrição da UNIDADE (não da tipologia) - campo memorial/descricao
  const descricoesTexto = [...new Set(
    unidades.map(u => (u.unidade as any)?.descricao).filter(Boolean)
  )].join(' | ');
  
  // Observações da unidade
  const observacoesUnidade = [...new Set(
    unidades.map(u => (u.unidade as any)?.observacoes).filter(Boolean)
  )].join(' | ');
  
  const areaUnidade = (unidades[0]?.unidade as any)?.area_privativa?.toString() || '';

  // Buscar condições de pagamento do contrato
  let condicoesPagamentoTexto = '';
  const { data: condicoes } = await supabase
    .from('contrato_condicoes_pagamento')
    .select('*')
    .eq('contrato_id', contrato.id)
    .eq('is_active', true)
    .order('ordem');
  
  if (condicoes && condicoes.length > 0) {
    condicoesPagamentoTexto = gerarTextoCondicoesPagamento(condicoes as ContratoCondicaoPagamento[]);
  }

  const replacements: Record<string, string> = {
    '{{nome_cliente}}': cliente?.nome || '',
    '{{cpf}}': cliente?.cpf || '',
    '{{rg}}': cliente?.rg || '',
    '{{endereco_cliente}}': endereco,
    '{{empreendimento}}': empreendimento?.nome || '',
    '{{unidade}}': unidadesTexto,
    '{{bloco}}': blocosTexto,
    '{{matricula}}': empreendimento?.matricula_mae || '',
    '{{memorial}}': empreendimento?.registro_incorporacao || '',
    '{{valor}}': formatCurrency(contrato.valor_contrato),
    '{{data_atual}}': formatDate(new Date()),
    '{{tipologia}}': tipologiasTexto,
    '{{descricao_unidade}}': descricoesTexto,
    '{{observacoes_unidade}}': observacoesUnidade,
    '{{area_unidade}}': areaUnidade,
    '{{condicoes_pagamento}}': condicoesPagamentoTexto,
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }

  return result;
}

// Synchronous version (for backwards compatibility - does not include condicoes_pagamento)
export function substituirVariaveisContrato(
  template: string,
  contrato: Contrato
): string {
  const cliente = contrato.cliente;
  const empreendimento = contrato.empreendimento;
  const unidades = contrato.unidades || [];

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const endereco = cliente
    ? [
        cliente.endereco_logradouro,
        cliente.endereco_numero,
        cliente.endereco_bairro,
        cliente.endereco_cidade,
        cliente.endereco_uf
      ].filter(Boolean).join(', ')
    : '';

  const unidadesTexto = unidades.map(u => u.unidade?.numero).filter(Boolean).join(', ');
  const blocosTexto = [...new Set(unidades.map(u => u.unidade?.bloco?.nome).filter(Boolean))].join(', ');
  
  const tipologiasTexto = [...new Set(
    unidades.map(u => u.unidade?.tipologia?.nome).filter(Boolean)
  )].join(', ');
  
  const descricoesTexto = [...new Set(
    unidades.map(u => (u.unidade as any)?.descricao).filter(Boolean)
  )].join(' | ');
  
  const observacoesUnidade = [...new Set(
    unidades.map(u => (u.unidade as any)?.observacoes).filter(Boolean)
  )].join(' | ');
  
  const areaUnidade = (unidades[0]?.unidade as any)?.area_privativa?.toString() || '';

  const replacements: Record<string, string> = {
    '{{nome_cliente}}': cliente?.nome || '',
    '{{cpf}}': cliente?.cpf || '',
    '{{rg}}': cliente?.rg || '',
    '{{endereco_cliente}}': endereco,
    '{{empreendimento}}': empreendimento?.nome || '',
    '{{unidade}}': unidadesTexto,
    '{{bloco}}': blocosTexto,
    '{{matricula}}': empreendimento?.matricula_mae || '',
    '{{memorial}}': empreendimento?.registro_incorporacao || '',
    '{{valor}}': formatCurrency(contrato.valor_contrato),
    '{{data_atual}}': formatDate(new Date()),
    '{{tipologia}}': tipologiasTexto,
    '{{descricao_unidade}}': descricoesTexto,
    '{{observacoes_unidade}}': observacoesUnidade,
    '{{area_unidade}}': areaUnidade,
    '{{condicoes_pagamento}}': '(Configure as condições de pagamento)',
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }

  return result;
}

// Finalizar contrato e gerar comissão automaticamente
export function useFinalizarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      contratoId, 
      percentualComissao = 5,
      percentualCorretor = 50,
      percentualImobiliaria = 50,
    }: { 
      contratoId: string; 
      percentualComissao?: number;
      percentualCorretor?: number;
      percentualImobiliaria?: number;
    }) => {
      // Buscar contrato com dados necessários incluindo corretor e imobiliária
      const { data: contrato, error: fetchError } = await supabase
        .from('contratos')
        .select(`
          id,
          numero,
          empreendimento_id,
          gestor_id,
          corretor_id,
          imobiliaria_id,
          valor_contrato
        `)
        .eq('id', contratoId)
        .single();

      if (fetchError) throw fetchError;
      if (!contrato) throw new Error('Contrato não encontrado');
      if (!contrato.gestor_id) throw new Error('Contrato sem gestor do produto definido');

      // Buscar percentual de comissão do gestor
      const { data: gestorProfile } = await supabase
        .from('profiles')
        .select('percentual_comissao')
        .eq('id', contrato.gestor_id)
        .single();

      // Usar percentual do gestor ou o valor passado como parâmetro
      const percentualGestor = gestorProfile?.percentual_comissao ?? percentualComissao;

      // Atualizar status do contrato para enviado_incorporador (após assinado e comissão gerada)
      const { error: updateError } = await supabase
        .from('contratos')
        .update({ 
          status: 'enviado_incorporador',
          data_envio_incorporador: new Date().toISOString().split('T')[0]
        })
        .eq('id', contratoId);

      if (updateError) throw updateError;

      // Calcular valor da comissão usando o percentual do gestor
      const valorVenda = contrato.valor_contrato || 0;
      const valorComissao = (valorVenda * percentualGestor) / 100;
      
      // Calcular comissões individuais (corretor e imobiliária dividem a comissão)
      const valorCorretor = contrato.corretor_id 
        ? (valorComissao * percentualCorretor) / 100 
        : 0;
      const valorImobiliaria = contrato.imobiliaria_id 
        ? (valorComissao * percentualImobiliaria) / 100 
        : 0;

      // Criar comissão automaticamente com dados completos
      const { data: comissao, error: comissaoError } = await supabase
        .from('comissoes')
        .insert({
          numero: 'TEMP', // Will be replaced by trigger
          contrato_id: contratoId,
          empreendimento_id: contrato.empreendimento_id,
          gestor_id: contrato.gestor_id,
          corretor_id: contrato.corretor_id,
          imobiliaria_id: contrato.imobiliaria_id,
          valor_venda: valorVenda,
          percentual_comissao: percentualGestor,
          valor_comissao: valorComissao,
          percentual_corretor: contrato.corretor_id ? percentualCorretor : null,
          percentual_imobiliaria: contrato.imobiliaria_id ? percentualImobiliaria : null,
          valor_corretor: valorCorretor > 0 ? valorCorretor : null,
          valor_imobiliaria: valorImobiliaria > 0 ? valorImobiliaria : null,
          status: 'pendente',
          status_corretor: contrato.corretor_id ? 'pendente' : 'pago',
          status_imobiliaria: contrato.imobiliaria_id ? 'pendente' : 'pago',
        })
        .select()
        .single();

      if (comissaoError) throw comissaoError;

      // Criar lançamento financeiro no fluxo de caixa para o Gestor de Produto
      const { data: user } = await supabase.auth.getUser();
      const { error: lancamentoError } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          tipo: 'pagar',
          categoria_fluxo: 'COMISSIONAMENTO VENDAS',
          descricao: `Comissão Gestor - Contrato ${contrato.numero}`,
          valor: valorComissao,
          data_vencimento: new Date().toISOString().split('T')[0],
          status: 'pendente',
          status_conferencia: 'pendente',
          contrato_id: contratoId,
          comissao_id: comissao.id,
          empreendimento_id: contrato.empreendimento_id,
          beneficiario_id: contrato.gestor_id,
          beneficiario_tipo: 'gestor',
          observacoes: `Comissão automática gerada pela finalização do contrato ${contrato.numero}`,
          created_by: user.user?.id
        });

      if (lancamentoError) {
        console.error('Aviso: Erro ao criar lançamento financeiro:', lancamentoError);
        // Não lançar erro para não bloquear o fluxo principal
      }

      return { contrato, comissao, valorComissao };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contrato'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-paginated'] });
      invalidateDashboards(queryClient);
      toast.success('Contrato finalizado e comissão gerada com sucesso!', {
        description: `Comissão de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valorComissao)}`
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao finalizar contrato:', error);
      toast.error(error.message || 'Erro ao finalizar contrato');
    },
  });
}
