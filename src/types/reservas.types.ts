// Enums
export type ReservaStatus = 'ativa' | 'expirada' | 'convertida' | 'cancelada';

// Labels
export const RESERVA_STATUS_LABELS: Record<ReservaStatus, string> = {
  ativa: 'Ativa',
  expirada: 'Expirada',
  convertida: 'Convertida',
  cancelada: 'Cancelada',
};

// Colors for badges
export const RESERVA_STATUS_COLORS: Record<ReservaStatus, string> = {
  ativa: 'bg-green-100 text-green-800',
  expirada: 'bg-red-100 text-red-800',
  convertida: 'bg-blue-100 text-blue-800',
  cancelada: 'bg-gray-100 text-gray-800',
};

// Interfaces
export interface ReservaTemporaria {
  id: string;
  protocolo: string;
  corretor_id: string;
  unidade_id: string;
  cliente_id: string | null;
  empreendimento_id: string;
  data_reserva: string;
  data_expiracao: string;
  status: ReservaStatus;
  observacoes: string | null;
  notificacao_enviada: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  corretor?: { nome_completo: string } | null;
  unidade?: { numero: string; bloco?: { nome: string } | null } | null;
  cliente?: { nome: string } | null;
  empreendimento?: { nome: string } | null;
}

export interface ReservaDocumento {
  id: string;
  reserva_id: string;
  tipo: string;
  nome: string;
  arquivo_url: string;
  created_at: string;
}

export interface ReservaFormData {
  unidade_id: string;
  cliente_id?: string;
  empreendimento_id: string;
  data_expiracao: string;
  observacoes?: string;
}

export interface ReservaFilters {
  empreendimento_id?: string;
  status?: ReservaStatus;
}

// Expiration options (in hours)
export const EXPIRACAO_OPTIONS = [
  { value: 24, label: '24 horas' },
  { value: 48, label: '48 horas' },
  { value: 72, label: '72 horas' },
];
