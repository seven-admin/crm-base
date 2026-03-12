

# PDF Report: Font 8px, Monospace, Replace Telefone with Celular

**File**: `src/components/eventos/EventoInscritosTab.tsx` — lines 204-231

**Changes to `handleGerarPDF`**:
- Font-family → `'Courier New', monospace`
- Font size → `8px` (table), `10px` (title/count)
- Remove "Telefone" column, replace with "Celular" using `_celular_corretor` field
- Final columns: **Nome | Celular | Imobiliária**

