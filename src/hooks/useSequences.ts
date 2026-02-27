import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SequenceInfo {
  seq_name: string;
  last_value: number;
  label: string;
  prefix: string;
}

const SEQUENCE_META: Record<string, { label: string; prefix: string }> = {
  negociacao_codigo_seq: { label: 'Negociação', prefix: 'NEG-' },
  negociacao_proposta_seq: { label: 'Proposta (Negociação)', prefix: 'PROP-' },
  proposta_numero_seq: { label: 'Proposta (Ano)', prefix: 'ANO-' },
  briefing_codigo_seq: { label: 'Briefing', prefix: 'BRF-' },
  projeto_codigo_seq: { label: 'Projeto Marketing', prefix: 'MKT-' },
  contrato_numero_seq: { label: 'Contrato', prefix: 'CONT-' },
  comissao_numero_seq: { label: 'Comissão', prefix: 'COM-' },
  evento_codigo_seq: { label: 'Evento', prefix: 'EVT-' },
  reserva_protocolo_seq: { label: 'Reserva', prefix: 'RES-' },
};

export function useSequenceValues() {
  return useQuery({
    queryKey: ['sequence-values'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_sequence_values');
      if (error) throw error;
      return (data as any[]).map((row) => ({
        seq_name: row.seq_name,
        last_value: Number(row.last_value),
        label: SEQUENCE_META[row.seq_name]?.label || row.seq_name,
        prefix: SEQUENCE_META[row.seq_name]?.prefix || '',
      })) as SequenceInfo[];
    },
    staleTime: 30_000,
  });
}

export function useResetSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sequence_name, restart_value }: { sequence_name: string; restart_value: number }) => {
      const { data, error } = await supabase.functions.invoke('reset-sequence', {
        body: { sequence_name, restart_value },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Contador reiniciado para ${variables.restart_value}`);
      queryClient.invalidateQueries({ queryKey: ['sequence-values'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reiniciar contador: ${error.message}`);
    },
  });
}
