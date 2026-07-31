import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// "Lista de clientes" para contratos = propostas cadastradas na NEXA (outro Supabase),
// obtidas ao vivo pelo edge function `propostas`.
export interface PropostaListItem {
  proposal_code: string;
  status: string;
  created_at: string;
  buyer_name: string | null;
  buyer_cpf: string | null;
  unit_number: string | null;
  project_name: string | null;
  external_unit_id: string | null;
}

export function usePropostasNexa(enabled: boolean) {
  return useQuery({
    queryKey: ['nexa', 'propostas', 'list'],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<PropostaListItem[]> => {
      const { data, error } = await supabase.functions.invoke('propostas', { body: { list: true } });
      if (error) throw error;
      return (data?.items ?? []) as PropostaListItem[];
    },
  });
}

export interface PropostaCompleta { found: boolean; proposal_code?: string; status?: string; data?: any }

export async function buscarPropostaPorCodigo(proposalCode: string): Promise<PropostaCompleta> {
  const { data, error } = await supabase.functions.invoke('propostas', { body: { proposalCode } });
  if (error) throw error;
  return data as PropostaCompleta;
}
