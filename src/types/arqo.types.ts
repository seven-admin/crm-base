// Tipos do módulo Arqo
export type ArqoEtapaCategoria = 'ativa' | 'ganho' | 'perda' | 'descartado';

export interface ArqoLeadSource { id: string; nome: string; descricao: string | null; is_active: boolean; ordem: number; }
export interface ArqoTemperatura { id: string; nome: string; peso: number; cor: string; ordem: number; is_active: boolean; }
export interface ArqoFunilEtapa {
  id: string; nome: string; descricao: string | null; ordem: number; peso: number;
  categoria: ArqoEtapaCategoria; is_encerramento: boolean; cor: string; is_active: boolean;
  bloqueia_roleta: boolean;
}
export interface ArqoGrupo { id: string; nome: string; descricao: string | null; tipo: 'consultor'|'closer'|'misto'; is_active: boolean; }
export interface ArqoGrupoMembro { id: string; grupo_id: string; user_id: string; papel: 'consultor'|'closer'; is_active: boolean; ordem_roleta: number; }
export interface ArqoSlaRegra { id: string; etapa_id: string; temperatura_id: string | null; horas_max: number; acao_expiracao: 'notificar'|'reatribuir'|'encerrar'; is_active: boolean; }
export interface ArqoReguaReengajamento { id: string; nome: string; dias_apos_ultimo_contato: number; canal: 'whatsapp'|'email'|'sms'|'ligacao'; mensagem_template: string; is_active: boolean; ordem: number; }

export interface ArqoLead {
  id: string;
  cliente_id: string;
  source_id: string | null;
  etapa_id: string;
  temperatura_id: string | null;
  grupo_id: string | null;
  consultor_id: string | null;
  closer_id: string | null;
  empreendimento_id: string | null;
  unidade_id: string | null;
  valor_estimado: number | null;
  observacoes: string | null;
  tentativas_contato: number;
  ultimo_contato_em: string | null;
  proximo_contato_em: string | null;
  optout_em: string | null;
  atendimento_final_pelo_gestor: boolean;
  qualificacao_score: number | null;
  qualificacao_resumo: string | null;
  qualificacao_atualizada_em: string | null;
  motivo_perda: string | null;
  fechado_em: string | null;
  atribuido_em: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ArqoLeadWithRelations extends ArqoLead {
  cliente?: { id: string; nome: string; telefone: string | null; email: string | null; nivel_cadastro: string | null };
  etapa?: ArqoFunilEtapa;
  temperatura?: ArqoTemperatura | null;
  source?: ArqoLeadSource | null;
  consultor?: { id: string; full_name: string; email: string } | null;
  empreendimento?: { id: string; nome: string } | null;
}

export type ArqoAgendamentoTipo = 'visita' | 'reuniao' | 'ligacao' | 'outro';
export type ArqoAgendamentoStatus = 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'no_show';

export interface ArqoAgendamento {
  id: string;
  lead_id: string;
  tipo: ArqoAgendamentoTipo;
  data_hora: string;
  duracao_min: number;
  local: string | null;
  observacoes: string | null;
  status: ArqoAgendamentoStatus;
  google_event_id: string | null;
  responsavel_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArqoAgendamentoWithRelations extends ArqoAgendamento {
  lead?: {
    id: string;
    cliente?: { id: string; nome: string; telefone: string | null; email: string | null } | null;
    empreendimento?: { id: string; nome: string } | null;
  } | null;
  responsavel?: { id: string; full_name: string } | null;
}

export const AGENDAMENTO_TIPO_LABELS: Record<ArqoAgendamentoTipo, string> = {
  visita: 'Visita',
  reuniao: 'Reunião',
  ligacao: 'Ligação',
  outro: 'Outro',
};

export const AGENDAMENTO_STATUS_LABELS: Record<ArqoAgendamentoStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  no_show: 'No-show',
};

export const AGENDAMENTO_STATUS_COLORS: Record<ArqoAgendamentoStatus, string> = {
  agendado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-purple-100 text-purple-800',
  realizado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  no_show: 'bg-yellow-100 text-yellow-800',
};
