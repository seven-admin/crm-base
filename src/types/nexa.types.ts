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
  criador?: { id: string; full_name: string; email: string } | null;
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

export interface NexaWhatsappAtividade {
  id: string;
  nome: string;
  whatsapp: string;
  data: string;
  historico: string | null;
  categoria: string | null;
  proximas_atividades: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Registro de atividades ============
// Categoria (tipo): 'visita' = Atividade (mercado), 'atendimento' = Atendimento (cliente), 'outros'.
export type NexaAtividadeTipo = 'visita' | 'atendimento' | 'outros';

// Subtipos da Atividade (mercado). Só se aplicam a tipo = 'visita'.
export type NexaAtividadeSubtipo =
  | 'visita_tecnica'
  | 'visita_comercial'
  | 'ligacoes'
  | 'treinamento'
  | 'reuniao_comercial'
  | 'reuniao_incorporador'
  | 'reuniao_360'
  | 'avaliacao'
  | 'evento'
  | 'vistoria_entrega';

export interface NexaAtividade {
  id: string;
  tipo: NexaAtividadeTipo;
  subtipo: NexaAtividadeSubtipo | null;
  data_hora: string;
  local: string | null;
  qtd_pessoas: number | null;
  observacoes: string | null;
  created_by: string | null;
  // Campos de Atendimento (cliente) — vindos da antiga nexa_visitas.
  cliente_id: string | null;
  visitante_nome: string | null;
  visitante_telefone: string | null;
  empreendimento_id: string | null;
  imobiliaria_id: string | null;
  corretor_id: string | null;
  status: NexaVisitaStatus | null;
  created_at: string;
  updated_at: string;
}

export interface NexaAtividadeParticipante {
  corretor_id: string;              // id do corretor no banco da NEXA (app_user_profiles)
  corretor_nome: string | null;
  imobiliaria_nome: string | null;
}

export interface NexaAtividadeWithRelations extends NexaAtividade {
  participantes?: NexaAtividadeParticipante[];
  criador?: { id: string; full_name: string; email: string } | null;
  cliente?: { id: string; nome: string; telefone: string | null; email: string | null } | null;
  empreendimento?: { id: string; nome: string } | null;
  imobiliaria?: { id: string; nome: string } | null;
  corretor?: { id: string; nome_completo: string } | null;
}

// ============ Metas semanais ============
export interface NexaMeta {
  id: string;
  nome: string;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  meta_semanal_visitas: number;
  meta_semanal_atendimentos: number;
  meta_semanal_impacto: number;
  meta_semanal_engajamento: number;
  meta_semanal_unidades_vendidas: number;
  meta_semanal_vgv: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usuarios?: Array<{
    user_id: string;
    profile?: { id: string; full_name: string; email: string } | null;
  }>;
}

// Rótulos das categorias (nível superior da entrada de atividades).
export const TIPO_ATIVIDADE_LABELS: Record<NexaAtividadeTipo, string> = {
  visita: 'Atividade (mercado)',
  atendimento: 'Atendimento (cliente)',
  outros: 'Outros',
};

// Subtipos da Atividade (mercado), na ordem exibida no formulário.
export const NEXA_SUBTIPO_LABELS: Record<NexaAtividadeSubtipo, string> = {
  visita_tecnica: 'Visita técnica',
  visita_comercial: 'Visita comercial',
  ligacoes: 'Ligações',
  treinamento: 'Treinamento',
  reuniao_comercial: 'Reunião (comercial)',
  reuniao_incorporador: 'Reunião (incorporador)',
  reuniao_360: 'Reunião (360)',
  avaliacao: 'Avaliação',
  evento: 'Evento',
  vistoria_entrega: 'Vistoria de Entrega',
};

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
