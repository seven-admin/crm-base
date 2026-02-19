

# Ajustes: Numero reduzido e sombra leve nos cards

## 1. Reduzir numero em destaque no HeroCard

O valor "R$ 2.847.500" atualmente usa `fontSize: 72`. Reduzir 25% para `fontSize: 54`.

**Arquivo**: `src/components/design-test/TestHeroCard.tsx` (linha 74)

## 2. Adicionar sombra leve nos cards secundarios

Os cards transparentes (ProjectList, TeamCard, MetricsCard) atualmente nao possuem sombra. Adicionar uma sombra suave para dar leve profundidade, mantendo o fundo transparente.

Sombra: `boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)'`

**Arquivos afetados**:
- `src/components/design-test/TestProjectList.tsx` -- adicionar boxShadow e borderRadius ao container
- `src/components/design-test/TestTeamCard.tsx` -- adicionar boxShadow e borderRadius ao container
- `src/components/design-test/TestMetricsCard.tsx` -- adicionar boxShadow e borderRadius ao container

Os cards que ja possuem sombra (HeroCard, TableCard, DarkCard, Labels, Form) permanecem inalterados.

