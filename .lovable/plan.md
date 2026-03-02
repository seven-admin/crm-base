

# Mover "Cliente Direto" e renomear "Imobiliária" na categoria

## Problema 1: "Imobiliária" ainda aparece nos botoes de categoria (Etapa 1)

O label "Imobiliária" nos botoes de categoria vem de `ATIVIDADE_CATEGORIA_LABELS` no arquivo de tipos. Precisa ser renomeado para "Imob. e Corretores" (abreviado para caber no grid de 4 colunas).

**Arquivo:** `src/types/atividades.types.ts`
- Alterar `imobiliaria: 'Imobiliária'` para `imobiliaria: 'Imob. e Corretores'`

## Problema 2: "Cliente Direto" deve ficar logo abaixo do seletor de cliente

Atualmente o toggle "Cliente Direto" esta no final da Etapa 2 (linha 933). Precisa ser movido para logo apos o seletor de cliente e o dialog de novo cliente (apos linha 786).

**Arquivo:** `src/components/atividades/AtividadeForm.tsx`
- Remover o bloco "Cliente Direto" da posicao atual (linhas 933-949)
- Inserir o mesmo bloco logo apos o `NovoClienteRapidoDialog` (apos linha 786), antes do campo "Empreendimento"

## Resumo

- `src/types/atividades.types.ts` - renomear label da categoria imobiliaria
- `src/components/atividades/AtividadeForm.tsx` - mover toggle "Cliente Direto" para baixo do seletor de cliente

