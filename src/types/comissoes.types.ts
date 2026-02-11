import type { Database } from '@/integrations/supabase/types';

// Enums
export type ComissaoStatus = 'pendente' | 'parcialmente_pago' | 'pago' | 'cancelado';
export type ParcelaStatus = 'pendente' | 'paga' | 'atrasada' | 'cancelada';

// Labels
export const COMISSAO_STATUS_LABELS: Record<ComissaoStatus, string> = {
  pendente: 'Pendente',
  parcialmente_pago: 'Parcialmente Pago',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

export const PARCELA_STATUS_LABELS: Record<ParcelaStatus, string> = {
  pendente: 'Pendente',
  paga: 'Paga',
  atrasada: 'Atrasada',
  cancelada: 'Cancelada',
};

// Colors for badges
export const COMISSAO_STATUS_COLORS: Record<ComissaoStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  parcialmente_pago: 'bg-blue-100 text-blue-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
};

export const PARCELA_STATUS_COLORS: Record<ParcelaStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  paga: 'bg-green-100 text-green-800',
  atrasada: 'bg-red-100 text-red-800',
  cancelada: 'bg-gray-100 text-gray-800',
};

// Interfaces
export interface ConfiguracaoComissoes {
  id: string;
  empreendimento_id: string | null;
  percentual_padrao_corretor: number;
  percentual_padrao_imobiliaria: number;
  regra_calculo: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// Interface de Comissão com suporte a corretor e imobiliária
export interface Comissao {
  id: string;
  numero: string;
  contrato_id: string | null;
  empreendimento_id: string;
  gestor_id: string | null;
  corretor_id: string | null;
  imobiliaria_id: string | null;
  valor_venda: number;
  percentual_comissao: number;
  valor_comissao: number;
  percentual_corretor: number | null;
  percentual_imobiliaria: number | null;
  valor_corretor: number | null;
  valor_imobiliaria: number | null;
  status: ComissaoStatus;
  status_corretor: ComissaoStatus;
  status_imobiliaria: ComissaoStatus;
  data_pagamento: string | null;
  data_pagamento_corretor: string | null;
  data_pagamento_imobiliaria: string | null;
  nf_numero: string | null;
  nf_corretor: string | null;
  nf_imobiliaria: string | null;
  observacoes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  contrato?: { numero: string } | null;
  empreendimento?: { nome: string } | null;
  gestor?: { full_name: string } | null;
  corretor?: { nome_completo: string } | null;
  imobiliaria?: { nome: string } | null;
}

export interface ComissaoParcela {
  id: string;
  comissao_id: string;
  tipo: 'gestor';
  parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: ParcelaStatus;
  comprovante_url: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

// FormData simplificado para Gestor do Produto
export interface ComissaoFormData {
  contrato_id?: string;
  empreendimento_id: string;
  gestor_id?: string;
  valor_venda: number;
  percentual_comissao: number;
  valor_comissao: number;
  observacoes?: string;
}

export interface ComissaoFilters {
  empreendimento_id?: string;
  gestor_id?: string;
  status?: ComissaoStatus;
}

export interface PagamentoData {
  comissao_id: string;
  data_pagamento: string;
  nf_numero?: string;
}
