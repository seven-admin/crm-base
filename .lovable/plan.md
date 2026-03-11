

# Incluir celular do corretor no payload do webhook de inscritos

## Problema

O payload do webhook `evento_inscricao_corretor` no reenvio (admin) e na inscrição (portal) não inclui o campo `whatsapp`/celular cadastrado na tabela `corretores`. O `telefone` armazenado em `evento_inscricoes` vem do `profile.phone`, que pode estar vazio ou ser diferente do celular/whatsapp do corretor.

## Solução

### 1. `src/components/eventos/EventoInscritosTab.tsx` — Reenvio admin

Alterar a query para fazer join com `corretores` via `corretor_id` (quando existir), trazendo o campo `whatsapp` e `telefone` do corretor. Incluir esses dados no payload do webhook:

```typescript
// Query: join com corretores
.select('*, corretor:corretores(telefone, whatsapp)')

// Payload do webhook:
await dispararWebhook('evento_inscricao_corretor', {
  ...dados_atuais,
  corretor_celular: insc.corretor?.whatsapp || insc.corretor?.telefone || null,
});
```

### 2. `src/hooks/useEventoInscricoes.ts` — Inscrição via portal

Receber `corretor_celular` como parâmetro opcional e incluí-lo no payload do webhook.

### 3. `src/pages/portal/PortalEventos.tsx` — Passar celular na inscrição

Passar `corretor?.whatsapp || corretor?.telefone` ao chamar `inscrever.mutate`.

## Arquivos alterados
- `src/components/eventos/EventoInscritosTab.tsx`
- `src/hooks/useEventoInscricoes.ts`
- `src/pages/portal/PortalEventos.tsx`

