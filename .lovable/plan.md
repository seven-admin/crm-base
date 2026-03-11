

# Corrigir telefones ausentes no payload do webhook

## Problema
Campos `corretor_telefone`, `corretor_celular` e `gestor_telefone` não aparecem no payload porque valores `undefined` são removidos pelo `JSON.stringify`. O código faz `corretor_telefone: insertData.telefone` onde `telefone` é `undefined` quando o profile não tem phone.

## Solução

### 1. `src/hooks/useEventoInscricoes.ts` — Garantir `null` explícito em todos os campos
Alterar o payload do webhook para forçar `null` em vez de `undefined`:

```typescript
corretor_telefone: insertData.telefone || null,
corretor_celular: corretor_celular || null,
gestor_telefone: gestor_telefone || null,
```

### 2. `src/components/eventos/EventoInscritosTab.tsx` — Padronizar payload do reenvio admin
O `handleReenviar` usa nomes de campo diferentes (`nome_corretor`, `telefone`). Padronizar para os mesmos nomes que o portal envia:

```typescript
await dispararWebhook('evento_inscricao_corretor', {
  evento_id: eventoId,
  evento_nome: eventoNome,
  evento_data: eventoData,
  corretor_nome: insc.nome_corretor,
  corretor_telefone: insc.telefone || null,
  corretor_email: insc.email || null,
  corretor_celular: insc._celular_corretor || null,
  gestor_telefone: insc._gestor_telefone || null,
  imobiliaria: insc.imobiliaria_nome || null,
});
```

## Arquivos alterados
- `src/hooks/useEventoInscricoes.ts`
- `src/components/eventos/EventoInscritosTab.tsx`

