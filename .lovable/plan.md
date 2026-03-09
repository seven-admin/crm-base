

# Validação de cadastro para conversão em proposta — Campo `estado_civil` ausente

## Problema encontrado

O `ValidarDadosLeadDialog` valida 13 campos obrigatórios para conversão em proposta, incluindo `estado_civil`. Porém, o **formulário de cadastro do cliente (`ClienteForm.tsx`) não renderiza o campo de Estado Civil** — ele existe no schema Zod (linha 56) e nos defaults, mas não há nenhum `<FormField>` para ele no JSX.

Isso significa que o usuário **nunca consegue preencher o estado civil** pelo formulário, e a validação sempre vai acusar pendência nesse campo.

## Campos validados vs campos no formulário

| Campo validado | Existe no form? |
|---|---|
| nome | Sim |
| cpf | Sim |
| **estado_civil** | **NÃO — FALTANDO** |
| profissao | Sim |
| data_nascimento | Sim |
| endereco_logradouro | Sim |
| endereco_numero | Sim |
| endereco_bairro | Sim |
| endereco_cidade | Sim |
| endereco_uf | Sim |
| endereco_cep | Sim |
| telefone | Sim |
| email | Sim |

## Solução

### `src/components/clientes/ClienteForm.tsx`
Adicionar um `FormField` com `Select` para `estado_civil` na seção "Dados Pessoais" (Step 1), logo após o campo de profissão (linha ~491). Usar as opções de `ESTADOS_CIVIS` já importado do types (linha 24):

- Solteiro(a)
- Casado(a)
- Divorciado(a)
- Viúvo(a)
- Separado(a)
- União Estável

O campo já é importado (`ESTADOS_CIVIS` na linha 24), já está no schema Zod, e já tem default — só falta o componente visual.

### Arquivo afetado
- `src/components/clientes/ClienteForm.tsx` (adicionar ~20 linhas de FormField/Select)

