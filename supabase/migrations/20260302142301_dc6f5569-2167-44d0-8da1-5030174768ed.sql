
-- Backfill: criar negociações para atividades comerciais que não têm negociação correspondente
-- Gestor f5beb78c -> empreendimento RESERVA DO LAGO (13fc62b0)
-- Gestor 4b9cc9ba -> atividade já tem empreendimento LIVTY (156f9324)

INSERT INTO negociacoes (cliente_id, corretor_id, empreendimento_id, imobiliaria_id, funil_etapa_id, atividade_origem_id, data_primeiro_atendimento, ordem_kanban)
SELECT DISTINCT ON (a.cliente_id)
  a.cliente_id,
  a.corretor_id,
  COALESCE(a.empreendimento_id, ue.empreendimento_id) as empreendimento_id,
  a.imobiliaria_id,
  '174893f5-58b2-4c6e-bfdf-d28e3ff369d6' as funil_etapa_id,
  a.id as atividade_origem_id,
  a.created_at as data_primeiro_atendimento,
  0 as ordem_kanban
FROM atividades a
LEFT JOIN user_empreendimentos ue ON ue.user_id = a.gestor_id
WHERE a.tipo IN ('atendimento', 'negociacao', 'contra_proposta_atividade')
  AND a.cliente_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM negociacoes n 
    WHERE n.cliente_id = a.cliente_id 
      AND n.is_active = true
  )
  AND COALESCE(a.empreendimento_id, ue.empreendimento_id) IS NOT NULL
ORDER BY a.cliente_id, a.created_at DESC;
