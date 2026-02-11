import { Json } from '@/integrations/supabase/types';

// Status da proposta
export type StatusProposta = 'rascunho' | 'enviada' | 'aceita' | 'recusada' | 'expirada' | 'convertida';

export const STATUS_PROPOSTA_LABELS: Record<StatusProposta, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
  expirada: 'Expirada',
  convertida: 'Convertida',
};

export const STATUS_PROPOSTA_COLORS: Record<StatusProposta, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  enviada: 'bg-blue-100 text-blue-800',
  aceita: 'bg-green-100 text-green-800',
  recusada: 'bg-red-100 text-red-800',
  expirada: 'bg-orange-100 text-orange-800',
  convertida: 'bg-purple-100 text-purple-800',
};

// Interface principal da proposta
export interface Proposta {
  id: string;
  numero: string;
  
  // Vínculos
  cliente_id: string;
  empreendimento_id: string;
  corretor_id: string | null;
  imobiliaria_id: string | null;
  gestor_id: string | null;
  
  // Valores
  valor_tabela: number | null;
  valor_proposta: number | null;
  desconto_percentual: number | null;
  desconto_valor: number | null;
  
  // Datas
  data_emissao: string;
  data_validade: string;
  
  // Status
  status: StatusProposta;
  motivo_recusa: string | null;
  data_aceite: string | null;
  
  // Simulação
  simulacao_dados: Json | null;
  observacoes: string | null;
  
  // Auditoria
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  
  // Joins (opcional)
  cliente?: {
    id: string;
    nome: string;
    telefone?: string | null;
    email?: string | null;
    cpf?: string | null;
  };
  empreendimento?: {
    id: string;
    nome: string;
  };
  corretor?: {
    id: string;
    nome_completo: string;
  };
  imobiliaria?: {
    id: string;
    nome: string;
  };
  gestor?: {
    id: string;
    full_name: string;
  };
  unidades?: PropostaUnidade[];
  condicoes_pagamento?: PropostaCondicaoPagamento[];
}

// Unidade associada à proposta
export interface PropostaUnidade {
  id: string;
  proposta_id: string;
  unidade_id: string;
  valor_tabela: number | null;
  valor_proposta: number | null;
  created_at: string;
  
  // Join (opcional)
  unidade?: {
    id: string;
    codigo: string;
    area_privativa: number | null;
    valor_tabela: number | null;
    bloco?: {
      nome: string;
    };
    tipologia?: {
      nome: string;
    };
  };
}

// Condição de pagamento da proposta
export interface PropostaCondicaoPagamento {
  id: string;
  proposta_id: string;
  tipo_parcela_codigo: string;
  quantidade: number;
  valor: number;
  valor_tipo: string | null;
  data_vencimento: string | null;
  intervalo_dias: number | null;
  com_correcao: boolean | null;
  indice_correcao: string | null;
  forma_pagamento: string | null;
  descricao: string | null;
  ordem: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Dados para criar uma proposta
export interface PropostaFormData {
  cliente_id: string;
  empreendimento_id: string;
  corretor_id?: string | null;
  imobiliaria_id?: string | null;
  gestor_id?: string | null;
  
  valor_tabela?: number | null;
  valor_proposta?: number | null;
  desconto_percentual?: number | null;
  desconto_valor?: number | null;
  
  data_validade: string;
  observacoes?: string | null;
  simulacao_dados?: Json | null;
  
  unidades: {
    unidade_id: string;
    valor_tabela?: number | null;
    valor_proposta?: number | null;
  }[];
  
  condicoes_pagamento?: {
    tipo_parcela_codigo: string;
    quantidade: number;
    valor: number;
    valor_tipo?: string;
    intervalo_dias?: number;
    com_correcao?: boolean;
    indice_correcao?: string;
    forma_pagamento?: string;
    descricao?: string;
    ordem: number;
  }[];
}

// Filtros para listagem
export interface PropostaFilters {
  status?: StatusProposta;
  empreendimento_id?: string;
  cliente_id?: string;
  corretor_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

// Dados para aceitar proposta
export interface AceitarPropostaData {
  proposta_id: string;
}

// Dados para recusar proposta
export interface RecusarPropostaData {
  proposta_id: string;
  motivo_recusa: string;
}

// Dados para converter proposta em negociação
export interface ConverterPropostaEmNegociacaoData {
  proposta_id: string;
  etapa_inicial_id?: string;
}
