import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  tableName?: string;
  page?: number;
  pageSize?: number;
}

export const ACTION_LABELS: Record<string, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  login: 'Login',
  logout: 'Logout',
  insert: 'Criação',
};

export const TABLE_LABELS: Record<string, string> = {
  profiles: 'Perfis',
  user_roles: 'Roles de Usuários',
  empreendimentos: 'Empreendimentos',
  unidades: 'Unidades',
  tipologias: 'Tipologias',
  blocos: 'Blocos',
  propostas: 'Propostas',
  proposta_unidades: 'Unidades de Propostas',
  contratos: 'Contratos',
  contrato_unidades: 'Unidades de Contratos',
  negociacoes: 'Negociações',
  negociacao_unidades: 'Unidades de Negociações',
  comissoes: 'Comissões',
  comissao_parcelas: 'Parcelas de Comissões',
  clientes: 'Clientes',
  corretores: 'Corretores',
  imobiliarias: 'Imobiliárias',
  funis: 'Pipelines de Negociação',
  funil_etapas: 'Etapas de Pipeline',
  configuracao_comercial: 'Config. Comercial',
  configuracao_comissoes: 'Config. Comissões',
  reservas_temporarias: 'Reservas',
  contrato_templates: 'Templates de Contrato',
  contrato_versoes: 'Versões de Contrato',
  contrato_documentos: 'Documentos de Contrato',
  contrato_pendencias: 'Pendências de Contrato',
  empreendimento_documentos: 'Docs. de Empreendimento',
  empreendimento_midias: 'Mídias de Empreendimento',
  modules: 'Módulos',
  role_permissions: 'Permissões',
};

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { startDate, endDate, userId, action, tableName, page = 1, pageSize = 20 } = filters;

  return useQuery({
    queryKey: ['audit-logs', startDate?.toISOString(), endDate?.toISOString(), userId, action, tableName, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        logs: data?.map((log) => ({
          ...log,
          actionLabel: ACTION_LABELS[log.action] || log.action,
          tableLabel: TABLE_LABELS[log.table_name] || log.table_name,
        })) || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
}

// Estatísticas de auditoria
export function useAuditStats() {
  return useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      // Contagem por ação
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('action, table_name, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      const byAction: Record<string, number> = {};
      const byTable: Record<string, number> = {};
      let todayCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      logs?.forEach((log) => {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
        byTable[log.table_name] = (byTable[log.table_name] || 0) + 1;

        const logDate = new Date(log.created_at);
        if (logDate >= today) {
          todayCount++;
        }
      });

      return {
        total: logs?.length || 0,
        today: todayCount,
        byAction: Object.entries(byAction).map(([action, count]) => ({
          action,
          label: ACTION_LABELS[action] || action,
          count,
        })),
        byTable: Object.entries(byTable)
          .map(([table, count]) => ({
            table,
            label: TABLE_LABELS[table] || table,
            count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      };
    },
  });
}

// Lista de tabelas disponíveis para filtro
export function getAvailableTables() {
  return Object.entries(TABLE_LABELS).map(([value, label]) => ({ value, label }));
}

// Lista de ações disponíveis para filtro
export function getAvailableActions() {
  return Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));
}
