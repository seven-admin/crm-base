

# Ajuste: Forma de Pagamento condicionada à Forma de Quitação

## Problema
Quando a forma de quitação é **dação de veículo**, **dação de imóvel** ou **outro bem**, o campo "Forma de Pagamento" (boleto, PIX, TED, etc.) continua aparecendo e obrigatório — mas não faz sentido nesses casos. O formulário avançado (`CondicaoPagamentoForm.tsx`) já esconde o campo corretamente, porém os **editores inline** nas tabelas de condições de pagamento sempre exibem a coluna "Forma de Pagamento" com as opções de dinheiro.

## Solução

### 1. Adicionar opção "N/A" ou limpar forma_pagamento quando não é dinheiro

Quando `forma_quitacao` for `veiculo`, `imovel` ou `outro_bem`:
- O campo forma_pagamento deve ficar **vazio ou exibir "Dação"** em vez de "Boleto"
- Ao salvar, `forma_pagamento` deve ser `null` ou um valor especial

### 2. Arquivos a alterar

**`src/types/condicoesPagamento.types.ts`**
- Tornar `forma_pagamento` opcional no `CondicaoPagamentoFormData` e no default (já é opcional no base)

**`src/components/negociacoes/NegociacaoCondicoesPagamentoInlineEditor.tsx`**
- Na coluna "Forma", condicionar: se `forma_quitacao !== 'dinheiro'`, exibir badge com o label da forma de quitação (ex: "Veículo", "Imóvel") em vez do select de forma de pagamento
- Ao criar condição de ajuste de centavos ou similar, não forçar `forma_pagamento: 'boleto'` quando quitação não é dinheiro

**`src/components/negociacoes/LocalCondicoesPagamentoEditor.tsx`**
- Mesmo ajuste: na coluna "Forma", se `forma_quitacao !== 'dinheiro'`, exibir badge com label da quitação e desabilitar o select

**`src/components/negociacoes/PropostaCondicoesEditor.tsx`**
- Ao montar dados para edição avançada, não forçar `forma_quitacao: 'dinheiro'` como fallback fixo

### 3. Lógica de limpeza
Quando o usuário mudar `forma_quitacao` para algo diferente de `dinheiro`, o `forma_pagamento` será limpo automaticamente (setar `undefined`). Quando voltar para `dinheiro`, o default `boleto` é restaurado.

### Resultado
- Condições com dação exibem "Veículo" / "Imóvel" / "Outro Bem" na coluna de forma
- Condições com dinheiro continuam mostrando o select de boleto/PIX/TED/etc
- Sem mudança de banco de dados

