
# Inverter Ordem dos Cards — Marketing Portal do Incorporador

## Arquivo: `src/pages/portal-incorporador/PortalIncorporadorMarketing.tsx`

## O que será feito

Apenas trocar a posição dos dois blocos no JSX, mantendo todo o código interno de cada um intacto:

### Ordem atual

```text
1. KPIs (4 cards de métricas)
2. Gráficos (Tickets por Etapa / Por Categoria)
3. Próximas Entregas (linhas ~413–456)
4. Lista completa de tickets (linhas ~458–fim)
```

### Ordem após a alteração

```text
1. KPIs (4 cards de métricas)   ← sem alteração
2. Gráficos                     ← sem alteração
3. Lista completa de tickets    ← sobe
4. Próximas Entregas            ← desce
```

## Mudança técnica

- Recortar o bloco `{/* Lista completa de tickets */}` (linhas ~458 até o segundo bloco de fechamento) e colocá-lo **antes** do bloco `{/* Próximas Entregas */}`.
- Nenhuma lógica, dado ou estilo é alterado — somente a ordem dos elementos no retorno JSX.

## Impacto

Apenas o arquivo `PortalIncorporadorMarketing.tsx`. Nenhum outro arquivo é tocado.
