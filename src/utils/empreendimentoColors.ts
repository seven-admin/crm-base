/**
 * Shared color palette for empreendimentos across Lista and Calendário views.
 */
export const EMPREENDIMENTO_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#14b8a6', '#6366f1',
];

/**
 * Returns a consistent color for a given empreendimento based on its position
 * among all known empreendimento IDs.
 */
export function getEmpreendimentoColor(id: string, allIds: string[]): string {
  const idx = allIds.indexOf(id);
  return EMPREENDIMENTO_COLORS[(idx >= 0 ? idx : 0) % EMPREENDIMENTO_COLORS.length];
}

/**
 * Converts a hex color to rgba string.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
