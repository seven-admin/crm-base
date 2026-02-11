import type { Cliente } from './negociacoes.types';

export type ContratoStatus = 'em_geracao' | 'enviado_assinatura' | 'assinado' | 'enviado_incorporador' | 'aprovado' | 'reprovado' | 'cancelado';

export const CONTRATO_STATUS_LABELS: Record<ContratoStatus, string> = {
  em_geracao: 'Em Geração',
  enviado_assinatura: 'Enviado p/ Assinatura',
  assinado: 'Assinado',
  enviado_incorporador: 'Enviado ao Incorporador',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  cancelado: 'Cancelado'
};

export const CONTRATO_STATUS_COLORS: Record<ContratoStatus, string> = {
  em_geracao: 'bg-slate-500',
  enviado_assinatura: 'bg-blue-500',
  assinado: 'bg-green-500',
  enviado_incorporador: 'bg-amber-500',
  aprovado: 'bg-emerald-600',
  reprovado: 'bg-red-500',
  cancelado: 'bg-gray-500'
};

export type DocumentoContratoStatus = 'pendente' | 'enviado' | 'aprovado' | 'reprovado';

export const DOCUMENTO_STATUS_LABELS: Record<DocumentoContratoStatus, string> = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado'
};

export type PendenciaStatus = 'aberta' | 'resolvida' | 'cancelada';

export const PENDENCIA_STATUS_LABELS: Record<PendenciaStatus, string> = {
  aberta: 'Aberta',
  resolvida: 'Resolvida',
  cancelada: 'Cancelada'
};

export interface ContratoTemplate {
  id: string;
  nome: string;
  descricao?: string;
  conteudo_html: string;
  variaveis?: string[];
  empreendimento_id?: string;
  empreendimento?: { id: string; nome: string };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContratoUnidade {
  id: string;
  contrato_id: string;
  unidade_id: string;
  unidade?: {
    id: string;
    numero: string;
    andar?: number;
    valor?: number;
    bloco?: { nome: string };
    tipologia?: { nome: string };
  };
  valor_unidade?: number;
  created_at: string;
}

export interface Contrato {
  id: string;
  numero: string;
  cliente_id: string;
  cliente?: Cliente;
  empreendimento_id: string;
  empreendimento?: { id: string; nome: string; matricula_mae?: string; registro_incorporacao?: string };
  corretor_id?: string;
  corretor?: { id: string; nome_completo: string };
  imobiliaria_id?: string;
  imobiliaria?: { id: string; nome: string };
  gestor_id?: string;
  gestor?: { id: string; full_name: string };
  template_id?: string;
  template?: ContratoTemplate;
  negociacao_id?: string;
  modalidade_id?: string;
  status: ContratoStatus;
  conteudo_html?: string;
  versao: number;
  valor_contrato?: number;
  data_geracao: string;
  data_envio_assinatura?: string;
  data_assinatura?: string;
  data_envio_incorporador?: string;
  data_aprovacao?: string;
  motivo_reprovacao?: string;
  observacoes?: string;
  unidades?: ContratoUnidade[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContratoVersao {
  id: string;
  contrato_id: string;
  versao: number;
  conteudo_html: string;
  alterado_por?: string;
  alterado_por_profile?: { id: string; full_name: string };
  motivo_alteracao?: string;
  created_at: string;
}

export interface ContratoDocumento {
  id: string;
  contrato_id: string;
  tipo: string;
  nome: string;
  arquivo_url?: string;
  status: DocumentoContratoStatus;
  obrigatorio: boolean;
  observacao?: string;
  created_at: string;
  updated_at: string;
}

export interface ContratoPendencia {
  id: string;
  contrato_id: string;
  descricao: string;
  responsavel_id?: string;
  responsavel?: { id: string; full_name: string };
  prazo?: string;
  status: PendenciaStatus;
  resolucao?: string;
  created_at: string;
  updated_at: string;
}

export interface ContratoFormData {
  cliente_id: string;
  empreendimento_id: string;
  corretor_id?: string;
  imobiliaria_id?: string;
  gestor_id?: string;
  template_id?: string;
  valor_contrato?: number;
  observacoes?: string;
  unidade_ids: string[];
  negociacao_id?: string;
  modalidade_id?: string;
}

export interface ContratoFilters {
  status?: ContratoStatus;
  empreendimento_id?: string;
  corretor_id?: string;
}

// Variáveis disponíveis para substituição no template
export const CONTRATO_VARIAVEIS = [
  { key: 'nome_cliente', label: 'Nome do Cliente', example: 'João da Silva' },
  { key: 'cpf', label: 'CPF do Cliente', example: '000.000.000-00' },
  { key: 'rg', label: 'RG do Cliente', example: '00.000.000-0' },
  { key: 'endereco_cliente', label: 'Endereço do Cliente', example: 'Rua Exemplo, 123 - Bairro - Cidade/UF' },
  { key: 'empreendimento', label: 'Nome do Empreendimento', example: 'Residencial Exemplo' },
  { key: 'unidade', label: 'Número da Unidade', example: '101' },
  { key: 'bloco', label: 'Bloco', example: 'A' },
  { key: 'matricula', label: 'Matrícula Mãe', example: '12345' },
  { key: 'memorial', label: 'Registro de Incorporação', example: 'R-1/12345' },
  { key: 'valor', label: 'Valor do Contrato', example: 'R$ 500.000,00' },
  { key: 'data_atual', label: 'Data Atual', example: '01/01/2025' },
] as const;

export const TIPOS_DOCUMENTOS_CONTRATO = [
  'RG',
  'CPF',
  'Comprovante de Residência',
  'Comprovante de Renda',
  'Certidão de Casamento',
  'Procuração',
  'Contrato Assinado',
  'Outros'
] as const;
