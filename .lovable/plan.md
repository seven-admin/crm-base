

# Restringir funcoes de contadores a super_admin

## Problema

As funcoes de banco `get_all_sequence_values()` e `reset_sequence_value()` sao `SECURITY DEFINER` e podem ser chamadas via RPC por qualquer usuario autenticado, sem passar pela Edge Function que valida o papel de super_admin.

## Restricao de acesso

**Todas as operacoes relacionadas a contadores (visualizar e reiniciar) sao restritas exclusivamente a usuarios com papel `super_admin`.** Essa restricao se aplica em tres camadas:

1. **Interface (UI)**: A aba "Contadores" em Configuracoes so e renderizada para super_admin.
2. **Edge Function**: A funcao `reset-sequence` valida o papel antes de executar qualquer operacao.
3. **Banco de dados (RPC)**: As funcoes SQL verificam `is_super_admin(auth.uid())` e levantam excecao caso o usuario nao tenha permissao.

## Solucao

Adicionar verificacao de `is_super_admin(auth.uid())` dentro de ambas as funcoes de banco. Se o usuario nao for super_admin, a funcao levanta uma excecao.

## Detalhes tecnicos

### Migration SQL

Recriar as duas funcoes adicionando a verificacao no inicio:

```text
-- get_all_sequence_values
CREATE OR REPLACE FUNCTION public.get_all_sequence_values()
  ...
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas super administradores';
  END IF;
  -- resto igual
  ...

-- reset_sequence_value
CREATE OR REPLACE FUNCTION public.reset_sequence_value(seq_name text, new_value bigint)
  ...
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas super administradores';
  END IF;
  -- resto igual (whitelist + ALTER SEQUENCE)
  ...
```

Nenhuma alteracao em codigo frontend ou na Edge Function e necessaria -- a protecao ja existe nesses niveis. Esta mudanca fecha a brecha de acesso direto via RPC.

