
# Enriquecer payload do webhook `comentario_proposta`

## Problema

O webhook `comentario_proposta` atualmente envia apenas `negociacao_id`, `comentario`, `autor` e `origem`. Faltam dados contextuais da proposta (codigo, empreendimento, unidades, cliente, valores, etc.).

## Solucao

Alterar o `onSuccess` do `useAddNegociacaoComentario` em `src/hooks/useNegociacaoComentarios.ts` para:

1. Buscar os dados completos da negociacao no banco (com joins de cliente, empreendimento, unidades, corretor) antes de disparar o webhook
2. Montar um payload enriquecido seguindo o mesmo padrao usado nos webhooks de `negociacao_movida` e `proposta_aprovada_incorporador`

## Payload enriquecido

O webhook passara a enviar:

- `negociacao_id`, `codigo`, `numero_proposta`
- `status_proposta`
- `comentario` (texto da mensagem)
- `autor` (id, nome, telefone)
- `origem` (portal_incorporador ou sistema_interno)
- `cliente` (id, nome, cpf, email, telefone)
- `empreendimento` (id, nome)
- `corretor` (id, nome)
- `unidades` (array com numero, bloco, valores)
- `valores` (valor_tabela, valor_proposta, desconto_percentual)
- `link` (URL direta para a negociacao)

## Arquivo impactado

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useNegociacaoComentarios.ts` | No `onSuccess`, buscar dados completos da negociacao via query com joins e montar payload enriquecido para o `dispararWebhook` |

## Detalhes tecnicos

A query de enriquecimento usara o mesmo padrao de select com joins ja existente no projeto:

```text
negociacoes
  .select('*, cliente:clientes!cliente_id(id,nome,cpf,email,telefone), 
           empreendimento:empreendimentos!empreendimento_id(id,nome),
           corretor:corretores!corretor_id(id,nome_completo),
           unidades:negociacao_unidades(unidade_id, valor_tabela, valor_proposta, 
             unidade:unidades!unidade_id(numero, codigo, bloco:blocos!bloco_id(nome)))')
  .eq('id', negociacaoId)
  .maybeSingle()
```

O disparo continua fire-and-forget para nao impactar a UX. Se a query falhar, o webhook e disparado com os dados minimos (comportamento atual como fallback).
