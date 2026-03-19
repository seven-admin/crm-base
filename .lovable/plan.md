

# Plano atualizado — Metas + Tipo de Box no PDF

## 1. Corrigir atribuição de metas a funcionários

### `src/pages/MetasComerciais.tsx`
- Substituir escopo "Gestor de Produto" por **"Funcionário"**
- Trocar `useGestoresProduto` por `useFuncionariosSeven` no seletor
- Adicionar checkbox **"Todos os funcionários"** — ao salvar, cria uma meta por funcionário via loop de `createMeta.mutateAsync`
- Quando "todos" marcado, ocultar select individual
- Tabela de listagem já funciona via join `profiles` com `gestor_id`

## 2. Adicionar tipo de box no PDF de unidades disponíveis

### `src/hooks/useUnidades.ts`
- Alterar `boxes(numero)` para `boxes(numero, tipo)` no select da query

### `src/components/empreendimentos/UnidadesTab.tsx`
- Na linha 223, extrair também o tipo: `boxes?.map(b => \`${b.numero} (${b.tipo})\`).join(', ')`
- A coluna "Box" já existe — o valor passará a mostrar número + tipo (ex: "001 (carro)", "002 (moto)")
- Sem necessidade de coluna extra, apenas enriquecer o dado exibido

### Arquivos a modificar
- `src/pages/MetasComerciais.tsx`
- `src/hooks/useUnidades.ts`
- `src/components/empreendimentos/UnidadesTab.tsx`

