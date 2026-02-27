
# Correcao: Negociacoes nao carregam + Propostas nao aparecem no Portal

## Problemas identificados

### Problema 1 - Erro 400 em TODAS as queries de negociacoes
A query `useNegociacoes` usa o join `gestor:profiles!gestor_id(id, full_name)`, mas a foreign key `negociacoes_gestor_id_fkey` aponta para `auth.users(id)` e nao para `profiles(id)`. O PostgREST nao consegue resolver esse caminho, retornando erro 400 em TODA listagem de negociacoes (kanban, portal, etc).

### Problema 2 - Proposta sem status
A negociacao criada tem `status_proposta = NULL`. O portal do incorporador filtra por `status_proposta = 'em_analise'`, entao mesmo corrigindo o erro 400, a proposta nao apareceria.

## Solucao

### 1. Migration: Alterar FK do gestor_id para apontar para profiles

```sql
ALTER TABLE public.negociacoes 
  DROP CONSTRAINT negociacoes_gestor_id_fkey;

ALTER TABLE public.negociacoes
  ADD CONSTRAINT negociacoes_gestor_id_fkey 
  FOREIGN KEY (gestor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
```

Isso permite que o PostgREST resolva `profiles!gestor_id` corretamente. Como `profiles.id` eh o mesmo UUID de `auth.users.id`, nao ha quebra de dados.

### 2. Corrigir queries de negociacoes (useNegociacoes.ts)

Existem multiplas queries que usam `gestor:profiles!gestor_id`. Apos a migration, elas passarao a funcionar sem alteracao de codigo. Porem, vou verificar se ha queries redundantes (useNegociacoesKanban, etc) e garantir consistencia.

### 3. Fluxo de status_proposta na criacao

Atualmente, ao criar uma negociacao, o `status_proposta` nao eh definido. Preciso verificar em que momento ele deveria ser setado para `em_analise`. Opcoes:
- Setar automaticamente ao criar a negociacao quando ela chega na etapa "Analise de Proposta"
- Ou, como solucao imediata, permitir que o portal mostre TODAS as negociacoes dos empreendimentos do incorporador (nao apenas as com status `em_analise`), e exibir o status de cada uma

A abordagem mais correta: quando a negociacao for movida para a etapa "Analise de Proposta" (`ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35`), setar automaticamente `status_proposta = 'em_analise'`. Isso sera feito no hook `useMoverNegociacao`.

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | Alterar FK gestor_id de auth.users para profiles |
| `src/hooks/useNegociacoes.ts` | No `useMoverNegociacao`, setar `status_proposta = 'em_analise'` quando etapa destino for "Analise de Proposta" |

## Resultado esperado
- Todas as queries de negociacoes voltam a funcionar (kanban, listagem, portal)
- Ao mover negociacao para "Analise de Proposta", ela aparece automaticamente no portal do incorporador
