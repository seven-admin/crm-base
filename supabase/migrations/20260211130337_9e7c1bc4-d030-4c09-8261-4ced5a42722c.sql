-- Vincular imobiliarias existentes (com gestor) a empreendimentos com auto_vincular_corretor
INSERT INTO empreendimento_imobiliarias (empreendimento_id, imobiliaria_id)
SELECT e.id, i.id
FROM empreendimentos e
CROSS JOIN imobiliarias i
WHERE e.auto_vincular_corretor = true
  AND e.is_active = true
  AND i.is_active = true
  AND i.user_id IS NOT NULL
ON CONFLICT (empreendimento_id, imobiliaria_id) DO NOTHING;

-- Vincular os gestores individualmente em user_empreendimentos
INSERT INTO user_empreendimentos (user_id, empreendimento_id)
SELECT i.user_id, e.id
FROM empreendimentos e
CROSS JOIN imobiliarias i
WHERE e.auto_vincular_corretor = true
  AND e.is_active = true
  AND i.is_active = true
  AND i.user_id IS NOT NULL
ON CONFLICT (user_id, empreendimento_id) DO NOTHING;