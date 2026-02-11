-- Bloco 11: Adicionar novo valor 'criacao_campanha' ao enum categoria_projeto
ALTER TYPE public.categoria_projeto ADD VALUE IF NOT EXISTS 'criacao_campanha';