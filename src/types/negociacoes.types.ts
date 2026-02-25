import type { FunilEtapa } from './funis.types';
import type { Cliente } from './clientes.types';

// Re-export Cliente types for backward compatibility
export type { Cliente, ClienteFormData, ClienteFase, ClienteTemperatura } from './clientes.types';
export { CLIENTE_ORIGENS } from './clientes.types';

// Legacy types - mantidas para compatibilidade com histórico
export type EtapaFunil = 'lead' | 'atendimento' | 'proposta' | 'negociacao' | 'fechado' | 'perdido';

export const ETAPAS_FUNIL: EtapaFunil[] = ['lead', 'atendimento', 'proposta', 'negociacao', 'fechado', 'perdido'];

export const ETAPA_FUNIL_LABELS: Record<EtapaFunil, string> = {
  lead: 'Lead',
  atendimento: 'Atendimento',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido'
};

export const ETAPA_FUNIL_COLORS: Record<EtapaFunil, string> = {
  lead: 'bg-slate-500',
  atendimento: 'bg-blue-500',
  proposta: 'bg-amber-500',
  negociacao: 'bg-purple-500',
  fechado: 'bg-emerald-500',
  perdido: 'bg-red-500'
};

export const ETAPA_FUNIL_BG_COLORS: Record<EtapaFunil, string> = {
  lead: 'bg-slate-500/10 border-slate-500/30',
  atendimento: 'bg-blue-500/10 border-blue-500/30',
  proposta: 'bg-amber-500/10 border-amber-500/30',
  negociacao: 'bg-purple-500/10 border-purple-500/30',
  fechado: 'bg-emerald-500/10 border-emerald-500/30',
  perdido: 'bg-red-500/10 border-red-500/30'
};

// ====================================================
// Status de Proposta (integrado à Negociação)
// ====================================================

export type StatusProposta = 'rascunho' | 'em_analise' | 'aprovada_incorporador' | 'contra_proposta' | 'enviada' | 'aceita' | 'recusada' | 'expirada' | 'convertida';

export const STATUS_PROPOSTA_LABELS: Record<StatusProposta, string> = {
  rascunho: 'Rascunho',
  em_analise: 'Em Análise',
  aprovada_incorporador: 'Aprovada pelo Incorporador',
  contra_proposta: 'Contra Proposta',
  enviada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
  expirada: 'Expirada',
  convertida: 'Convertida'
};

export const STATUS_PROPOSTA_COLORS: Record<StatusProposta, string> = {
  rascunho: 'bg-slate-500',
  em_analise: 'bg-yellow-500',
  aprovada_incorporador: 'bg-teal-500',
  contra_proposta: 'bg-orange-500',
  enviada: 'bg-blue-500',
  aceita: 'bg-green-500',
  recusada: 'bg-red-500',
  expirada: 'bg-amber-500',
  convertida: 'bg-purple-500'
};

export const STATUS_PROPOSTA_TEXT_COLORS: Record<StatusProposta, string> = {
  rascunho: 'text-slate-600',
  em_analise: 'text-yellow-600',
  aprovada_incorporador: 'text-teal-600',
  contra_proposta: 'text-orange-600',
  enviada: 'text-blue-600',
  aceita: 'text-green-600',
  recusada: 'text-red-600',
  expirada: 'text-amber-600',
  convertida: 'text-purple-600'
};

// ====================================================
// Negociação (unificada com Proposta)
// ====================================================

// ====================================================
// Status de Aprovação (Gatekeeper Flow)
// ====================================================

export type StatusAprovacao = 'pendente' | 'aprovada' | 'rejeitada';

export const STATUS_APROVACAO_LABELS: Record<StatusAprovacao, string> = {
  pendente: 'Aguardando Aprovação',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada'
};

export const STATUS_APROVACAO_COLORS: Record<StatusAprovacao, string> = {
  pendente: '#f59e0b', // amber
  aprovada: '#22c55e', // green
  rejeitada: '#ef4444'  // red
};

// ====================================================
// Negociação (unificada com Proposta)
// ====================================================

export interface Negociacao {
  id: string;
  codigo: string;
  cliente_id: string;
  cliente?: Cliente;
  empreendimento_id: string;
  empreendimento?: { id: string; nome: string };
  corretor_id?: string;
  corretor?: { id: string; nome_completo: string };
  imobiliaria_id?: string;
  imobiliaria?: { id: string; nome: string };
  gestor_id?: string;
  gestor?: { id: string; full_name: string };
  modalidade_id?: string;
  modalidade?: { id: string; nome: string };
  // Legacy field - mantido para histórico
  etapa: EtapaFunil;
  // New dynamic stage
  funil_etapa_id?: string;
  funil_etapa?: FunilEtapa;
  valor_negociacao?: number;
  valor_entrada?: number;
  condicao_pagamento?: string;
  observacoes?: string;
  motivo_perda?: string;
  data_previsao_fechamento?: string;
  data_fechamento?: string;
  ordem_kanban: number;
  unidades?: NegociacaoUnidade[];
  
