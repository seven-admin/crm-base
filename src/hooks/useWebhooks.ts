import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Webhook {
  id: string;
  evento: string;
  url: string;
  descricao: string | null;
  is_active: boolean;
  ultimo_disparo: string | null;
  ultimo_status: number | null;
  variaveis_selecionadas: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookFormData {
  evento: string;
  url: string;
  descricao?: string;
  is_active?: boolean;
  variaveis_selecionadas?: string[] | null;
}

export const WEBHOOK_EVENTS = [
  // ── Eventos ativos (disparados no código) ──
  { value: 'atividade_comentada', label: 'Atividade Comentada (Marketing / Forecast)' },
  { value: 'atividade_criada_por_superadmin', label: 'Atividade Criada por Super Admin' },
  { value: 'comentario_proposta', label: 'Comentário em Proposta (Negociação)' },
  { value: 'corretor_aprovado', label: 'Corretor Aprovado (Ativação)' },
  { value: 'corretor_cadastrado', label: 'Corretor Cadastrado (Novo Cadastro)' },
  { value: 'imobiliaria_cadastrada', label: 'Imobiliária Cadastrada' },
  { value: 'imobiliaria_atualizada', label: 'Imobiliária Atualizada' },
  { value: 'meta_comercial_criada', label: 'Meta Comercial Criada' },
  { value: 'negociacao_movida', label: 'Negociação Movida (Transição de Etapa)' },
  { value: 'negociacao_fechada', label: 'Negociação Fechada (Sucesso)' },
  { value: 'negociacao_perdida', label: 'Negociação Perdida' },
  { value: 'proposta_em_analise', label: 'Proposta Enviada para Análise' },
  { value: 'proposta_aprovada_incorporador', label: 'Proposta Aprovada pelo Incorporador' },
  { value: 'proposta_contra_proposta', label: 'Contra-Proposta do Incorporador' },
  { value: 'assinatura_enviada', label: 'Assinatura Enviada (Webhook n8n)' },
  // ── Eventos planejados (ainda não disparados) ──
  { value: 'briefing_triado', label: 'Briefing Triado (planejado)' },
  { value: 'contrato_assinado', label: 'Contrato Assinado (planejado)' },
  { value: 'contrato_gerado', label: 'Contrato Gerado (planejado)' },
  { value: 'lead_convertido', label: 'Lead Convertido (planejado)' },
  { value: 'negociacao_criada', label: 'Negociação Criada (planejado)' },
  { value: 'reserva_criada', label: 'Reserva Criada (planejado)' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await db
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Webhook[];
    },
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WebhookFormData) => {
      const { data: webhook, error } = await db
        .from('webhooks')
        .insert({
          evento: data.evento,
          url: data.url,
          descricao: data.descricao || null,
          is_active: data.is_active ?? true,
          variaveis_selecionadas: data.variaveis_selecionadas || null,
        })
        .select()
        .single();

      if (error) throw error;
      return webhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook criado com sucesso');
    },
    onError: (error) => {
      console.error('Error creating webhook:', error);
      toast.error('Erro ao criar webhook');
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WebhookFormData> }) => {
      const { data: webhook, error } = await db
        .from('webhooks')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return webhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating webhook:', error);
      toast.error('Erro ao atualizar webhook');
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook excluído com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting webhook:', error);
      toast.error('Erro ao excluir webhook');
    },
  });
}

// ====================================================
// Webhook Logs
// ====================================================

export interface WebhookLog {
  id: string;
  webhook_id: string | null;
  evento: string;
  url: string;
  payload: unknown;
  status_code: number | null;
  response_body: string | null;
  tempo_ms: number | null;
  sucesso: boolean;
  erro: string | null;
  created_at: string;
}

export interface WebhookLogsResult {
  logs: WebhookLog[];
  total: number;
  page: number;
  totalPages: number;
}

export function useWebhookLogs(webhookId?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['webhook-logs', webhookId, page, pageSize],
    queryFn: async (): Promise<WebhookLogsResult> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = db
        .from('webhook_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (webhookId) {
        query = query.eq('webhook_id', webhookId);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      const total = count ?? 0;
      return {
        logs: (data ?? []) as WebhookLog[],
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
  });
}

export function useCleanOldWebhookLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cleanup-webhook-logs', {
        method: 'POST',
      });
      if (error) throw error;
      return data as { deleted: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhook-logs'] });
      toast.success(`${data?.deleted ?? 0} logs antigos removidos`);
    },
    onError: (error) => {
      console.error('Error cleaning webhook logs:', error);
      toast.error('Erro ao limpar logs antigos');
    },
  });
}

// ====================================================
// Testar Webhook
// ====================================================

export function useTestarWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhook: { id: string; evento: string; url: string }) => {
      const { data, error } = await supabase.functions.invoke('webhook-dispatcher', {
        body: {
          evento: webhook.evento,
          dados: {
            _teste: true,
            mensagem: 'Este é um disparo de teste do webhook',
            evento: webhook.evento,
            webhook_id: webhook.id,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhook-logs'] });
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      
      const resultado = data?.resultados?.[0];
      if (resultado?.sucesso) {
        toast.success(`Teste bem-sucedido! Status: ${resultado.status} em ${resultado.tempo_ms}ms`);
      } else {
        toast.error(`Teste falhou: ${resultado?.erro || `Status ${resultado?.status}`}`);
      }
    },
    onError: (error) => {
      console.error('Error testing webhook:', error);
      toast.error('Erro ao testar webhook');
    },
  });
}

// ====================================================
// Variáveis Disponíveis por Evento
// ====================================================

export interface WebhookVariavel {
  id: string;
  evento: string;
  chave: string;
  label: string;
  categoria: string;
  tipo: string;
}

export function useWebhookVariaveis(evento?: string) {
  return useQuery({
    queryKey: ['webhook-variaveis', evento],
    queryFn: async () => {
      if (!evento) return [];
      const { data, error } = await db
        .from('webhook_variaveis_disponiveis')
        .select('*')
        .eq('evento', evento)
        .order('categoria', { ascending: true });

      if (error) throw error;
      return (data ?? []) as WebhookVariavel[];
    },
    enabled: !!evento,
  });
}
