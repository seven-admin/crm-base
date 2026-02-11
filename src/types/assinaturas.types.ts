export type SignatarioTipo = 'comprador' | 'conjuge' | 'testemunha_1' | 'testemunha_2' | 'representante_legal' | 'incorporador';
export type SignatarioStatus = 'pendente' | 'enviado' | 'visualizado' | 'assinado' | 'recusado';
export type AprovadorTipo = 'corretor' | 'gestor_comercial' | 'juridico' | 'diretoria' | 'incorporador';
export type AprovacaoStatus = 'pendente' | 'aprovado' | 'reprovado' | 'em_revisao';

export const SIGNATARIO_TIPO_LABELS: Record<SignatarioTipo, string> = {
  comprador: 'Comprador',
  conjuge: 'Cônjuge',
  testemunha_1: 'Testemunha 1',
  testemunha_2: 'Testemunha 2',
  representante_legal: 'Representante Legal',
  incorporador: 'Incorporador'
};

export const SIGNATARIO_STATUS_LABELS: Record<SignatarioStatus, string> = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  visualizado: 'Visualizado',
  assinado: 'Assinado',
  recusado: 'Recusado'
};

export const SIGNATARIO_STATUS_COLORS: Record<SignatarioStatus, string> = {
  pendente: 'bg-slate-500',
  enviado: 'bg-blue-500',
  visualizado: 'bg-amber-500',
  assinado: 'bg-emerald-500',
  recusado: 'bg-red-500'
};

export const APROVADOR_TIPO_LABELS: Record<AprovadorTipo, string> = {
  corretor: 'Corretor',
  gestor_comercial: 'Gestor Comercial',
  juridico: 'Jurídico',
  diretoria: 'Diretoria',
  incorporador: 'Incorporador'
};

export const APROVACAO_STATUS_LABELS: Record<AprovacaoStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  em_revisao: 'Em Revisão'
};

export const APROVACAO_STATUS_COLORS: Record<AprovacaoStatus, string> = {
  pendente: 'bg-slate-500',
  aprovado: 'bg-emerald-500',
  reprovado: 'bg-red-500',
  em_revisao: 'bg-amber-500'
};

export interface ContratoSignatario {
  id: string;
  contrato_id: string;
  tipo: SignatarioTipo;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  ordem: number;
  obrigatorio: boolean;
  status: SignatarioStatus;
  data_envio?: string;
  data_visualizacao?: string;
  data_assinatura?: string;
  ip_assinatura?: string;
  user_agent?: string;
  motivo_recusa?: string;
  token_assinatura?: string;
  created_at: string;
  updated_at: string;
}

export interface ContratoAprovacao {
  id: string;
  contrato_id: string;
  etapa: number;
  tipo_aprovador: AprovadorTipo;
  aprovador_id?: string;
  aprovador?: { id: string; full_name: string; email: string };
  status: AprovacaoStatus;
  observacao?: string;
  data_envio?: string;
  data_resposta?: string;
  created_at: string;
  updated_at: string;
}

export interface FluxoAprovacaoConfig {
  id: string;
  empreendimento_id?: string;
  etapa: number;
  tipo_aprovador: AprovadorTipo;
  nome_etapa: string;
  obrigatoria: boolean;
  prazo_horas?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SignatarioFormData {
  tipo: SignatarioTipo;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  ordem: number;
  obrigatorio: boolean;
}
