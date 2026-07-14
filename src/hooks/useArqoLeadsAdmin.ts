import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ArqoLeadAdminRow {
  id: string;
  cliente_id: string;
  etapa_id: string;
  source_id: string | null;
  consultor_id: string | null;
  grupo_id: string | null;
  created_at: string;
  fechado_em: string | null;
  cliente?: { id: string; nome: string; telefone: string | null; email: string | null; nivel_cadastro: string | null } | null;
  etapa?: { id: string; nome: string; cor: string; categoria: string } | null;
  source?: { id: string; nome: string } | null;
  consultor?: { id: string; full_name: string; email: string } | null;
  grupo?: { id: string; nome: string } | null;
}

interface Filters {
  search?: string;
  source_id?: string;
  etapa_id?: string;
  consultor_id?: string;
  grupo_id?: string;
  semGrupo?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export function useArqoLeadsAdmin(filters: Filters = {}) {
  return useQuery({
    queryKey: ['arqo', 'leads-admin', filters],
    queryFn: async () => {
      let q = supabase
        .from('arqo_leads')
        .select(`
          id, cliente_id, etapa_id, source_id, consultor_id, grupo_id,
          created_at, fechado_em,
          cliente:seven_clientes(id, nome, telefone, email, nivel_cadastro),
          etapa:arqo_funil_etapas(id, nome, cor, categoria),
          source:arqo_lead_sources(id, nome),
          consultor:profiles!arqo_leads_consultor_id_fkey(id, full_name, email),
          grupo:arqo_grupos_atendimento(id, nome)
        `)
        .order('created_at', { ascending: false })
        .limit(2000);

      if (filters.source_id) q = q.eq('source_id', filters.source_id);
      if (filters.etapa_id) q = q.eq('etapa_id', filters.etapa_id);
      if (filters.consultor_id) q = q.eq('consultor_id', filters.consultor_id);
      if (filters.semGrupo) q = q.is('grupo_id', null);
      else if (filters.grupo_id) q = q.eq('grupo_id', filters.grupo_id);
      if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom);
      if (filters.dateTo) q = q.lte('created_at', filters.dateTo);

      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as unknown as ArqoLeadAdminRow[];

      if (filters.search) {
        const s = filters.search.toLowerCase();
        rows = rows.filter((r) =>
          r.cliente?.nome?.toLowerCase().includes(s) ||
          r.cliente?.telefone?.toLowerCase().includes(s) ||
          r.cliente?.email?.toLowerCase().includes(s),
        );
      }
      return rows;
    },
  });
}

export function useAssignGrupoLeadsBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, grupoId }: { ids: string[]; grupoId: string }) => {
      const { error } = await supabase
        .from('arqo_leads')
        .update({ grupo_id: grupoId })
        .in('id', ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['arqo'] });
      toast.success(`${count} lead(s) atribuído(s) ao grupo`);
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atribuir grupo'),
  });
}

export function useDeleteArqoLeadsBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, deleteClients }: { ids: string[]; deleteClients: boolean }) => {
      const { data, error } = await supabase.rpc('arqo_delete_leads_bulk' as any, {
        p_lead_ids: ids,
        p_delete_lead_clients: deleteClients,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['arqo'] });
      toast.success(`${count} lead(s) excluído(s) permanentemente`);
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao excluir'),
  });
}
