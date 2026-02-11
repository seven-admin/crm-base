import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  TemplateCondicaoPagamento, 
  ContratoCondicaoPagamento,
  TipoParcela,
  CondicaoPagamentoFormData 
} from '@/types/condicoesPagamento.types';

// ============ TIPOS DE PARCELA ============

export function useTiposParcela() {
  return useQuery({
    queryKey: ['tipos-parcela'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_parcela')
        .select('*')
        .eq('is_active', true)
        .order('ordem');
      
      if (error) throw error;
      return data as TipoParcela[];
    },
  });
}

// ============ TEMPLATE CONDIÇÕES ============

export function useTemplateCondicoesPagamento(templateId: string | undefined) {
  return useQuery({
    queryKey: ['template-condicoes-pagamento', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('template_condicoes_pagamento')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('ordem');
      
      if (error) throw error;
      return data as TemplateCondicaoPagamento[];
    },
    enabled: !!templateId,
  });
}

export function useCreateTemplateCondicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { template_id: string } & CondicaoPagamentoFormData & { ordem: number }) => {
      const { data: result, error } = await supabase
        .from('template_condicoes_pagamento')
        .insert({
          template_id: data.template_id,
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
          bem_descricao: data.bem_descricao,
          bem_marca: data.bem_marca,
          bem_modelo: data.bem_modelo,
          bem_ano: data.bem_ano,
          bem_placa: data.bem_placa,
          bem_cor: data.bem_cor,
          bem_renavam: data.bem_renavam,
          bem_matricula: data.bem_matricula,
          bem_cartorio: data.bem_cartorio,
          bem_endereco: data.bem_endereco,
          bem_area_m2: data.bem_area_m2,
          bem_valor_avaliado: data.bem_valor_avaliado,
          bem_observacoes: data.bem_observacoes,
          beneficiario_tipo: data.beneficiario_tipo,
          beneficiario_id: data.beneficiario_id,
          observacao_texto: data.observacao_texto,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-condicoes-pagamento', variables.template_id] });
    },
  });
}

export function useUpdateTemplateCondicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, templateId, ...data }: { id: string; templateId: string } & Partial<CondicaoPagamentoFormData> & { ordem?: number }) => {
      const { data: result, error } = await supabase
        .from('template_condicoes_pagamento')
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
          bem_descricao: data.bem_descricao,
          bem_marca: data.bem_marca,
          bem_modelo: data.bem_modelo,
          bem_ano: data.bem_ano,
          bem_placa: data.bem_placa,
          bem_cor: data.bem_cor,
          bem_renavam: data.bem_renavam,
          bem_matricula: data.bem_matricula,
          bem_cartorio: data.bem_cartorio,
          bem_endereco: data.bem_endereco,
          bem_area_m2: data.bem_area_m2,
          bem_valor_avaliado: data.bem_valor_avaliado,
          bem_observacoes: data.bem_observacoes,
          beneficiario_tipo: data.beneficiario_tipo,
          beneficiario_id: data.beneficiario_id,
          observacao_texto: data.observacao_texto,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-condicoes-pagamento', variables.templateId] });
    },
  });
}

export function useDeleteTemplateCondicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, templateId }: { id: string; templateId: string }) => {
      const { error } = await supabase
        .from('template_condicoes_pagamento')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-condicoes-pagamento', variables.templateId] });
    },
  });
}

export function useReorderTemplateCondicoes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ templateId, items }: { templateId: string; items: { id: string; ordem: number }[] }) => {
      const updates = items.map(item => 
        supabase
          .from('template_condicoes_pagamento')
          .update({ ordem: item.ordem })
          .eq('id', item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-condicoes-pagamento', variables.templateId] });
    },
  });
}

// ============ CONTRATO CONDIÇÕES ============

