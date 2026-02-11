export interface TVLayoutItem {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  size: 'full' | 'half' | 'third' | 'quarter' | 'two-thirds';
  type: 'kpi' | 'chart' | 'list' | 'ranking';
}

export interface TVLayoutConfig {
  dashboardId: 'executivo' | 'forecast';
  items: TVLayoutItem[];
  updatedAt: string;
}

export const DEFAULT_EXECUTIVO_LAYOUT: TVLayoutItem[] = [
  { id: 'kpis', title: 'KPIs Principais', visible: true, order: 0, size: 'full', type: 'kpi' },
  { id: 'vendas-trend', title: 'Evolução de Vendas', visible: true, order: 1, size: 'half', type: 'chart' },
  { id: 'pipeline', title: 'Pipeline Comercial', visible: true, order: 2, size: 'half', type: 'chart' },
  { id: 'unidades-donut', title: 'Distribuição de Unidades', visible: true, order: 3, size: 'third', type: 'chart' },
  { id: 'ranking-corretores', title: 'Ranking de Corretores', visible: true, order: 4, size: 'two-thirds', type: 'ranking' },
];

export const DEFAULT_FORECAST_LAYOUT: TVLayoutItem[] = [
  { id: 'kpis', title: 'KPIs Atividades', visible: true, order: 0, size: 'full', type: 'kpi' },
  { id: 'atendimentos-resumo', title: 'Novos x Retornos', visible: true, order: 1, size: 'full', type: 'kpi' },
  { id: 'funil-temperatura', title: 'Funil de Temperatura', visible: true, order: 2, size: 'half', type: 'chart' },
  { id: 'atividades-tipo', title: 'Atividades por Tipo', visible: true, order: 3, size: 'half', type: 'list' },
  { id: 'proximas-atividades', title: 'Próximas Atividades', visible: true, order: 4, size: 'half', type: 'list' },
  { id: 'ranking-corretores', title: 'Ranking de Corretores', visible: true, order: 5, size: 'half', type: 'ranking' },
];
