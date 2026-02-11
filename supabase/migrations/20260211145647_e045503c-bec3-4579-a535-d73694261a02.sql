
-- negociacoes.gestor_id
ALTER TABLE negociacoes DROP CONSTRAINT IF EXISTS negociacoes_gestor_id_fkey;
ALTER TABLE negociacoes ADD CONSTRAINT negociacoes_gestor_id_fkey 
  FOREIGN KEY (gestor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- projetos_marketing.created_by
ALTER TABLE projetos_marketing DROP CONSTRAINT IF EXISTS projetos_marketing_created_by_fkey;
ALTER TABLE projetos_marketing ADD CONSTRAINT projetos_marketing_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- briefings.criado_por
ALTER TABLE briefings DROP CONSTRAINT IF EXISTS briefings_criado_por_fkey;
ALTER TABLE briefings ADD CONSTRAINT briefings_criado_por_fkey 
  FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL;

-- briefings.triado_por
ALTER TABLE briefings DROP CONSTRAINT IF EXISTS briefings_triado_por_fkey;
ALTER TABLE briefings ADD CONSTRAINT briefings_triado_por_fkey 
  FOREIGN KEY (triado_por) REFERENCES auth.users(id) ON DELETE SET NULL;

-- cliente_interacoes.user_id
ALTER TABLE cliente_interacoes DROP CONSTRAINT IF EXISTS cliente_interacoes_user_id_fkey;
ALTER TABLE cliente_interacoes ADD CONSTRAINT cliente_interacoes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- unidade_historico_precos.alterado_por
ALTER TABLE unidade_historico_precos DROP CONSTRAINT IF EXISTS unidade_historico_precos_alterado_por_fkey;
ALTER TABLE unidade_historico_precos ADD CONSTRAINT unidade_historico_precos_alterado_por_fkey 
  FOREIGN KEY (alterado_por) REFERENCES auth.users(id) ON DELETE SET NULL;

-- termos_versoes.criado_por
ALTER TABLE termos_versoes DROP CONSTRAINT IF EXISTS termos_versoes_criado_por_fkey;
ALTER TABLE termos_versoes ADD CONSTRAINT termos_versoes_criado_por_fkey 
  FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL;

-- propostas.updated_by
ALTER TABLE propostas DROP CONSTRAINT IF EXISTS propostas_updated_by_fkey;
ALTER TABLE propostas ADD CONSTRAINT propostas_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- propostas.created_by
ALTER TABLE propostas DROP CONSTRAINT IF EXISTS propostas_created_by_fkey;
ALTER TABLE propostas ADD CONSTRAINT propostas_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ticket_criativos.created_by
ALTER TABLE ticket_criativos DROP CONSTRAINT IF EXISTS ticket_criativos_created_by_fkey;
ALTER TABLE ticket_criativos ADD CONSTRAINT ticket_criativos_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
