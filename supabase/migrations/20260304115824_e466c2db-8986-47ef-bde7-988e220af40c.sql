-- Create 9 placeholder clients for Michel's Feb 2026 activities
-- Then update the activities and create negociações

-- 1. Create placeholder clients
INSERT INTO clientes (id, nome, temperatura, fase, gestor_id, empreendimento_id)
VALUES
  (gen_random_uuid(), 'PENDENTE - VISITA - CORRETOR LUCAS - CLIENTE MARCOS', 'frio', 'prospecto', '0bb345de-208f-47c5-a9f7-4935c033fd9b', 'f2208f56-edd6-4c98-b82a-9657606376cf'),
  (gen_random_uuid(), 'PENDENTE - VISITA CORRETORA JOSIANE - CLIENTE ELTON E JANAINA', 'frio', 'prospecto', '0bb345de-208f-47c5-a9f7-4935c033fd9b', 'f2208f56-edd6-4c98-b82a-9657606376cf'),
  (gen_random_uuid(), 'PENDENTE - RETORNO - CLIENTE GLECE - CORRETORA FRANTIESCA', 'frio', 'prospecto', '0bb345de-208f-47c5-a9f7-4935c033fd9b', 'f2208f56-edd6-4c98-b82a-9657606376cf'),
  (gen_random_uuid(), 'PENDENTE - VISITA CORRETOR DIEGO - CLIENTE CAROLINE', 'frio', 'prospecto', '0bb345de-208f-47c5-a9f7-4935c033fd9b', 'f2208f56-edd6-4c98-b82a-9657606376cf'),
  (gen_random_uuid(), 'PENDENTE - RETORNO CLIENTE ELTON - COM GESTOR LUCAS.', 'frio', 'prospecto', '0bb345de-208f-47c5-a9f7-4935c033fd9b', 'f2208f56-edd6-4c98-b82a-9657606376cf'),
  (gen_random_uuid(), 'PENDENTE - VISITA - CORRETOR DÉVERSON - COM CLIENTE GABRIEL', 'frio', 'prospecto', '0bb345de-208f-47c5-a9f7-4935c033fd9b', 'f2208f56-edd6-4c98-b82a-9657606376cf'),
  (gen_random_uuid(), 'PENDENTE - VISITA CORRETOR ALEX', 'frio', 'prospecto', '0bb345de-208f-47c5-a9f7-4935c033fd9b', 'f2208f56-edd6-4c98-b82a-9657606376cf'),
  (gen_random_uuid(), 'PENDENTE - VISITA DO CORRETOR RODRIGO  COM CLIENTE LOURDES.', 'frio', 'prospecto', '0bb345de-208f-47c5-a9f7-4935c033fd9b', 'f2208f56-edd6-4c98-b82a-9657606376cf'),
  (gen_random_uuid(), 'PENDENTE - VISITA - CORRETOR CLEITON - COM CLIENTE GISELE', 'frio', 'prospecto', '0bb345de-208f-47c5-a9f7-4935c033fd9b', 'f2208f56-edd6-4c98-b82a-9657606376cf');

-- 2. Link each placeholder client to corresponding activity, and create negociações
-- We use a DO block to handle the mapping

DO $$
DECLARE
  v_etapa_id uuid := '174893f5-58b2-4c6e-bfdf-d28e3ff369d6';
  v_gestor_id uuid := '0bb345de-208f-47c5-a9f7-4935c033fd9b';
  v_emp_id uuid := 'f2208f56-edd6-4c98-b82a-9657606376cf';
  v_atividade RECORD;
  v_cliente_id uuid;
BEGIN
  -- For each of the 9 activities without cliente_id
  FOR v_atividade IN 
    SELECT a.id, a.titulo, a.corretor_id, a.imobiliaria_id
    FROM atividades a
    WHERE a.gestor_id = v_gestor_id
      AND a.tipo = 'atendimento'
      AND a.data_inicio >= '2026-02-01'
      AND a.data_inicio < '2026-03-01'
      AND a.cliente_id IS NULL
  LOOP
    -- Find the matching placeholder client
    SELECT id INTO v_cliente_id
    FROM clientes
    WHERE nome = 'PENDENTE - ' || v_atividade.titulo
      AND gestor_id = v_gestor_id
    LIMIT 1;

    IF v_cliente_id IS NOT NULL THEN
      -- Update activity with cliente_id
      UPDATE atividades SET cliente_id = v_cliente_id WHERE id = v_atividade.id;

      -- Create negociação
      INSERT INTO negociacoes (cliente_id, corretor_id, empreendimento_id, imobiliaria_id, gestor_id, funil_etapa_id, atividade_origem_id, data_primeiro_atendimento, ordem_kanban)
      VALUES (v_cliente_id, v_atividade.corretor_id, v_emp_id, v_atividade.imobiliaria_id, v_gestor_id, v_etapa_id, v_atividade.id, NOW(), 0);
    END IF;
  END LOOP;
END $$;