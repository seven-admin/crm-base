
# Validacao de Dados do Cliente ao Converter Atividade em Proposta

## Resumo

Interceptar o fluxo de "Converter em Proposta" para verificar se o cliente vinculado a atividade possui todos os dados obrigatorios para emissao de contrato. Se incompleto, exibir o `ValidarDadosLeadDialog` ja existente. Se completo (ou sem cliente), seguir normalmente.

## Alteracoes

### 1. `src/components/atividades/AtividadeKanbanCard.tsx`

- Importar `ValidarDadosLeadDialog` e `useCliente`
- Adicionar estado `showValidacao` (boolean)
- No `handleConverterProposta`: se `atividade.cliente_id` existe, buscar dados completos do cliente e abrir o dialog de validacao em vez de navegar direto
- Se validacao passa (onComplete), navegar para proposta normalmente
- Se dados incompletos, botao "Completar Dados" navega para `/clientes` com o cliente selecionado para edicao (ou abre o formulario de edicao inline)

### 2. `src/pages/Atividades.tsx`

- Mesmo padrao: no botao "Converter em Proposta" da tabela (linha ~814-831), interceptar com validacao
- Adicionar estado para controlar qual atividade esta sendo validada
- Usar `useCliente` para buscar dados quando o usuario clica em converter

### 3. Fluxo de validacao

```text
Usuario clica "Converter em Proposta"
  |
  +-- Atividade tem cliente_id?
  |     |
  |     +-- NAO: Navega direto para /negociacoes/nova (sem validacao)
  |     |
  |     +-- SIM: Busca dados do cliente -> abre ValidarDadosLeadDialog
  |           |
  |           +-- Dados completos: onComplete() -> navega para /negociacoes/nova
  |           |
  |           +-- Dados incompletos: mostra campos faltando
  |                 |
  |                 +-- "Completar Dados": navega para /clientes com modal de edicao
  |                 +-- "Cancelar": fecha dialog
```

### Detalhes tecnicos

- Reutilizar 100% do componente `ValidarDadosLeadDialog` e da funcao `validarDadosLeadParaContrato` ja existentes
- Usar o hook `useCliente(id)` para buscar os dados completos do cliente (o objeto `atividade.cliente` so traz id/nome/temperatura)
- No `AtividadeKanbanCard`, o estado do cliente sera buscado apenas quando o usuario clicar em converter (lazy)
- No `Atividades.tsx`, usar um estado `clienteValidandoId` para controlar qual cliente esta sendo validado e condicionar o `useCliente`

### Arquivos modificados

| Arquivo | Acao |
|---|---|
| `src/components/atividades/AtividadeKanbanCard.tsx` | Adicionar validacao antes de converter |
| `src/pages/Atividades.tsx` | Adicionar validacao antes de converter |

Nenhuma alteracao de banco de dados.
