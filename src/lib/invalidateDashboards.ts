import { QueryClient } from '@tanstack/react-query';

/**
 * Helper centralizado para invalidar todas as queries de dashboard e forecast.
 * Deve ser chamado após mutations que impactam KPIs, vendas, atividades, clientes, etc.
 */
export function invalidateDashboards(queryClient: QueryClient) {
  // Dashboard Geral
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['vendas-por-mes'] });
  queryClient.invalidateQueries({ queryKey: ['performance-corretores'] });
  queryClient.invalidateQueries({ queryKey: ['vendas-por-empreendimento'] });
  queryClient.invalidateQueries({ queryKey: ['unidades-stats'] });
  
  // Dashboard Executivo
  queryClient.invalidateQueries({ queryKey: ['dashboard-executivo'] });
  
  // Forecast
  queryClient.invalidateQueries({ queryKey: ['forecast'] });
  
  // Contratos Stats
  queryClient.invalidateQueries({ queryKey: ['contratos-stats'] });
  
  // Clientes Stats
  queryClient.invalidateQueries({ queryKey: ['clientes-stats'] });
}
