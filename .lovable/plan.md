

# Plan: Improve Empreendimento Identification and Fix Layout Issues

## Context
The user wants:
1. **Empreendimento identification** in the Lista and Calendário views to be visually clearer, with corresponding colors
2. **Collapsible empreendimento groups** (already implemented in Lista via `collapsedGroups` state — but needs visual improvement)
3. **Fix layout mess** — the current rendering has visual issues

## What Will Change

### 1. Assign Consistent Colors to Empreendimentos
The `EMPREENDIMENTO_COLORS` palette already exists in `PlanejamentoCalendario.tsx`. We will extract it to a shared utility and use it consistently across both Lista and Calendário views.

### 2. PlanejamentoListaGlobal.tsx — Visually Distinct Group Headers
Currently, group headers for empreendimentos show plain text with `bg-muted/30`. We will:
- Add a **colored left border** (4px) on the group header row using the empreendimento's assigned color
- Add a **small colored dot** next to the empreendimento name (already exists for fases with `group.color`, but missing for empreendimentos since the `grouped` map does not assign a color when grouping by empreendimento)
- Fix the `grouped` useMemo to also assign colors to empreendimento groups using the shared color palette
- Use `Collapsible` from Radix (already available) or keep the existing `collapsedGroups` toggle (which already works) — just make the collapse affordance more obvious with a styled chevron and smooth animation

### 3. PlanejamentoCalendario.tsx — Clearer Legend and Bar Labels
- The legend at the bottom already shows empreendimento colors — ensure it stays in sync
- No major changes needed here beyond shared color utility

### 4. Fix Layout Issues
- Review and fix column span counts in the Lista table (the `colSpan` values need to match actual column counts)
- Ensure the "Add task" row and empty state row use correct `colSpan`

## Files to Modify

1. **New: `src/utils/empreendimentoColors.ts`** — Shared color palette and helper function `getEmpreendimentoColor(id, allIds)`
2. **`src/components/planejamento/PlanejamentoListaGlobal.tsx`**:
   - Import shared color utility
   - Update `grouped` useMemo to assign colors to empreendimento groups
   - Restyle group header rows with colored left border, dot, and better contrast
   - Add smooth collapse animation using CSS transitions
3. **`src/components/planejamento/PlanejamentoCalendario.tsx`**:
   - Import shared color utility instead of inline `EMPREENDIMENTO_COLORS`

