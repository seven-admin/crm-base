

# Fix: Negociações não criadas para atividades sem cliente (Gestor Michel)

## Diagnóstico

O gestor **Michel** possui 9 atividades do tipo `atendimento` em fevereiro, **todas sem `cliente_id`**. A lógica de auto-criação de negociação (`useCreateAtividade`, linha 236) exige `cliente_id` para criar a negociação:

```
if (etapaInicial && data.cliente_id) { ... }
```

Como `cliente_id` é `NULL` nas 9 atividades, nenhuma negociação foi criada, e o Kanban fica vazio para Michel em fevereiro.

Além disso, a coluna `cliente_id` na tabela `negociacoes` é `NOT NULL`, então não é possível inserir sem um cliente.

## Solução: Placeholder Client

Conforme escolhido, criar um cliente placeholder automaticamente quando a atividade comercial não tiver cliente vinculado.

### 1. Alterar lógica de auto-criação de negociação

**Arquivo:** `src/hooks/useAtividades.ts`

Na função `useCreateAtividade` (e `useUpdateAtividade`), antes do check de `cliente_id`:
- Se `cliente_id` for null e o tipo for comercial, criar um cliente placeholder com nome `"PENDENTE - [titulo da atividade]"` e temperatura `frio`
- Usar o `cliente_id` criado para prosseguir com a criação da negociação
- Vincular o `cliente_id` de volta na atividade (update)

### 2. Corrigir as 9 atividades existentes (retroativo)

Usar o insert tool do Supabase para:
- Criar 9 clientes placeholder (um por atividade, com nome derivado do título)
- Vincular cada cliente à atividade (`update atividades set cliente_id = ...`)
- Criar as 9 negociações na etapa inicial (Atendimento) com `gestor_id = Michel`, `empreendimento_id = VITHORIA DO SOL`

### 3. Resultado esperado

Após a correção:
- Michel terá 9 negociações na etapa "Atendimento" do Kanban em `/negociacoes`
- Futuras atividades comerciais sem cliente terão placeholder criado automaticamente
- O placeholder pode ser editado depois com os dados reais do cliente

