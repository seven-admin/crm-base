-- ==============================================
-- PARTE 1: ADICIONAR NOVAS ROLES AO ENUM
-- ==============================================

-- Adicionar novas roles ao enum existente
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cliente_externo';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor_relacionamento';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor_render';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor_criacao';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor_video';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'equipe_marketing';