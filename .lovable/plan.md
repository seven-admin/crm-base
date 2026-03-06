

# Plano: Simplificar validação de dados do cliente para contrato

## Problema

A validação em `ValidarDadosLeadDialog.tsx` exige campos desnecessários como **Nome da Mãe**, **Nome do Pai** e **Nacionalidade**, que raramente são obrigatórios em contratos imobiliários e que nem sequer existem no formulário de cadastro.

## Solução

Remover 3 campos da lista `CAMPOS_OBRIGATORIOS_CONTRATO` em `ValidarDadosLeadDialog.tsx`:

- ~~`nacionalidade`~~
- ~~`nome_mae`~~
- ~~`nome_pai`~~

Os campos essenciais que permanecem (13 no total):

| Categoria | Campos |
|---|---|
| Pessoais | Nome, CPF, Estado Civil, Profissão, Data de Nascimento |
| Endereço | Logradouro, Número, Bairro, Cidade, UF, CEP |
| Contato | Telefone, Email |

## Arquivo afetado

| Arquivo | Alteração |
|---|---|
| `src/components/negociacoes/ValidarDadosLeadDialog.tsx` | Remover 3 linhas do array `CAMPOS_OBRIGATORIOS_CONTRATO` |

