

# Corrigir filtro do Portal de Empreendimentos

## Problema
O `PortalEmpreendimentos.tsx` filtra apenas empreendimentos com status `lancamento` ou `obra`, excluindo empreendimentos entregues ou com outros status. O correto é exibir **todos os empreendimentos ativos** (o hook `useEmpreendimentos` já filtra `is_active = true`).

## Alteração

**`src/pages/PortalEmpreendimentos.tsx` (linha 16)**

Remover o filtro de status:
```typescript
// De:
return empreendimentos?.filter(e => ['lancamento', 'obra'].includes(e.status)) || [];

// Para:
return empreendimentos || [];
```

## Sobre os build errors
Os erros de build são de tipos TypeScript em vários hooks (`useBonificacoes`, `useBriefings`, `useClientes`, `useComissoes`, `useContratos`, etc.) causados por propriedades extras de JOINs sendo passadas em `.update()` e `.insert()` do Supabase (tipo `RejectExcessProperties`). Esses erros são pré-existentes e não estão relacionados a esta alteração, mas posso corrigi-los em seguida se desejar.

