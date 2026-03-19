

# Corrigir erro "valor_total" na função de validação

## Problema
A função de banco `verificar_ficha_proposta_completa` referencia `v_negociacao.valor_total`, mas a tabela `negociacoes` não tem esse campo — o campo correto é `valor_negociacao`. Essa função é chamada pelo trigger `atualizar_ficha_completa` em cada UPDATE na tabela `negociacoes`, causando o erro.

## Solução
Criar uma migration para atualizar a função `verificar_ficha_proposta_completa`, substituindo `v_negociacao.valor_total` por `v_negociacao.valor_negociacao`.

### Arquivo alterado
- Migration SQL (via ferramenta de migração)

### SQL da correção
```sql
CREATE OR REPLACE FUNCTION public.verificar_ficha_proposta_completa(neg_id uuid)
  -- mesma função, apenas trocando:
  --   IF v_negociacao.valor_total IS NULL OR v_negociacao.valor_total <= 0
  -- por:
  --   IF v_negociacao.valor_negociacao IS NULL OR v_negociacao.valor_negociacao <= 0
```

