-- Migrar tickets órfãos para etapas apropriadas

-- Tickets de render_3d vão para "Em Produção Render"
UPDATE projetos_marketing 
SET ticket_etapa_id = '98c2449a-557e-4af5-9863-e9dbd9daee6d'
WHERE ticket_etapa_id IS NULL 
  AND status = 'em_producao' 
  AND categoria = 'render_3d';

-- Tickets de design_grafico e video_animacao vão para "Em Produção Criação"
UPDATE projetos_marketing 
SET ticket_etapa_id = '83062aec-d780-47e5-9d21-af773065c846'
WHERE ticket_etapa_id IS NULL 
  AND status = 'em_producao' 
  AND categoria IN ('design_grafico', 'video_animacao');

-- Demais tickets órfãos vão para "Triagem"
UPDATE projetos_marketing 
SET ticket_etapa_id = 'a616bc81-0fad-46fd-beb2-b852aa481e57'
WHERE ticket_etapa_id IS NULL 
  AND is_active = true;