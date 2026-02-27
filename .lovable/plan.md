
# Incluir codigo e numero_proposta no payload do webhook comentario_proposta

## Problema

O webhook `comentario_proposta` envia apenas dados minimos (negociacao_id, comentario, autor, origem). Os codigos da negociacao (`codigo`, ex: NEG-00024) e da proposta (`numero_proposta`, ex: PROP-00007) nao estao sendo enviados.

## Solucao

Alterar o `onSuccess` do `useAddNegociacaoComentario` em `src/hooks/useNegociacaoComentarios.ts` para:

1. Buscar os dados completos da negociacao (com joins de cliente, empreendimento, corretor, unidades) antes de disparar o webhook
2. Incluir `codigo`, `numero_proposta`, `status_proposta`, dados do cliente, empreendimento, corretor, unidades e valores no payload

## Arquivo impactado

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useNegociacaoComentarios.ts` | Substituir disparo simples por query enriquecida + payload completo |

## Detalhes tecnicos

No `onSuccess`, executar em paralelo `getUsuarioLogado()` e uma query na tabela `negociacoes` com joins:

```text
db.from('negociacoes')
  .select('id, codigo, numero_proposta, status_proposta, valor_tabela, valor_proposta, desconto_percentual,
    cliente:clientes!cliente_id(id, nome, cpf, email, telefone),
    empreendimento:empreendimentos!empreendimento_id(id, nome),
    corretor:corretores!corretor_id(id, nome_completo),
    unidades:negociacao_unidades(valor_tabela, valor_proposta,
      unidade:unidades!unidade_id(numero, codigo, bloco:blocos!bloco_id(nome)))')
  .eq('id', negociacaoId)
  .maybeSingle()
```

O payload enriquecido incluira:
- `negociacao_id`, `codigo`, `numero_proposta`, `status_proposta`
- `comentario`, `autor` (id, nome, telefone), `origem`
- `cliente` (id, nome, cpf, email, telefone)
- `empreendimento` (id, nome)
- `corretor` (id, nome)
- `unidades` (array com numero, bloco, valores)
- `valores` (valor_tabela, valor_proposta, desconto_percentual)
- `link` (URL direta para a negociacao)

Se a query de enriquecimento falhar, o webhook dispara com dados minimos como fallback.
