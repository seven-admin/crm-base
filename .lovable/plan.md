

# Fix: Renomear clientes placeholder existentes de "PENDENTE" para "PE"

## Problema
Os 9 clientes placeholder criados pela migração anterior ainda têm nome com prefixo `PENDENTE -`. A alteração no código só afeta novos placeholders.

## Solução
Criar uma migração SQL para atualizar todos os clientes existentes cujo nome começa com `PENDENTE -`, substituindo por `PE -`.

### Migração SQL
```sql
UPDATE clientes
SET nome = 'PE' || substring(nome from 9)
WHERE nome LIKE 'PENDENTE -%';
```

Isso renomeia os 9 registros existentes de `PENDENTE - [titulo]` para `PE - [titulo]`. Alteração puramente de dados, sem impacto em lógica.

