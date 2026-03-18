

# Adicionar coluna "Box" no PDF de unidades disponíveis

## Situação atual
- O PDF é gerado em `src/components/empreendimentos/UnidadesTab.tsx` na função `handleExportarDisponiveis`
- A tabela atual tem 6 colunas: Número, Bloco/Quadra, Andar, Tipologia, Área, Valor
- A tabela `boxes` tem FK `unidade_id` apontando para `unidades`, ou seja, a relação é inversa (box pertence a unidade)
- O hook `useUnidades` **não** inclui boxes no select

## Plano

### 1. Incluir boxes na query do `useUnidades`
Em `src/hooks/useUnidades.ts`, adicionar `boxes(numero)` ao select para trazer o número do box vinculado a cada unidade.

### 2. Adicionar coluna "Box" no PDF
Em `src/components/empreendimentos/UnidadesTab.tsx`, na função `handleExportarDisponiveis`:
- Adicionar coluna "Box" na tabela do PDF (após Tipologia, antes de Área)
- Exibir o número do box vinculado (ou "-" se não houver)
- Ajustar `colspan` do separador de linhas de 6 para 7
- Ajustar largura do container se necessário para acomodar a coluna extra

### Arquivos a modificar
- `src/hooks/useUnidades.ts` — adicionar `boxes(numero)` ao select
- `src/components/empreendimentos/UnidadesTab.tsx` — adicionar coluna Box no HTML do PDF

