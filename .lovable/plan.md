

# Corrigir dois problemas: acesso a empreendimentos + erro ao fechar proposta

## Problema 1 — Corretores antigos não veem empreendimentos novos
A função `user_has_empreendimento_access` já inclui `has_role('corretor')`, então a RLS deveria permitir acesso. O problema pode estar na policy de UPDATE da tabela `corretores` que usa comparação por email (`profiles.email = corretores.email`), ou no detalhe do portal que depende da lista carregada.

**Ação**: `PortalEmpreendimentoDetalhe.tsx` busca o empreendimento filtrando a lista carregada (`empreendimentos?.find()`). Se a lista falhar silenciosamente, o detalhe não aparece. Adicionar uma query direta por ID como fallback.

## Problema 2 — Erro RLS ao atualizar/fechar proposta
A policy `"Corretores can update own negociacoes"` usa:
```sql
corretor_id IN (
  SELECT c.id FROM corretores c
  JOIN profiles p ON p.email = c.email
  WHERE p.id = auth.uid()
)
```
Isso é frágil — se o email do perfil e do corretor diferirem (case, espaço, etc.), a comparação falha. Deve usar `c.user_id = auth.uid()` diretamente.

Além disso, várias mutations de UPDATE (enviar, aceitar, recusar, converter) não incluem `updated_by`, o que não causa o erro diretamente mas é uma inconsistência.

## Solução

### 1. Migration SQL — Corrigir RLS de UPDATE em `negociacoes`

Recriar a policy de corretores para usar `user_id` em vez de `email`:

```sql
DROP POLICY IF EXISTS "Corretores can update own negociacoes" ON negociacoes;
CREATE POLICY "Corretores can update own negociacoes"
ON negociacoes FOR UPDATE TO authenticated
USING (
  corretor_id IN (
    SELECT c.id FROM corretores c
    WHERE c.user_id = auth.uid()
  )
);
```

Verificar e corrigir as mesmas policies baseadas em email em tabelas relacionadas (`negociacao_unidades`, `negociacao_condicoes_pagamento`, etc.).

### 2. `src/hooks/useNegociacoes.ts` — Adicionar `updated_by` nas mutations críticas

Em todas as mutations de UPDATE que alteram `status_proposta`, incluir `updated_by: currentUser?.id`:
- `useEnviarProposta` (linha 449)
- `useAprovarPropostaIncorporador` (linha 479)
- `useAceitarProposta` (linha 759)
- `useRecusarProposta` (linha 786)
- `useConverterProposta` (linha 975)
- `useMoverNegociacao` (linha 1246)
- `useEditarNegociacao` (linha 1389)

Para cada uma, obter o user com `supabase.auth.getUser()` e adicionar ao update.

### 3. `src/pages/PortalEmpreendimentoDetalhe.tsx` — Fallback de busca direta

Adicionar query individual `useQuery` para buscar o empreendimento por ID caso a lista geral não o contenha, evitando tela em branco para corretores com acesso parcial.

### Arquivos a modificar
- **Migration SQL** (policies de UPDATE em `negociacoes` e tabelas relacionadas)
- `src/hooks/useNegociacoes.ts`
- `src/pages/PortalEmpreendimentoDetalhe.tsx`

