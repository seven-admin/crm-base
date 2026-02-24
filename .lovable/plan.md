
# Tornar o mapa somente leitura no Portal do Incorporador

## Problema

O componente `MapaInterativo` esta sendo renderizado sem a prop `readonly`, permitindo que incorporadores vejam o botao "Editar Mapa" e acessem funcoes de edicao.

## Solucao

Adicionar `readonly={true}` na chamada do componente na pagina do portal.

## Alteracao

| Arquivo | O que muda |
|---|---|
| `src/pages/portal-incorporador/PortalIncorporadorDisponibilidade.tsx` | Adicionar `readonly` na linha 59 |

**De:**
```typescript
<MapaInterativo empreendimentoId={empId} />
```

**Para:**
```typescript
<MapaInterativo empreendimentoId={empId} readonly />
```

Alteracao de uma unica linha. O componente `MapaInterativo` ja possui toda a logica de `readonly` implementada: oculta o botao "Editar Mapa" e, caso nao haja mapa configurado, exibe apenas uma mensagem informativa em vez do formulario de upload.
