CREATE UNIQUE INDEX IF NOT EXISTS metas_comerciais_unique_comp_emp_cor_ges_per_tipo
ON public.metas_comerciais (
  competencia,
  COALESCE(empreendimento_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(corretor_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(gestor_id, '00000000-0000-0000-0000-000000000000'),
  periodicidade,
  tipo
);