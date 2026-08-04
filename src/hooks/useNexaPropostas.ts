import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useProposta(proposalCode: string | null) {
  return useQuery({
    queryKey: ['nexa', 'proposta', proposalCode],
    enabled: !!proposalCode,
    staleTime: 60_000,
    queryFn: () => buscarPropostaPorCodigo(proposalCode!),
  });
}

// ============ Feed de propostas/análises de crédito no dashboard ============
export type PropostaTipo = 'proposta' | 'analise_credito';

export interface PropostaFeedItem extends PropostaListItem {
  modality: string | null;
  empreendimento_id: string | null;
  empreendimento_nome: string | null;
  tipo: PropostaTipo;
}

export const PROPOSTA_STATUS_LABEL: Record<string, string> = {
  submitted: 'Enviada',
  reserved: 'Reservada',
  sold: 'Vendida',
  withdrawn: 'Retirada',
};

// "Análise de crédito" = proposta financiada (qualquer modalidade que não seja Fluxo Direto).
function classificarTipo(modality: string | null): PropostaTipo {
  return modality && modality.trim().toLowerCase() !== 'fluxo direto' ? 'analise_credito' : 'proposta';
}

const ADMIN_PROPOSTAS_ROLES = new Set(['admin', 'super_admin', 'nexa_admin', 'nexa_gestor']);

export function useNexaPropostasFeed() {
  const { user, role } = useAuth();
  const userId = user?.id;
  const canSeeAll = !!role && ADMIN_PROPOSTAS_ROLES.has(role);

  return useQuery({
    queryKey: ['nexa', 'propostas', 'feed', userId, canSeeAll],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<{ items: PropostaFeedItem[]; canSeeAll: boolean }> => {
      const { data, error } = await supabase.functions.invoke('propostas', { body: { list: true } });
      if (error) throw error;
      const propostas = (data?.items ?? []) as Array<PropostaListItem & { modality: string | null }>;

      // resolve empreendimento pelo externalUnitId = seven_unidades.id
      const unitIds = [...new Set(propostas.map((p) => p.external_unit_id).filter(Boolean))] as string[];
      const unitMap = new Map<string, { empId: string; empNome: string }>();
      if (unitIds.length) {
        const { data: unidades } = await supabase
          .from('seven_unidades')
          .select('id, empreendimento_id, empreendimento:seven_empreendimentos(id, nome)')
          .in('id', unitIds);
        for (const u of (unidades ?? []) as any[]) {
          if (u.empreendimento) unitMap.set(u.id, { empId: u.empreendimento.id, empNome: u.empreendimento.nome });
        }
      }

      // empreendimentos que o usuário pode ver (admin vê todos)
      let allowed: Set<string> | null = null;
      if (!canSeeAll && userId) {
        const { data: acesso } = await supabase
          .from('nexa_propostas_acesso' as any)
          .select('empreendimento_id')
          .eq('user_id', userId);
        allowed = new Set(((acesso ?? []) as any[]).map((a) => a.empreendimento_id));
      }

      const items: PropostaFeedItem[] = [];
      for (const p of propostas) {
        const emp = p.external_unit_id ? unitMap.get(p.external_unit_id) : undefined;
        if (!canSeeAll && (!emp || !allowed!.has(emp.empId))) continue; // fora do escopo do usuário
        items.push({
          ...p,
          empreendimento_id: emp?.empId ?? null,
          empreendimento_nome: emp?.empNome ?? p.project_name ?? null,
          tipo: classificarTipo(p.modality),
        });
      }
      return { items, canSeeAll };
    },
  });
}

// ============ Atribuição de acesso (admin) ============
export interface AcessoRow { user_id: string; empreendimento_id: string }

export function useNexaPropostasAcesso() {
  return useQuery({
    queryKey: ['nexa', 'propostas', 'acesso'],
    queryFn: async () => {
      const { data, error } = await supabase.from('nexa_propostas_acesso' as any).select('user_id, empreendimento_id');
      if (error) throw error;
      return (data ?? []) as unknown as AcessoRow[];
    },
  });
}

export function useSaveNexaPropostaAcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, empreendimentoIds }: { userId: string; empreendimentoIds: string[] }) => {
      const del = await supabase.from('nexa_propostas_acesso' as any).delete().eq('user_id', userId);
      if (del.error) throw del.error;
      if (empreendimentoIds.length) {
        const rows = empreendimentoIds.map((empreendimento_id) => ({ user_id: userId, empreendimento_id }));
        const ins = await supabase.from('nexa_propostas_acesso' as any).insert(rows);
        if (ins.error) throw ins.error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'propostas', 'acesso'] });
      qc.invalidateQueries({ queryKey: ['nexa', 'propostas', 'feed'] });
      toast.success('Acesso atualizado');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar acesso'),
  });
}
