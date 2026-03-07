/**
 * Shared color palette for empreendimentos across Lista and Calendário views.
 * Colors are defined in HSL format for design-system compatibility.
 */
export const EMPREENDIMENTO_COLORS = [
  'hsl(213 88% 58%)',
  'hsl(145 63% 42%)',
  'hsl(36 92% 52%)',
  'hsl(262 83% 64%)',
  'hsl(332 82% 60%)',
  'hsl(191 90% 44%)',
  'hsl(22 93% 54%)',
  'hsl(83 79% 45%)',
  'hsl(172 73% 40%)',
  'hsl(239 84% 67%)',
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
 * Adds alpha transparency to hsl(...) or hex colors.
 */
export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('hsl(') && color.endsWith(')')) {
    return color.replace(/^hsl\((.*)\)$/u, `hsl($1 / ${alpha})`);
  }

  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
}
