

# Two Changes: Allow Proposals Below Property Value + Image Upload for Dação

## 1. Allow Saving Proposals Below 100% of Property Value

Currently, saving a proposal requires `percentualConfigurado >= 99.9` (payment conditions must total 100% of unit value). The change removes this as a blocking requirement while keeping the visual alerts.

### Files to Change

**`src/pages/NovaPropostaComercial.tsx`**
- Remove `percentualConfigurado >= 99.9` from `canSave` — require only client, empreendimento, and units
- Remove the `percentualConfigurado < 99.9` early return in `handleSave` that blocks saving
- Keep the existing progress bar and alert visuals untouched (they already show warnings when below 100%)

**`src/components/negociacoes/LocalCondicoesPagamentoEditor.tsx`**
- The `Math.min(..., 100)` cap on percentual currently hides when conditions exceed 100%. Remove the cap so the UI accurately shows values above 100% as well (e.g., 120% would show in red)
- The existing alert for `diferencaCents !== 0` already covers both under and over — no changes needed there

**`src/components/negociacoes/NegociacaoCondicoesPagamentoInlineEditor.tsx`**
- Same `Math.min(..., 100)` cap removal for accurate display above 100%

No changes needed in `PropostaDialog.tsx` — `handleGerarProposta` already has no percentage validation.

## 2. Image Upload for Dação (Car/Property Trade-in)

Add a section in the proposal creation flow for uploading images when the negotiation involves a trade-in (dação) of a car or property.

### Database Changes (Migration)

Create a new table `negociacao_dacao_anexos`:
```sql
CREATE TABLE public.negociacao_dacao_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  tipo_dacao TEXT NOT NULL DEFAULT 'outro', -- 'carro', 'imovel', 'outro'
  descricao TEXT,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.negociacao_dacao_anexos ENABLE ROW LEVEL SECURITY;
```

With RLS policies for authenticated users to CRUD their own records and view all within accessible negotiations.

### Storage

Create a new public storage bucket `negociacao-dacao` for the uploaded images.

### Frontend Changes

**New component: `src/components/negociacoes/DacaoAnexosCard.tsx`**
- A card with title "Dação em Pagamento (Imagens)"
- Toggle or checkbox: "Esta negociação envolve dação?" — when enabled, shows upload area
- Dropdown to select type: Carro, Imóvel, Outro
- Text field for description
- File upload area (images only: jpg, png, webp) with drag-and-drop
- Thumbnail gallery of uploaded images with delete option
- Uses Supabase Storage to upload to `negociacao-dacao` bucket

**`src/pages/NovaPropostaComercial.tsx`**
- Add `DacaoAnexosCard` in the left column (below ResponsaveisCard)
- Pass `negociacaoId` (only available after save in edit mode; for new proposals, upload after initial save)

**`src/components/negociacoes/PropostaDialog.tsx`**
- Add a "Dação" tab showing uploaded images for the negotiation (read-only in view mode, editable otherwise)

