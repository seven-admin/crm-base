

# 3 Correções: Responsáveis, CRUD Inscritos, Webhook de Inscrição

## 1. Responsáveis no modal de edição — filtrar por funcionários Seven

**Problema**: A query em `EventoEditDialog.tsx` (linha 71-81) busca todos os profiles sem filtro, exibindo corretores e gestores de imobiliária.

**Solução**: Substituir a query inline pelo hook `useFuncionariosSeven()` que já filtra por `tipo_vinculo = 'funcionario_seven'` e `is_active = true`.

**Arquivo**: `src/components/eventos/EventoEditDialog.tsx`

---

## 2. CRUD completo na aba Inscritos

**Problema**: `EventoInscritosTab.tsx` é somente leitura.

**Solução**: Adicionar ao componente:
- **Adicionar inscrito manualmente** — botão que abre um dialog com formulário (nome, telefone, email, imobiliária)
- **Editar inscrito** — botão por linha que abre dialog de edição dos mesmos campos
- **Excluir inscrito** — botão com AlertDialog de confirmação, faz DELETE na tabela
- **Alternar status** — botão para confirmar/cancelar inscrição (UPDATE status)
- Todas as operações invalidam a query `evento-inscricoes-admin`

**Arquivo**: `src/components/eventos/EventoInscritosTab.tsx` (reescrever com CRUD)

---

## 3. Webhook de inscrição no catálogo

**Problema**: O evento `evento_inscricao_corretor` é disparado no código mas não aparece na lista `WEBHOOK_EVENTS`.

**Solução**: Adicionar entrada na lista de eventos ativos em `useWebhooks.ts`:
```
{ value: 'evento_inscricao_corretor', label: 'Inscrição em Evento (Corretor)' }
```

**Arquivo**: `src/hooks/useWebhooks.ts`

---

## Arquivos afetados
- `src/components/eventos/EventoEditDialog.tsx` — trocar query por `useFuncionariosSeven`
- `src/components/eventos/EventoInscritosTab.tsx` — CRUD completo
- `src/hooks/useWebhooks.ts` — adicionar evento ao catálogo