export function useContratoCondicoesPagamento(contratoId: string | undefined) {
  return useQuery({
    queryKey: ['contrato-condicoes-pagamento', contratoId],
    queryFn: async () => {
      if (!contratoId) return [];
      
      const { data, error } = await supabase
        .from('contrato_condicoes_pagamento')
        .select('*')
        .eq('contrato_id', contratoId)
        .eq('is_active', true)
        .order('ordem');
      
      if (error) throw error;
      return data as ContratoCondicaoPagamento[];
    },
    enabled: !!contratoId,
  });
}

export function useCopyTemplateCondicoesToContrato() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ templateId, contratoId }: { templateId: string; contratoId: string }) => {
      // Buscar condições do template
      const { data: templateCondicoes, error: fetchError } = await supabase
        .from('template_condicoes_pagamento')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('ordem');
      
      if (fetchError) throw fetchError;
      if (!templateCondicoes?.length) return [];
      
      // Copiar para o contrato
      const condicoesContrato = templateCondicoes.map(tc => ({
        contrato_id: contratoId,
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
        bem_descricao: tc.bem_descricao,
        bem_marca: tc.bem_marca,
        bem_modelo: tc.bem_modelo,
        bem_ano: tc.bem_ano,
        bem_placa: tc.bem_placa,
        bem_cor: tc.bem_cor,
        bem_renavam: tc.bem_renavam,
        bem_matricula: tc.bem_matricula,
        bem_cartorio: tc.bem_cartorio,
        bem_endereco: tc.bem_endereco,
        bem_area_m2: tc.bem_area_m2,
        bem_valor_avaliado: tc.bem_valor_avaliado,
        bem_observacoes: tc.bem_observacoes,
        beneficiario_tipo: tc.beneficiario_tipo,
        beneficiario_id: tc.beneficiario_id,
        observacao_texto: tc.observacao_texto,
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

export function useCreateContratoCondicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { contrato_id: string } & CondicaoPagamentoFormData & { ordem: number }) => {
      const { data: result, error } = await supabase
        .from('contrato_condicoes_pagamento')
        .insert({
          contrato_id: data.contrato_id,
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
          bem_descricao: data.bem_descricao,
          bem_marca: data.bem_marca,
          bem_modelo: data.bem_modelo,
          bem_ano: data.bem_ano,
          bem_placa: data.bem_placa,
          bem_cor: data.bem_cor,
          bem_renavam: data.bem_renavam,
          bem_matricula: data.bem_matricula,
          bem_cartorio: data.bem_cartorio,
          bem_endereco: data.bem_endereco,
          bem_area_m2: data.bem_area_m2,
          bem_valor_avaliado: data.bem_valor_avaliado,
          bem_observacoes: data.bem_observacoes,
          beneficiario_tipo: data.beneficiario_tipo,
          beneficiario_id: data.beneficiario_id,
          observacao_texto: data.observacao_texto,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-condicoes-pagamento', variables.contrato_id] });
    },
  });
}

export function useUpdateContratoCondicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, contratoId, ...data }: { id: string; contratoId: string } & Partial<CondicaoPagamentoFormData> & { ordem?: number }) => {
      const { data: result, error } = await supabase
        .from('contrato_condicoes_pagamento')
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
          bem_descricao: data.bem_descricao,
          bem_marca: data.bem_marca,
          bem_modelo: data.bem_modelo,
          bem_ano: data.bem_ano,
          bem_placa: data.bem_placa,
          bem_cor: data.bem_cor,
          bem_renavam: data.bem_renavam,
          bem_matricula: data.bem_matricula,
          bem_cartorio: data.bem_cartorio,
          bem_endereco: data.bem_endereco,
          bem_area_m2: data.bem_area_m2,
          bem_valor_avaliado: data.bem_valor_avaliado,
          bem_observacoes: data.bem_observacoes,
          beneficiario_tipo: data.beneficiario_tipo,
          beneficiario_id: data.beneficiario_id,
          observacao_texto: data.observacao_texto,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-condicoes-pagamento', variables.contratoId] });
    },
  });
}

export function useDeleteContratoCondicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, contratoId }: { id: string; contratoId: string }) => {
      const { error } = await supabase
        .from('contrato_condicoes_pagamento')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-condicoes-pagamento', variables.contratoId] });
    },
  });
}
