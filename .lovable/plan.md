
# Separar a Listagem de Atividades entre Comercial e Diario de Bordo

## Problema atual

A pagina `/atividades` aparece no menu "Diario de Bordo" mas mostra **todos** os tipos de atividade, incluindo os do Forecast. O usuario quer separacao completa.

## Solucao

Usar um parametro de contexto na URL para que a mesma pagina filtre automaticamente os tipos corretos:

- **Comercial** -> `/atividades?contexto=forecast` (mostra apenas Atendimento, Fechamento, Assinatura)
- **Diario de Bordo** -> `/atividades?contexto=diario` (mostra apenas Ligacao, Meeting, Reuniao, Acompanhamento, Treinamento, Visita, Staff Seven)

## Alteracoes

### 1. Sidebar (`src/components/layout/Sidebar.tsx`)

Adicionar item "Atividades" dentro do grupo Comercial e ajustar o path do item no Diario de Bordo:

```text
Comercial (laranja)
  |-- Fichas de Proposta     /negociacoes
  |-- Solicitacoes           /solicitacoes (adminOnly)
  |-- Forecast               /forecast
  |-- Metas Comerciais       /metas-comerciais
  |-- Atividades             /atividades?contexto=forecast

Diario de Bordo (cyan)
  |-- Dashboard              /diario-bordo
  |-- Atividades             /atividades?contexto=diario
```

### 2. Pagina Atividades (`src/pages/Atividades.tsx`)

- Ler o parametro `contexto` da URL (`useSearchParams`)
- Se `contexto=forecast`: filtrar tipos para `TIPOS_FORECAST`, titulo "Atividades Comerciais"
- Se `contexto=diario`: filtrar tipos para `TIPOS_DIARIO`, titulo "Atividades - Diario de Bordo"
- Se sem contexto (acesso direto): mostrar todos os tipos (fallback administrativo)
- Aplicar filtro de tipos no hook `useAtividades` (adicionar `.in('tipo', tiposFilter)` quando tiposFilter presente)
- Filtrar o dropdown de tipos nos filtros para mostrar apenas os tipos do contexto
- Passar `tiposPermitidos` ao `AtividadeForm` no dialog de nova atividade

### 3. Hook useAtividades (`src/hooks/useAtividades.ts`)

- O `AtividadeFilters` ja tem campo `tipo` para filtro individual
- Adicionar campo `tipos?: AtividadeTipo[]` no `AtividadeFilters` para filtrar por multiplos tipos
- Na query, quando `tipos` estiver presente, adicionar `.in('tipo', tipos)`

## Arquivos afetados

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/Sidebar.tsx` | Adicionar "Atividades" no grupo Comercial, ajustar path no Diario |
| `src/pages/Atividades.tsx` | Ler `contexto` da URL, filtrar tipos, titulo dinamico, passar `tiposPermitidos` ao form |
| `src/hooks/useAtividades.ts` | Suportar filtro `tipos: AtividadeTipo[]` no `AtividadeFilters` |
| `src/types/atividades.types.ts` | Adicionar `tipos?: AtividadeTipo[]` na interface `AtividadeFilters` |

## Resultado final

- Ao clicar em "Atividades" dentro de **Comercial**: ve apenas atividades de Atendimento, Fechamento e Assinatura, e so pode criar esses tipos
- Ao clicar em "Atividades" dentro de **Diario de Bordo**: ve apenas atividades operacionais, e so pode criar esses tipos
- Separacao completa desde a criacao ate a visualizacao
