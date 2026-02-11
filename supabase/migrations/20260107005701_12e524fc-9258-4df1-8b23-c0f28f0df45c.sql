-- Adicionar novos valores ao enum unidade_status
ALTER TYPE public.unidade_status ADD VALUE IF NOT EXISTS 'negociacao';
ALTER TYPE public.unidade_status ADD VALUE IF NOT EXISTS 'contrato';