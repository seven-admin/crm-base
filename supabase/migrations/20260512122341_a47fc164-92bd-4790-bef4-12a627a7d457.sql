-- Etapa 1: 39 órfãs com cliente_id - inferir empreendimento via negociação mais recente
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

-- Etapa 2: demais órfãs sem cliente vinculável → Reserva do Lago
UPDATE atividades
SET empreendimento_id = '13fc62b0-c926-48de-8a53-2c63efcdfdc0'
WHERE gestor_id = 'f5beb78c-1981-4605-8947-72b11d52cb1e'
  AND empreendimento_id IS NULL;