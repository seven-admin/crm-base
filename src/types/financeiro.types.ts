// Tipos para o módulo Financeiro - Fluxo de Caixa

export type TipoFluxo = 'entrada' | 'saida' | 'receber' | 'pagar';
export type TipoLancamento = 'pagar' | 'receber';
export type StatusLancamento = 'pendente' | 'pago' | 'cancelado' | 'vencido';
export type StatusConferencia = 'pendente' | 'conferido' | 'aprovado';
export type TipoBonificacao = 'meta_6_meses' | 'meta_12_meses' | 'venda_mensal';
export type StatusBonificacao = 'pendente' | 'calculado' | 'pago' | 'lancado';
export type TipoConta = 'receita' | 'despesa';
export type CategoriaConta = 'operacional' | 'financeiro' | 'investimento';

export interface PlanoConta {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoConta;
  categoria: CategoriaConta;
  pai_id: string | null;
  ordem: number;
  is_active: boolean;
  created_at: string;
}

export interface CategoriaFluxo {
  id: string;
  nome: string;
  tipo: TipoFluxo;
  categoria_pai_id: string | null;
  ordem: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CentroCusto {
  id: string;
  nome: string;
  descricao: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  empreendimentos?: { id: string; nome: string }[];
}

export interface SaldoMensal {
  id: string;
  mes: number;
  ano: number;
  saldo_inicial: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BeneficiarioTipo = 'gestor' | 'corretor' | 'imobiliaria' | 'fornecedor' | 'outro';

export interface LancamentoFinanceiro {
  id: string;
  tipo: TipoFluxo;
  categoria_fluxo: string | null;
  subcategoria: string | null;
  conta_id: string | null;
  centro_custo_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  data_competencia: string | null;
  status: StatusLancamento;
  status_conferencia: StatusConferencia;
  conferido_por: string | null;
  conferido_em: string | null;
  comissao_id: string | null;
  bonificacao_id: string | null;
  contrato_id: string | null;
  empreendimento_id: string | null;
  nf_numero: string | null;
  nf_quitada: boolean;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Campos de recorrência
  is_recorrente: boolean | null;
  recorrencia_pai_id: string | null;
  recorrencia_frequencia: string | null;
  // Campos de beneficiário
  beneficiario_id: string | null;
  beneficiario_tipo: BeneficiarioTipo | null;
  // Relacionamentos
  categoria?: CategoriaFluxo;
  centro_custo?: CentroCusto;
  empreendimento?: {
    id: string;
    nome: string;
  };
  contrato?: {
    id: string;
    numero: string;
  };
  beneficiario?: {
    id: string;
    full_name: string;
  };
}

export interface Bonificacao {
  id: string;
  empreendimento_id: string;
  user_id: string;
  tipo: TipoBonificacao;
  periodo_inicio: string;
  periodo_fim: string;
  meta_unidades: number | null;
  unidades_vendidas: number;
  valor_bonificacao: number;
  percentual_atingimento: number;
  status: StatusBonificacao;
  nf_numero: string | null;
  nf_quitada: boolean;
  data_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  empreendimento?: {
    id: string;
    nome: string;
  };
  user?: {
    id: string;
    full_name: string;
  };
}

// Frequência de recorrência
export type RecorrenciaFrequencia = 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';

export const RECORRENCIA_LABELS: Record<RecorrenciaFrequencia, string> = {
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

export const RECORRENCIA_MESES: Record<RecorrenciaFrequencia, number> = {
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

export interface LancamentoFormData {
  tipo: TipoFluxo;
  categoria_fluxo?: string;
  subcategoria?: string;
  centro_custo_id?: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_competencia?: string;
  empreendimento_id?: string;
  contrato_id?: string;
  nf_numero?: string;
  observacoes?: string;
  // Campos de recorrência
  is_recorrente?: boolean;
  recorrencia_frequencia?: RecorrenciaFrequencia;
  // Campos de beneficiário
  beneficiario_id?: string;
  beneficiario_tipo?: BeneficiarioTipo;
}

export interface CategoriaFluxoFormData {
  nome: string;
  tipo: TipoFluxo;
  categoria_pai_id?: string;
  ordem?: number;
}

export interface CentroCustoFormData {
  nome: string;
  descricao?: string;
  empreendimento_ids?: string[];
}

// Labels
export const TIPO_FLUXO_LABELS: Record<TipoFluxo, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  receber: 'A Receber',
  pagar: 'A Pagar'
};

export const STATUS_LANCAMENTO_LABELS: Record<StatusLancamento, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
  vencido: 'Vencido'
};

export const STATUS_LANCAMENTO_COLORS: Record<StatusLancamento, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
  vencido: 'bg-red-100 text-red-800'
};

export const STATUS_CONFERENCIA_LABELS: Record<StatusConferencia, string> = {
  pendente: 'Pendente',
  conferido: 'Conferido',
  aprovado: 'Aprovado'
};

export const STATUS_CONFERENCIA_COLORS: Record<StatusConferencia, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  conferido: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-green-100 text-green-800'
};

export const TIPO_BONIFICACAO_LABELS: Record<TipoBonificacao, string> = {
  meta_6_meses: 'Meta 6 Meses',
  meta_12_meses: 'Meta 12 Meses',
  venda_mensal: 'Venda Mensal'
};

export const STATUS_BONIFICACAO_LABELS: Record<StatusBonificacao, string> = {
  pendente: 'Pendente',
  calculado: 'Calculado',
  pago: 'Pago',
  lancado: 'Lançado no Caixa'
};

export const STATUS_BONIFICACAO_COLORS: Record<StatusBonificacao, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  calculado: 'bg-blue-100 text-blue-800',
  pago: 'bg-green-100 text-green-800',
  lancado: 'bg-purple-100 text-purple-800'
};

// Categorias padrão para Fluxo de Caixa
export const CATEGORIAS_ENTRADA_PADRAO = [
  'Recebimentos de Clientes',
  'Adiantamentos',
  'Aportes',
  'Reembolsos',
  'Outras Entradas'
];

export const CATEGORIAS_SAIDA_PADRAO = [
  { categoria: 'Impostos', subcategorias: ['ISS', 'Simples', 'IRPJ', 'CSLL'] },
  { categoria: 'Custos Diretos', subcategorias: ['Comissões', 'Terceiros'] },
  { categoria: 'Despesas Administrativas', subcategorias: ['Aluguel', 'Sistema', 'Contador', 'Pessoal'] },
  { categoria: 'Despesas Comerciais', subcategorias: ['CRM', 'Telefone', 'Transporte'] },
  { categoria: 'Marketing', subcategorias: ['Tráfego', 'Designer', 'Mídia'] },
  { categoria: 'Despesas Financeiras', subcategorias: ['Juros', 'Tarifas Bancárias'] },
  { categoria: 'Pró-labore e Distribuição', subcategorias: ['Pró-labore', 'Distribuição de Lucro'] }
];

// Tipos legados para compatibilidade
export interface UsuarioEmpreendimentoBonus {
  id: string;
  user_id: string;
  empreendimento_id: string;
  elegivel_bonificacao: boolean;
  created_at: string;
}

export interface BonificacaoFormData {
  empreendimento_id: string;
  user_id: string;
  tipo: TipoBonificacao;
  periodo_inicio: string;
  periodo_fim: string;
  meta_unidades?: number;
  valor_bonificacao?: number;
  observacoes?: string;
}