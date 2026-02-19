
# Correção do Bug: COMPRADOR HISTÓRICO (PRÉ-SISTEMA) duplicado

## Causa Raiz

Dois problemas simultâneos causam a duplicação:

**Problema 1 — Constante com case errado no frontend (`useVendaHistorica.ts`)**

```ts
// ATUAL (errado): texto misto
const CLIENTE_HISTORICO_NOME = 'Comprador Histórico (Pré-Sistema)';

// A busca compara exatamente com esse texto:
.eq('nome', CLIENTE_HISTORICO_NOME) // → não encontra no banco

// No banco, o trigger uppercase_clientes() converte para:
// 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)'
// Logo, .eq() nunca encontra → cria um novo registro a cada venda histórica
```

**Problema 2 — Filtro de exclusão incorreto no `useClientesSelect.ts`**

```ts
// ATUAL (errado): sem acentos
.neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)')
// O nome real no banco é: 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)'
// Como não bate exatamente, o cliente vaza para as listas de seleção
```

## Situação dos Registros Duplicados no Banco

```text
Empreendimento JD. IGUATEMI (5b01d2c4):
  ├── ID: 37e1... (criado 05/02 11:52) → 0 negociações, 1 contrato  ← MANTER
  └── ID: bf70... (criado 05/02 11:54) → 0 negociações, 1 contrato  ← CONSOLIDAR e APAGAR

Empreendimento BELVEDERE (42157c74):
  ├── ID: 1108... (criado 05/02 13:15) → 0 negociações, 1 contrato  ← MANTER
  └── ID: 336b... (criado 05/02 21:30) → 0 negociações, 1 contrato  ← CONSOLIDAR e APAGAR

Empreendimento 156f9324:
  └── ID: 6447... (criado 09/02 19:48) → 0 negociações, 1 contrato  ← OK
```

## Solução

### Parte 1 — Limpeza do banco (SQL Migration)

Consolidar os registros duplicados reassociando os contratos para o mais antigo e depois deletando os duplicados:

```sql
-- JD. IGUATEMI: reassociar contrato do duplicado para o mais antigo, depois deletar
UPDATE public.contratos
SET cliente_id = '37e13872-519b-4dce-b00a-7c375b573bde'
WHERE cliente_id = 'bf704830-1aa0-4025-9cf6-0c6edd62039f';

DELETE FROM public.clientes 
WHERE id = 'bf704830-1aa0-4025-9cf6-0c6edd62039f';

-- BELVEDERE: mesma coisa
UPDATE public.contratos
SET cliente_id = '1108a037-7aaa-4860-8ccb-740c757a5426'
WHERE cliente_id = '336b2481-bfe3-4aea-8530-d8fe7cd0c146';

DELETE FROM public.clientes 
WHERE id = '336b2481-bfe3-4aea-8530-d8fe7cd0c146';
```

Além disso, remover o campo `empreendimento_id` do cliente histórico — ele é genérico e não deve ficar vinculado a um empreendimento específico, o que garante que um único registro por nome sirva para todos:

```sql
UPDATE public.clientes
SET empreendimento_id = NULL
WHERE nome = 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)';
```

### Parte 2 — Correção do frontend (`useVendaHistorica.ts`)

Alterar a constante para o texto em UPPERCASE exato como o banco armazena, e usar `ilike` para a busca (à prova de futuras variações):

```ts
// Antes:
const CLIENTE_HISTORICO_NOME = 'Comprador Histórico (Pré-Sistema)';
.eq('nome', CLIENTE_HISTORICO_NOME)

// Depois:
const CLIENTE_HISTORICO_NOME = 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)';
// Busca com ilike para ser case-insensitive
.ilike('nome', CLIENTE_HISTORICO_NOME)
```

Também remover o `empreendimento_id` do INSERT do cliente histórico, já que ele deve ser um registro global reutilizável:

```ts
// Remover empreendimento_id: empreendimentoId do insert
```

### Parte 3 — Correção do filtro de exclusão (`useClientesSelect.ts`)

Corrigir o texto do filtro para incluir os acentos corretos:

```ts
// Antes (sem acentos — não filtra):
.neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)')

// Depois (com acentos corretos):
.ilike('nome', 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)')
// Como ilike não funciona com neq, usar filter:
.not('nome', 'ilike', 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)')
```

## Arquivos Alterados

- `supabase/migrations/...` — Consolida os 2 duplicados e limpa `empreendimento_id`
- `src/hooks/useVendaHistorica.ts` — Corrige a constante de nome e a busca
- `src/hooks/useClientesSelect.ts` — Corrige o filtro de exclusão com acentos

## Impacto

- Elimina a criação de novos duplicados a partir de agora
- Consolida os 2 registros duplicados existentes sem perda de dados (contratos são reassociados)
- O cliente histórico passa a ser verdadeiramente global (sem `empreendimento_id`), permitindo reutilização correta
