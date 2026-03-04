

# Renomeações: Placeholder, Sidebar e Títulos de Página

## Alterações

### 1. Placeholder "PENDENTE" → "PE"
**Arquivo:** `src/hooks/useAtividades.ts`
- Linha 239: `PENDENTE - ${data.titulo}` → `PE - ${data.titulo}`
- Linha 429: `PENDENTE - ${(result as any).titulo}` → `PE - ${(result as any).titulo}`

### 2. Sidebar: Renomear itens do grupo Comercial
**Arquivo:** `src/components/layout/Sidebar.tsx`
- Linha 95: `label: 'Forecast'` → `label: 'Resumo'`
- Linha 96: `label: 'Negociações'` → `label: 'Forecast'`

### 3. Títulos das páginas
**Arquivo:** `src/pages/Forecast.tsx`
- Linha 149: `<h1>Forecast</h1>` → `<h1>Resumo</h1>`
- Linha 150: subtítulo permanece ou ajusta para "Resumo de vendas e indicadores comerciais"

**Arquivo:** `src/pages/Negociacoes.tsx`
- Linha 133: `title="Negociações"` → `title="Forecast"`
- Linha 134: subtítulo ajustado para "Gerencie seu forecast e propostas comerciais"

### 4. Portal Incorporador (route titles)
**Arquivo:** `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`
- Linha 17: `title: 'Forecast'` → `title: 'Resumo'` (se aplicável ao portal)

Todas as alterações são puramente de label/texto, sem impacto em lógica ou rotas.

