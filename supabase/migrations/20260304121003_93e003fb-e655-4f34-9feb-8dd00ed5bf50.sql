
UPDATE negociacoes n
SET data_primeiro_atendimento = a.data_inicio
FROM atividades a
WHERE a.cliente_id = n.cliente_id
  AND a.gestor_id = n.gestor_id
  AND n.data_primeiro_atendimento::date = '2026-03-04'
  AND a.tipo = 'atendimento'
  AND a.data_inicio::text LIKE '2026-02%';
