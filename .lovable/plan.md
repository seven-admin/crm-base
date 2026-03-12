

# Two Changes: PDF Report for Event Subscribers + Portal Incorporador Propostas Reorder

## 1. PDF Report — Event Subscribers List

Add a "Gerar PDF" button in `EventoInscritosTab.tsx` next to the "Adicionar" button. When clicked, generates a simple text-only PDF using `html2pdf.js` (already installed) containing:

- Event title as header
- Alphabetically sorted table with columns: Nome, Telefone, Imobiliária
- No images, clean minimal layout

**File**: `src/components/eventos/EventoInscritosTab.tsx`
- Add a `handleGerarPDF` function that builds an HTML string with the event name as title and a table of subscribers sorted by `nome_corretor` alphabetically
- Uses `html2pdf.js` to convert to PDF and download
- Add a "Gerar PDF" button in the header next to "Adicionar"

## 2. Portal Incorporador Propostas — Reorder + Collapsible Sections

Restructure `PortalIncorporadorPropostas.tsx`:

- Move all proposal sections (Aguardando Aprovação, Em Preparação, Recentes) **before** Negociações em Andamento
- Wrap each section in a `Collapsible` component (from `@radix-ui/react-collapsible`, already available) with a clickable header that toggles visibility
- Each section header shows the count badge and a chevron icon indicating open/closed state
- All sections start expanded by default

**File**: `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx`
- Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from UI components
- Add `ChevronDown` icon for toggle indicator
- Create a reusable `CollapsibleSection` wrapper component
- Reorder: Propostas Aguardando → Em Preparação → Recentes → Negociações em Andamento

