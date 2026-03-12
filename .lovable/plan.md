

# Visibilidade do Portal Incorporador — Configuração Dinâmica nas Etapas

## Problema
O portal do incorporador usa IDs de etapas hardcoded para filtrar negociações visíveis. Se os IDs não correspondem ao ambiente real, nada aparece. Além disso, não há como configurar quais etapas o incorporador deve ver.

## Solução
Adicionar um flag `visivel_incorporador` na tabela `funil_etapas` e torná-lo configurável no editor de etapas (Configurações Comerciais). O portal passará a consultar esse flag dinamicamente.

## Alterações

### 1. Migration: adicionar coluna `visivel_incorporador`
```sql
ALTER TABLE public.funil_etapas 
ADD COLUMN visivel_incorporador boolean NOT NULL DEFAULT false;
```

### 2. `src/components/negociacoes/EtapasEditor.tsx`
- Adicionar um botão toggle (ícone `Eye`) em cada etapa, ao lado dos flags existentes (Inicial, Sucesso, Perda)
- Ao clicar, faz `updateMutation` com `{ visivel_incorporador: !etapa.visivel_incorporador }`
- Legenda: adicionar "Visível Incorporador"

### 3. `src/types/funis.types.ts`
- Garantir que `FunilEtapa` inclua `visivel_incorporador: boolean`

### 4. `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx`
- Remover constantes hardcoded `ETAPA_NEGOCIACAO` e `ETAPA_RETORNO_INCORPORADOR`
- Buscar etapas do funil com `visivel_incorporador = true` via query
- Filtrar `negociacoesEmAndamento` usando os IDs retornados dinamicamente

### Arquivos
- **Migration**: nova coluna em `funil_etapas`
- **Editar**: `EtapasEditor.tsx`, `PortalIncorporadorPropostas.tsx`, `funis.types.ts`