  // ====== Campos de Rastreamento de Tempo ======
  data_primeiro_atendimento?: string | null;
  data_proposta_gerada?: string | null;
  data_contrato_gerado?: string | null;
  
  // ====== Campos de Validação da Ficha ======
  ficha_completa?: boolean;
  documentos_anexados?: boolean;
  dados_filiacao_ok?: boolean;
  estado_civil_validado?: boolean;
  validacao_comercial_em?: string;
  validacao_comercial_por?: string;
  motivo_validacao?: string;
  
  // ====== Campos de Aprovação (Gatekeeper Flow) ======
  status_aprovacao?: StatusAprovacao;
  solicitada_em?: string;
  aprovada_em?: string;
  rejeitada_em?: string;
  motivo_rejeicao?: string;
  valor_total_fechamento?: number;
  indice_correcao?: string;
  created_by?: string;
  updated_by?: string;
  
  // ====== Campos de Proposta (unificados) ======
  numero_proposta?: string;
  status_proposta?: StatusProposta;
  data_emissao_proposta?: string;
  data_validade_proposta?: string;
  valor_tabela?: number;
  valor_proposta?: number;
  desconto_percentual?: number;
  desconto_valor?: number;
  motivo_recusa?: string;
  data_aceite?: string;
  data_conversao?: string;
  contrato_id?: string;
  simulacao_dados?: SimulacaoDados;
  
  // ====== Campos de Aprovação Incorporador ======
  motivo_contra_proposta?: string;
  aprovada_incorporador_em?: string;
  aprovada_incorporador_por?: string;
  clientes?: NegociacaoCliente[];
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NegociacaoCondicaoLocal {
  _localId: string;
  tipo_parcela_codigo: string;
  descricao?: string;
  quantidade: number;
  valor?: number;
  valor_tipo: string;
  data_vencimento?: string;
  intervalo_dias: number;
  evento_vencimento?: string;
  com_correcao: boolean;
  indice_correcao: string;
  parcelas_sem_correcao: number;
  forma_quitacao: string;
  forma_pagamento: string;
  observacao_texto?: string;
}

export interface NegociacaoFormData {
  cliente_id?: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  empreendimento_id: string;
  corretor_id?: string;
  imobiliaria_id?: string;
  modalidade_id?: string;
  etapa?: EtapaFunil;
  funil_etapa_id?: string;
  valor_negociacao?: number;
  valor_entrada?: number;
  condicao_pagamento?: string;
  observacoes?: string;
  data_previsao_fechamento?: string;
  unidade_ids?: string[];
  condicoes_pagamento?: NegociacaoCondicaoLocal[];
}

export interface NegociacaoUnidade {
  id: string;
  negociacao_id: string;
  unidade_id: string;
  unidade?: { 
    id: string; 
    codigo?: string;
    numero: string; 
    valor?: number;
    status?: string;
    bloco?: { nome: string } 
  };
  valor_unidade?: number;
  valor_tabela?: number;
  valor_proposta?: number;
  created_at: string;
}

export interface NegociacaoCliente {
  id: string;
  negociacao_id: string;
  cliente_id: string;
  cliente?: Cliente;
  tipo: 'titular' | 'dependente';
  created_at: string;
}

export interface NegociacaoHistorico {
  id: string;
  negociacao_id: string;
  user_id?: string;
  user?: { full_name: string };
  etapa_anterior?: EtapaFunil;
  etapa_nova: EtapaFunil;
  funil_etapa_anterior_id?: string;
  funil_etapa_nova_id?: string;
  observacao?: string;
  created_at: string;
}

export interface MoverNegociacaoData {
  etapa_nova?: EtapaFunil;
  funil_etapa_id?: string;
  observacao?: string;
  motivo_perda?: string;
  data_fechamento?: string;
}

// ====================================================
// Dados de Simulação (salvos na negociação)
// ====================================================

export interface SimulacaoDados {
  valor_unidade: number;
  percentual_entrada: number;
  valor_entrada: number;
  parcelas_entrada: number;
  valor_parcela_entrada: number;
  percentual_mensal: number;
  valor_mensal: number;
  parcelas_mensais: number;
  valor_parcela_mensal: number;
  percentual_anual: number;
  valor_anual: number;
  parcelas_anuais: number;
  valor_parcela_anual: number;
  percentual_chaves: number;
  valor_chaves: number;
  total_financiado: number;
  total_geral: number;
  configuracao_id?: string;
}

// ====================================================
// Dados para Gerar Proposta
// ====================================================

export interface GerarPropostaData {
  data_validade: string;
  valor_tabela?: number;
  valor_proposta?: number;
  desconto_percentual?: number;
  desconto_valor?: number;
  condicao_pagamento?: string;
  simulacao_dados?: SimulacaoDados;
}

export interface EnviarPropostaData {
  observacao?: string;
}

export interface RecusarPropostaData {
  motivo_recusa: string;
}

// ====================================================
// Filtros
// ====================================================

export interface NegociacaoFilters {
  empreendimento_id?: string;
  corretor_id?: string;
  funil_etapa_id?: string;
  status_proposta?: StatusProposta;
  com_proposta?: boolean;
}
