// Tipos de parcela disponíveis no sistema
export const TIPOS_PARCELA = [
  'entrada',
  'mensal_fixa',
  'mensal_serie',
  'intermediaria',
  'residual',
  'corretagem',
] as const;

export type TipoParcelaCodigo = typeof TIPOS_PARCELA[number];

export const TIPO_PARCELA_LABELS: Record<TipoParcelaCodigo, string> = {
  entrada: 'Parcela de Entrada',
  mensal_fixa: 'Parcela Mensal Fixa',
  mensal_serie: 'Série de Parcelas Mensais',
  intermediaria: 'Parcela Intermediária (Balão)',
  residual: 'Parcela Residual Final',
  corretagem: 'Corretagem',
};

// Formas de quitação
export const FORMAS_QUITACAO = ['dinheiro', 'veiculo', 'imovel', 'outro_bem'] as const;
export type FormaQuitacao = typeof FORMAS_QUITACAO[number];

export const FORMA_QUITACAO_LABELS: Record<FormaQuitacao, string> = {
  dinheiro: 'Dinheiro',
  veiculo: 'Veículo',
  imovel: 'Imóvel',
  outro_bem: 'Outro Bem',
};

// Formas de pagamento (quando dinheiro)
export const FORMAS_PAGAMENTO = ['boleto', 'ted', 'pix', 'cheque', 'nota_fiscal'] as const;
export type FormaPagamento = typeof FORMAS_PAGAMENTO[number];

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  boleto: 'Boleto Bancário',
  ted: 'TED/Transferência',
  pix: 'PIX',
  cheque: 'Cheque',
  nota_fiscal: 'Nota Fiscal',
};

// Eventos de vencimento
export const EVENTOS_VENCIMENTO = ['assinatura', 'habite_se', 'entrega_chaves', 'custom'] as const;
export type EventoVencimento = typeof EVENTOS_VENCIMENTO[number];

export const EVENTO_VENCIMENTO_LABELS: Record<EventoVencimento, string> = {
  assinatura: 'Data da Assinatura',
  habite_se: 'Habite-se',
  entrega_chaves: 'Entrega das Chaves',
  custom: 'Data Específica',
};

// Índices de correção
export const INDICES_CORRECAO = ['INCC', 'IPCA', 'IGP-M', 'CUB'] as const;
export type IndiceCorrecao = typeof INDICES_CORRECAO[number];

// Tipo de valor
export const TIPOS_VALOR = ['fixo', 'percentual'] as const;
export type TipoValor = typeof TIPOS_VALOR[number];

// Interface base para condição de pagamento
export interface CondicaoPagamentoBase {
  tipo_parcela_codigo: TipoParcelaCodigo;
  ordem: number;
  descricao?: string | null;
  
  // Valores
  quantidade: number;
  valor?: number | null;
  valor_tipo: TipoValor;
  
  // Datas
  data_vencimento?: string | null;
  intervalo_dias: number;
  evento_vencimento?: EventoVencimento | null;
  
  // Correção monetária
  com_correcao: boolean;
  indice_correcao: string;
  parcelas_sem_correcao: number;
  
  // Forma de quitação
  forma_quitacao: FormaQuitacao;
  forma_pagamento: FormaPagamento;
  
  // Dados do bem (quando forma_quitacao != 'dinheiro')
  bem_descricao?: string | null;
  bem_marca?: string | null;
  bem_modelo?: string | null;
  bem_ano?: string | null;
  bem_placa?: string | null;
  bem_cor?: string | null;
  bem_renavam?: string | null;
  bem_matricula?: string | null;
  bem_cartorio?: string | null;
  bem_endereco?: string | null;
  bem_area_m2?: number | null;
  bem_valor_avaliado?: number | null;
  bem_observacoes?: string | null;
  
  // Corretagem
  beneficiario_tipo?: 'imobiliaria' | 'corretor' | null;
  beneficiario_id?: string | null;
  
  // Texto adicional
  observacao_texto?: string | null;
  
  is_active: boolean;
}

// Condição vinculada a template
export interface TemplateCondicaoPagamento extends CondicaoPagamentoBase {
  id: string;
  template_id: string;
  created_at: string;
  updated_at: string;
}

// Condição vinculada a contrato
export interface ContratoCondicaoPagamento extends CondicaoPagamentoBase {
  id: string;
  contrato_id: string;
  created_at: string;
  updated_at: string;
}

// Tipo de parcela (referência)
export interface TipoParcela {
  id: string;
  codigo: TipoParcelaCodigo;
  nome: string;
  descricao?: string | null;
  ordem: number;
  is_active: boolean;
}

// Form data para criar/editar condição
export interface CondicaoPagamentoFormData {
  tipo_parcela_codigo: TipoParcelaCodigo;
  descricao?: string;
  quantidade: number;
  valor?: number;
  valor_tipo: TipoValor;
  data_vencimento?: string;
  intervalo_dias: number;
  evento_vencimento?: EventoVencimento;
  com_correcao: boolean;
  indice_correcao: string;
  parcelas_sem_correcao: number;
  forma_quitacao: FormaQuitacao;
  forma_pagamento: FormaPagamento;
  bem_descricao?: string;
  bem_marca?: string;
  bem_modelo?: string;
  bem_ano?: string;
  bem_placa?: string;
  bem_cor?: string;
  bem_renavam?: string;
  bem_matricula?: string;
  bem_cartorio?: string;
  bem_endereco?: string;
  bem_area_m2?: number;
  bem_valor_avaliado?: number;
  bem_observacoes?: string;
  beneficiario_tipo?: 'imobiliaria' | 'corretor';
  beneficiario_id?: string;
  observacao_texto?: string;
}

// Default values para novo item
export const DEFAULT_CONDICAO_PAGAMENTO: CondicaoPagamentoFormData = {
  tipo_parcela_codigo: 'entrada',
  quantidade: 0, // Iniciar zerado - usuário deve digitar
  valor_tipo: 'fixo',
  intervalo_dias: 30,
  com_correcao: false,
  indice_correcao: 'INCC',
  parcelas_sem_correcao: 0,
  forma_quitacao: 'dinheiro',
  forma_pagamento: 'boleto',
};
