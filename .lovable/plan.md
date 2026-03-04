

# Fix: Corrigir data_primeiro_atendimento das 9 negociações do Michel para Fevereiro

## Problema
As 9 negociações criadas pela migração retroativa usaram `NOW()` como `data_primeiro_atendimento`, resultando em data de março (2026-03-04). O filtro de mês no Kanban usa `data_primeiro_atendimento` como prioridade, então as negociações não aparecem ao filtrar por Fev/2026.

## Solução
Usar o insert tool (UPDATE) para corrigir `data_primeiro_atendimento` de cada negociação, copiando a `data_inicio` da atividade correspondente (que é de fevereiro). Também corrigir `created_at` se necessário.

### SQL (via insert tool)
```sql
UPDATE negociacoes n
SET data_primeiro_atendimento = a.data_inicio
FROM atividades a
WHERE a.cliente_id = n.cliente_id
  AND a.gestor_id = n.gestor_id
  AND n.data_primeiro_atendimento::date = '2026-03-04'
  AND a.tipo = 'atendimento'
  AND a.data_inicio LIKE '2026-02%';
```

Isso atualiza as 9 negociações para usar a data original da atividade de fevereiro, fazendo-as aparecer corretamente no filtro de mês.

