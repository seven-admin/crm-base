
-- Policy para nexa_gestor gerenciar unidades
CREATE POLICY "Nexa gestor can manage unidades"
ON public.seven_unidades
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'nexa_gestor'))
WITH CHECK (public.has_role(auth.uid(), 'nexa_gestor'));

-- Desativa módulos obsoletos
UPDATE public.sistema_modules
SET is_active = false
WHERE name IN (
  'agenda','atividades','bonificacoes','comissoes','contratos','contratos_templates',
  'contratos_tipos_parcela','contratos_variaveis','empreendimentos_comissoes',
  'empreendimentos_config','financeiro_dre','financeiro_fluxo','forecast',
  'negociacoes','negociacoes_config','portal_cliente','portal_corretor',
  'propostas','relatorios','relatorios_financeiros','reservas','solicitacoes',
  'configuracoes','config_negociacoes'
);
