# Atribuição em massa de empreendimento às atividades órfãs do Pedro

## Contexto

O gestor de produto **Pedro** (`comercial_ribas@sevengroup360.com.br`) já está vinculado aos empreendimentos **Belvedere**, **Jd. Iguatemi**, **Reserva do Lago** e **Vivendas do Bosque** (confirmado na tela "Editar Usuário").

Apesar disso, **759 atividades dele têm `empreendimento_id IS NULL`** e por isso ficam invisíveis no Forecast, no Resumo Comercial e no Portal do Incorporador (todos filtram por empreendimento).

Distribuição atual das atividades **com** empreendimento preenchido (já vinculadas) mostra que **Reserva do Lago concentra ~90%** delas — é o empreendimento principal do Pedro.

## Estratégia (em duas etapas, executadas em sequência)

### Etapa 1 — 39 órfãs com `cliente_id`: inferir empreendimento via negociação do cliente

Para cada órfã com cliente, pegar o `empreendimento_id` da negociação mais recente daquele cliente. Resultado esperado:
- ~37 atividades → **Reserva do Lago**
- ~5 atividades → **Belvedere**
- ~2 atividades permanecerão NULL (cliente sem negociação) → tratadas na Etapa 2

```sql
UPDATE atividades a
SET empreendimento_id = sub.emp_id
FROM (
  SELECT DISTINCT ON (a2.id) a2.id, n.empreendimento_id AS emp_id
  FROM atividades a2
  JOIN negociacoes n ON n.cliente_id = a2.cliente_id
  WHERE a2.gestor_id = 'f5beb78c-1981-4605-8947-72b11d52cb1e'
    AND a2.empreendimento_id IS NULL
    AND a2.cliente_id IS NOT NULL
    AND n.empreendimento_id IS NOT NULL
  ORDER BY a2.id, n.created_at DESC
) sub
WHERE a.id = sub.id;
```

### Etapa 2 — Demais órfãs (≈720, sem cliente): atribuir ao Reserva do Lago

São ligações em massa (campanhas), administrativas e prospecção. Critério: empreendimento principal do Pedro, onde a esmagadora maioria das atividades dele já vinculadas reside.

```sql
UPDATE atividades
SET empreendimento_id = '13fc62b0-c926-48de-8a53-2c63efcdfdc0' -- RESERVA DO LAGO
WHERE gestor_id = 'f5beb78c-1981-4605-8947-72b11d52cb1e'
  AND empreendimento_id IS NULL;
```

## Validação após execução

1. `SELECT COUNT(*) FROM atividades WHERE gestor_id = 'f5beb78c-…' AND empreendimento_id IS NULL` deve retornar **0**.
2. Conferir o aumento dos números no Portal do Incorporador → Forecast (Reserva do Lago e Belvedere) para os meses de março/2026 em diante.
3. Distribuição final esperada: ~700 a mais em Reserva do Lago e ~5 a mais em Belvedere.

## Escopo

- **Apenas atividades do Pedro** (`gestor_id = 'f5beb78c-1981-4605-8947-72b11d52cb1e'`).
- Apenas operações `UPDATE` em `public.atividades` — sem alterações de schema, RLS ou código frontend.
- Caso queira, posso adicionar em rodada futura uma trigger de validação para impedir novos cadastros de atividade sem empreendimento (não incluso aqui).
