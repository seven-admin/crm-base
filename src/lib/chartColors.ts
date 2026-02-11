// Paleta de cores padronizada para gráficos e dashboards
// Baseada nas referências visuais do usuário

export const CORES_DASHBOARD = {
  azul: '#3B82F6',
  rosa: '#EC4899',
  amarelo: '#F59E0B',
  ciano: '#06B6D4',
  verde: '#10B981',
  roxo: '#8B5CF6',
  laranja: '#F97316',
  cinza: '#6B7280',
  vermelho: '#EF4444',
  prata: '#94A3B8',
} as const;

// Array de cores para gráficos com múltiplas séries
export const CORES_ARRAY = [
  '#3B82F6', // Azul
  '#EC4899', // Rosa
  '#F59E0B', // Amarelo
  '#06B6D4', // Ciano
  '#10B981', // Verde
  '#8B5CF6', // Roxo
  '#F97316', // Laranja
] as const;

// Cores de status para KPIs e indicadores
export const CORES_STATUS = {
  sucesso: '#10B981',
  alerta: '#F59E0B',
  erro: '#EF4444',
  neutro: '#6B7280',
  info: '#3B82F6',
} as const;

// Cores para gráficos de temperatura (funil)
export const CORES_TEMPERATURA = {
  frio: '#3B82F6',
  morno: '#F59E0B',
  quente: '#EF4444',
} as const;

// Cores de ranking (1º, 2º, 3º...)
export const CORES_RANKING = [
  '#F59E0B', // Ouro
  '#94A3B8', // Prata
  '#F97316', // Bronze
  '#3B82F6', // 4º
  '#EC4899', // 5º
] as const;

// Cores para despesas/categorias
export const CORES_DESPESAS = [
  '#EC4899', // Rosa
  '#F59E0B', // Amarelo
  '#06B6D4', // Ciano
  '#8B5CF6', // Roxo
  '#10B981', // Verde
  '#F97316', // Laranja
] as const;

// Estilo padrão para tooltips dos gráficos
export const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontSize: 12,
} as const;

// Estilo padrão para cursor do tooltip
export const TOOLTIP_CURSOR_STYLE = {
  fill: 'hsl(var(--muted) / 0.3)',
} as const;

// Cores do Sidebar por categoria
export const CORES_SIDEBAR = {
  dashboard: '#3B82F6',       // Azul
  empreendimentos: '#10B981', // Verde
  clientes: '#8B5CF6',        // Roxo
  forecast: '#06B6D4',        // Ciano
  comercial: '#F97316',       // Laranja
  contratos: '#3B82F6',       // Azul
  financeiro: '#F59E0B',      // Amarelo
  parceiros: '#EC4899',       // Rosa
  marketing: '#EC4899',       // Rosa
  eventos: '#06B6D4',         // Ciano
  utilidades: '#6B7280',      // Cinza
  sistema: '#EF4444',         // Vermelho
} as const;
