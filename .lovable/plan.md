

# Plan: Fix Calendar Day Number Alignment and Clean Layout

## Problem
The multi-day bars (absolute overlay) visually overlap or misalign with day numbers. The user wants day numbers to always be clean and visible, with no bars covering them.

## Root Cause
The overlay bars use `BAR_TOP_OFFSET = 24px` which can collide with day numbers, especially when the grid gap and cell padding create slight misalignments. Additionally, the spacer div inside cells creates inconsistent vertical positioning of content across days.

## Changes — `src/components/planejamento/PlanejamentoCalendario.tsx`

1. **Increase `BAR_TOP_OFFSET`** to ~28px to give more breathing room below the day number row.

2. **Standardize cell internal layout**: Always reserve the same top space in every cell (even cells with no multi-day bars), so day numbers and single-day chips are consistently positioned across all cells. Replace the conditional spacer with a fixed-height top zone:
   - Top zone (day number): fixed height (~28px)
   - Multi-day bar zone: fixed height for up to `MAX_MULTI_DAY_VISIBLE` slots (~40px), always present
   - Single-day items: remaining space below

3. **Increase cell height** from `h-24` (96px) to `h-28` (112px) to accommodate the consistent zones without clipping content.

4. **Update overlay math** to match the new constants (`CELL_HEIGHT`, `BAR_TOP_OFFSET`).

## Result
Every day cell will have the same internal layout regardless of content, eliminating visual misalignment between days.

