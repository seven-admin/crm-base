export type NexaVisitaStatus = 'agendada' | 'confirmada' | 'realizada' | 'no_show' | 'cancelada';

export interface NexaVisita {
  id: string;
  cliente_id: string | null;
  visitante_nome: string | null;
  visitante_telefone: string | null;
  empreendimento_id: string;
  imobiliaria_parceira_id: string | null;
  corretor_id: string | null;
  data_hora: string;
  status: NexaVisitaStatus;
  arqo_lead_id: string | null;
  google_event_id: string | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NexaVisitaWithRelations extends NexaVisita {
  cliente?: { id: string; nome: string; telefone: string | null; email: string | null } | null;
  empreendimento?: { id: string; nome: string } | null;
  imobiliaria?: { id: string; nome: string } | null;
  corretor?: { id: string; nome_completo: string } | null;
}

export interface NexaEvento {
  id: string;
  visita_id: string;
  tipo_evento: string;
  unidade_id: string | null;
  payload: Record<string, unknown>;
  usuario_id: string | null;
  created_at: string;
}

export const NEXA_ROLES = ['nexa_admin', 'nexa_gestor', 'nexa_corretor'] as const;

export const STATUS_LABELS: Record<NexaVisitaStatus, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  no_show: 'No-show',
  cancelada: 'Cancelada',
};

export const STATUS_COLORS: Record<NexaVisitaStatus, string> = {
  agendada: 'bg-blue-100 text-blue-800',
  confirmada: 'bg-purple-100 text-purple-800',
  realizada: 'bg-green-100 text-green-800',
  no_show: 'bg-yellow-100 text-yellow-800',
  cancelada: 'bg-red-100 text-red-800',
};
