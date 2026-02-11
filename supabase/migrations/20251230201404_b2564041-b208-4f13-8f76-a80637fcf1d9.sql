-- Adicionar triggers de auditoria em todas as tabelas principais que ainda não têm

-- Empreendimentos
CREATE TRIGGER audit_empreendimentos
  AFTER INSERT OR UPDATE OR DELETE ON public.empreendimentos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Unidades
CREATE TRIGGER audit_unidades
  AFTER INSERT OR UPDATE OR DELETE ON public.unidades
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Tipologias
CREATE TRIGGER audit_tipologias
  AFTER INSERT OR UPDATE OR DELETE ON public.tipologias
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Blocos
CREATE TRIGGER audit_blocos
  AFTER INSERT OR UPDATE OR DELETE ON public.blocos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Propostas
CREATE TRIGGER audit_propostas
  AFTER INSERT OR UPDATE OR DELETE ON public.propostas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Proposta Unidades
CREATE TRIGGER audit_proposta_unidades
  AFTER INSERT OR UPDATE OR DELETE ON public.proposta_unidades
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Contratos
CREATE TRIGGER audit_contratos
  AFTER INSERT OR UPDATE OR DELETE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Contrato Unidades
CREATE TRIGGER audit_contrato_unidades
  AFTER INSERT OR UPDATE OR DELETE ON public.contrato_unidades
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Negociações
CREATE TRIGGER audit_negociacoes
  AFTER INSERT OR UPDATE OR DELETE ON public.negociacoes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Negociação Unidades
CREATE TRIGGER audit_negociacao_unidades
  AFTER INSERT OR UPDATE OR DELETE ON public.negociacao_unidades
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Comissões
CREATE TRIGGER audit_comissoes
  AFTER INSERT OR UPDATE OR DELETE ON public.comissoes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Comissão Parcelas
CREATE TRIGGER audit_comissao_parcelas
  AFTER INSERT OR UPDATE OR DELETE ON public.comissao_parcelas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Clientes
CREATE TRIGGER audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Funis
CREATE TRIGGER audit_funis
  AFTER INSERT OR UPDATE OR DELETE ON public.funis
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Funil Etapas
CREATE TRIGGER audit_funil_etapas
  AFTER INSERT OR UPDATE OR DELETE ON public.funil_etapas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Configuração Comercial
CREATE TRIGGER audit_configuracao_comercial
  AFTER INSERT OR UPDATE OR DELETE ON public.configuracao_comercial
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Configuração Comissões
CREATE TRIGGER audit_configuracao_comissoes
  AFTER INSERT OR UPDATE OR DELETE ON public.configuracao_comissoes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Reservas Temporárias
CREATE TRIGGER audit_reservas_temporarias
  AFTER INSERT OR UPDATE OR DELETE ON public.reservas_temporarias
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Contrato Templates
CREATE TRIGGER audit_contrato_templates
  AFTER INSERT OR UPDATE OR DELETE ON public.contrato_templates
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Contrato Versões
CREATE TRIGGER audit_contrato_versoes
  AFTER INSERT OR UPDATE OR DELETE ON public.contrato_versoes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Contrato Documentos
CREATE TRIGGER audit_contrato_documentos
  AFTER INSERT OR UPDATE OR DELETE ON public.contrato_documentos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Contrato Pendências
CREATE TRIGGER audit_contrato_pendencias
  AFTER INSERT OR UPDATE OR DELETE ON public.contrato_pendencias
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Empreendimento Documentos
CREATE TRIGGER audit_empreendimento_documentos
  AFTER INSERT OR UPDATE OR DELETE ON public.empreendimento_documentos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Empreendimento Mídias
CREATE TRIGGER audit_empreendimento_midias
  AFTER INSERT OR UPDATE OR DELETE ON public.empreendimento_midias
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Empreendimento Corretores
CREATE TRIGGER audit_empreendimento_corretores
  AFTER INSERT OR UPDATE OR DELETE ON public.empreendimento_corretores
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Empreendimento Imobiliárias
CREATE TRIGGER audit_empreendimento_imobiliarias
  AFTER INSERT OR UPDATE OR DELETE ON public.empreendimento_imobiliarias
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Mapa Empreendimento
CREATE TRIGGER audit_mapa_empreendimento
  AFTER INSERT OR UPDATE OR DELETE ON public.mapa_empreendimento
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Negociação Histórico
CREATE TRIGGER audit_negociacao_historico
  AFTER INSERT OR UPDATE OR DELETE ON public.negociacao_historico
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Proposta Simulação
CREATE TRIGGER audit_proposta_simulacao
  AFTER INSERT OR UPDATE OR DELETE ON public.proposta_simulacao
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Proposta Clientes
CREATE TRIGGER audit_proposta_clientes
  AFTER INSERT OR UPDATE OR DELETE ON public.proposta_clientes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Reserva Documentos
CREATE TRIGGER audit_reserva_documentos
  AFTER INSERT OR UPDATE OR DELETE ON public.reserva_documentos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Modules
CREATE TRIGGER audit_modules
  AFTER INSERT OR UPDATE OR DELETE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Role Permissions
CREATE TRIGGER audit_role_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- User Empreendimentos
CREATE TRIGGER audit_user_empreendimentos
  AFTER INSERT OR UPDATE OR DELETE ON public.user_empreendimentos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();