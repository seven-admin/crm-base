import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConfiguracaoComercial {
  id: string;
  empreendimento_id: string;
  valor_m2: number;
  data_referencia: string;
  desconto_avista: number;
  entrada_curto_prazo: number;
  parcelas_curto_prazo: number;
  entrada_minima: number;
  max_parcelas_entrada: number;
  max_parcelas_mensais: number;
  taxa_juros_anual: number;
  indice_reajuste: string;
  limite_parcelas_anuais: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ConfiguracaoComercialFormData = Omit<ConfiguracaoComercial, 'id' | 'empreendimento_id' | 'created_at' | 'updated_at'>;

// Fetch only active config (for commercial use)
export function useConfiguracaoComercial(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['configuracao-comercial', empreendimentoId],
    queryFn: async () => {
      if (!empreendimentoId) return null;
      
      const { data, error } = await supabase
        .from('configuracao_comercial')
        .select('*')
        .eq('empreendimento_id', empreendimentoId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as ConfiguracaoComercial | null;
    },
    enabled: !!empreendimentoId,
  });
}

// Fetch any config (active or draft - for admin use)
export function useConfiguracaoComercialAdmin(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['configuracao-comercial-admin', empreendimentoId],
    queryFn: async () => {
      if (!empreendimentoId) return null;
      
      const { data, error } = await supabase
        .from('configuracao_comercial')
        .select('*')
        .eq('empreendimento_id', empreendimentoId)
        .maybeSingle();

      if (error) throw error;
      return data as ConfiguracaoComercial | null;
    },
    enabled: !!empreendimentoId,
  });
}

export function useCreateConfiguracaoComercial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      empreendimentoId, 
      data 
    }: { 
      empreendimentoId: string; 
      data: ConfiguracaoComercialFormData 
    }) => {
      const { data: result, error } = await supabase
        .from('configuracao_comercial')
        .insert({
          empreendimento_id: empreendimentoId,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-comercial', variables.empreendimentoId] });
      toast.success('Configuração comercial criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar configuração comercial:', error);
      toast.error('Erro ao criar configuração comercial');
    },
  });
}

export function useUpdateConfiguracaoComercial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      empreendimentoId,
      data 
    }: { 
      id: string; 
      empreendimentoId: string;
      data: Partial<ConfiguracaoComercialFormData> 
    }) => {
      const { data: result, error } = await supabase
        .from('configuracao_comercial')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-comercial', variables.empreendimentoId] });
      toast.success('Configuração comercial atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar configuração comercial:', error);
      toast.error('Erro ao atualizar configuração comercial');
    },
  });
}

export function useUpsertConfiguracaoComercial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      empreendimento_id: string;
      valor_m2: number;
      data_referencia: string;
      desconto_avista: number;
      entrada_curto_prazo: number;
      parcelas_curto_prazo: number;
      entrada_minima: number;
      max_parcelas_entrada: number;
      max_parcelas_mensais: number;
      taxa_juros_anual: number;
      indice_reajuste: string;
      limite_parcelas_anuais: number;
      is_active?: boolean;
    }) => {
      const { data: result, error } = await supabase
        .from('configuracao_comercial')
        .upsert(data, {
          onConflict: 'empreendimento_id'
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-comercial', variables.empreendimento_id] });
      queryClient.invalidateQueries({ queryKey: ['configuracao-comercial-admin', variables.empreendimento_id] });
      toast.success('Configuração comercial salva!');
    },
    onError: (error) => {
      console.error('Erro ao salvar configuração comercial:', error);
      toast.error('Erro ao salvar configuração comercial');
    },
  });
}
