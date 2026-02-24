
# Corrigir filtro de Disponibilidade no Portal do Incorporador

## Problema

A pagina de Disponibilidade filtra empreendimentos apenas com status `"ativo"`, mas os empreendimentos vinculados ao usuario possuem status `"obra"`. Resultado: nenhum empreendimento aparece.

## Solucao

Remover o filtro de status na pagina `PortalIncorporadorDisponibilidade.tsx`. Todos os empreendimentos vinculados ao incorporador devem aparecer, independente do status (ativo, obra, lancamento, etc.). A vinculacao via `user_empreendimentos` ja garante que o incorporador so veja os seus.

## Alteracao

| Arquivo | O que muda |
|---|---|
| `src/pages/portal-incorporador/PortalIncorporadorDisponibilidade.tsx` | Remover o `.filter((emp) => emp.status === 'ativo')` e usar todos os empreendimentos retornados pelo hook |

## Detalhe tecnico

Linha 20-23 atual:
```typescript
const empreendimentosComMapa = empreendimentos.filter(
  (emp) => emp.status === 'ativo'
);
```

Sera substituido por:
```typescript
const empreendimentosComMapa = empreendimentos;
```

Alteracao de uma unica linha, sem impacto em outros componentes.
