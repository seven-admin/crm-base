import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ContratoAprovacao, FluxoAprovacaoConfig, AprovacaoStatus, AprovadorTipo } from '@/types/assinaturas.types';
import { toast } from 'sonner';

export function useContratoAprovacoes(contratoId: string | undefined) {
  return useQuery({
    queryKey: ['contrato-aprovacoes', contratoId],
    queryFn: async () => {
      if (!contratoId) return [];

      const { data, error } = await supabase
        .from('contrato_aprovacoes')
        .select(`
          *,
          aprovador:profiles(id, full_name, email)
        `)
        .eq('contrato_id', contratoId)
        .order('etapa', { ascending: true });

      if (error) throw error;
      return data as ContratoAprovacao[];
    },
    enabled: !!contratoId
  });
}

export function useFluxoAprovacaoConfig(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['fluxo-aprovacao-config', empreendimentoId],
    queryFn: async () => {
      // Get specific config for empreendimento or global config
      let query = supabase
        .from('fluxo_aprovacao_config')
        .select('*')
        .eq('is_active', true)
        .order('etapa', { ascending: true });

      if (empreendimentoId) {
        query = query.or(`empreendimento_id.eq.${empreendimentoId},empreendimento_id.is.null`);
      } else {
        query = query.is('empreendimento_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If we have empreendimento-specific config, use it; otherwise use global
      const empreendimentoConfig = data?.filter(c => c.empreendimento_id === empreendimentoId);
      if (empreendimentoConfig && empreendimentoConfig.length > 0) {
        return empreendimentoConfig as FluxoAprovacaoConfig[];
      }
      
      return data?.filter(c => c.empreendimento_id === null) as FluxoAprovacaoConfig[];
    }
  });
}

export function useIniciarFluxoAprovacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, empreendimentoId }: { contratoId: string; empreendimentoId: string }) => {
      // Get flow config
      const { data: config, error: configError } = await supabase
        .from('fluxo_aprovacao_config')
        .select('*')
        .eq('is_active', true)
        .or(`empreendimento_id.eq.${empreendimentoId},empreendimento_id.is.null`)
        .order('etapa', { ascending: true });

      if (configError) throw configError;

      // Use empreendimento-specific or global config
      const flowConfig = config?.filter(c => c.empreendimento_id === empreendimentoId);
      const activeConfig = (flowConfig && flowConfig.length > 0) 
        ? flowConfig 
        : config?.filter(c => c.empreendimento_id === null);

      if (!activeConfig || activeConfig.length === 0) {
        throw new Error('Nenhuma configuração de fluxo encontrada');
      }

      // Create approval entries for each stage
      const aprovacoes = activeConfig.map(stage => ({
        contrato_id: contratoId,
        etapa: stage.etapa,
        tipo_aprovador: stage.tipo_aprovador as 'corretor' | 'gestor_comercial' | 'juridico' | 'diretoria' | 'incorporador',
        status: 'pendente' as const,
        data_envio: stage.etapa === 1 ? new Date().toISOString() : null
      }));

      const { data, error } = await supabase
        .from('contrato_aprovacoes')
        .insert(aprovacoes)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-aprovacoes', variables.contratoId] });
      toast.success('Fluxo de aprovação iniciado');
    },
    onError: (error) => {
      console.error('Error starting approval flow:', error);
      toast.error('Erro ao iniciar fluxo de aprovação');
    }
  });
}

export function useResponderAprovacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      contratoId,
      status, 
      observacao,
      aprovadorId
    }: { 
      id: string; 
      contratoId: string;
      status: 'aprovado' | 'reprovado' | 'em_revisao'; 
      observacao?: string;
      aprovadorId: string;
    }) => {
      // Update current approval
      const { error: updateError } = await supabase
        .from('contrato_aprovacoes')
        .update({
          status,
          observacao,
          aprovador_id: aprovadorId,
          data_resposta: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // If approved, send to next stage
      if (status === 'aprovado') {
        // Get current stage
        const { data: currentApproval } = await supabase
          .from('contrato_aprovacoes')
          .select('etapa')
          .eq('id', id)
          .single();

        if (currentApproval) {
          // Send next stage
          await supabase
            .from('contrato_aprovacoes')
            .update({ data_envio: new Date().toISOString() })
            .eq('contrato_id', contratoId)
            .eq('etapa', currentApproval.etapa + 1);
        }
      }

      return { id, status };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-aprovacoes', variables.contratoId] });
      const statusLabel = result.status === 'aprovado' ? 'aprovada' : result.status === 'reprovado' ? 'reprovada' : 'em revisão';
      toast.success(`Etapa ${statusLabel}`);
    },
    onError: (error) => {
      console.error('Error responding to approval:', error);
      toast.error('Erro ao responder aprovação');
    }
  });
}

export function useAtribuirAprovador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, contratoId, aprovadorId }: { id: string; contratoId: string; aprovadorId: string }) => {
      const { error } = await supabase
        .from('contrato_aprovacoes')
        .update({ aprovador_id: aprovadorId })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contrato-aprovacoes', variables.contratoId] });
      toast.success('Aprovador atribuído');
    },
    onError: (error) => {
      console.error('Error assigning approver:', error);
      toast.error('Erro ao atribuir aprovador');
    }
  });
}

export function useSaveFluxoConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      empreendimentoId, 
      etapas 
    }: { 
      empreendimentoId?: string; 
      etapas: Array<{
        etapa: number;
        tipo_aprovador: AprovadorTipo;
        nome_etapa: string;
        obrigatoria: boolean;
        prazo_horas: number;
      }>;
    }) => {
      // Delete existing config for this empreendimento
      if (empreendimentoId) {
        await supabase
          .from('fluxo_aprovacao_config')
          .delete()
          .eq('empreendimento_id', empreendimentoId);
      }

      // Insert new config
      const { data, error } = await supabase
        .from('fluxo_aprovacao_config')
        .insert(etapas.map(e => ({
          ...e,
          empreendimento_id: empreendimentoId || null
        })))
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fluxo-aprovacao-config', variables.empreendimentoId] });
      toast.success('Configuração do fluxo salva');
    },
    onError: (error) => {
      console.error('Error saving flow config:', error);
      toast.error('Erro ao salvar configuração');
    }
  });
}
