-- Backfill: preencher gestor_id nas negociações que foram criadas automaticamente a partir de atividades
UPDATE negociacoes n
SET gestor_id = a.gestor_id
FROM atividades a
WHERE n.atividade_origem_id = a.id
  AND n.gestor_id IS NULL
  AND a.gestor_id IS NOT NULL
  AND n.is_active = true;