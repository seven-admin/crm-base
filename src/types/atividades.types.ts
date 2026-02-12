// Tipos para o módulo de Atividades Comerciais

import type { ClienteTemperatura } from './clientes.types';

export type AtividadeTipo = 'ligacao' | 'meeting' | 'reuniao' | 'visita' | 'atendimento' | 'fechamento' | 'assinatura' | 'acompanhamento' | 'treinamento' | 'administrativa';
export type AtividadeStatus = 'pendente' | 'concluida' | 'cancelada';
export type AtividadeCategoria = 'seven' | 'incorporadora' | 'imobiliaria' | 'cliente';

export const ATIVIDADE_TIPO_LABELS: Record<AtividadeTipo, string> = {
  ligacao: 'Ligação/WhatsApp',
  meeting: 'Meeting',
  reuniao: 'Reunião',
  visita: 'Visita',
  atendimento: 'Atendimento',
  fechamento: 'Fechamento',
  assinatura: 'Assinatura',
  acompanhamento: 'Acompanhamento',
  treinamento: 'Treinamento',
  administrativa: 'Staff Seven',
};

export const ATIVIDADE_CATEGORIA_LABELS: Record<AtividadeCategoria, string> = {
  seven: 'Seven',
  incorporadora: 'Incorporadora',
  imobiliaria: 'Imobiliária',
  cliente: 'Cliente',
};

export const ATIVIDADE_STATUS_LABELS: Record<AtividadeStatus, string> = {
  pendente: 'Pendente',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

export const ATIVIDADE_STATUS_COLORS: Record<AtividadeStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  concluida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-gray-100 text-gray-800 border-gray-200'
};

// Motivos pré-definidos para cancelamento de atividades
export const MOTIVOS_CANCELAMENTO_ATIVIDADE = [
  'Cliente desmarcou',
  'Sem retorno / Não atende',
  'Reagendou',
  'Não compareceu',
  'Problema de agenda do corretor',
  'Outro'
] as const;

export type MotivoCancelamentoAtividade = typeof MOTIVOS_CANCELAMENTO_ATIVIDADE[number];

export interface Atividade {
  id: string;
  tipo: AtividadeTipo;
  categoria?: AtividadeCategoria | null;
  status: AtividadeStatus;
  titulo: string;
  cliente_id?: string | null;
  cliente?: { 
    id: string; 
    nome: string; 
    temperatura: ClienteTemperatura;
  } | null;
  corretor_id?: string | null;
  corretor?: { 
    id: string; 
    nome_completo: string;
  } | null;
  imobiliaria_id?: string | null;
  imobiliaria?: { 
    id: string; 
    nome: string;
  } | null;
  empreendimento_id?: string | null;
  empreendimento?: { 
    id: string; 
    nome: string;
  } | null;
  gestor_id?: string | null;
  gestor?: { 
    id: string;
    full_name: string;
  } | null;
  created_by?: string | null;
  criador?: {
    id: string;
    full_name: string;
  } | null;
  deadline_date?: string | null;
  data_inicio: string;  // formato: 'YYYY-MM-DD'
  data_fim: string;     // formato: 'YYYY-MM-DD'
  hora_inicio?: string | null;  // formato: 'HH:mm:ss' ou 'HH:mm'
  hora_fim?: string | null;     // formato: 'HH:mm:ss' ou 'HH:mm'
  observacoes?: string | null;
  temperatura_cliente?: ClienteTemperatura | null;
  resultado?: string | null;
  motivo_cancelamento?: string | null;
  requer_followup: boolean;
  data_followup?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AtividadeFormData {
  tipo: AtividadeTipo;
  categoria?: AtividadeCategoria;
  titulo: string;
  cliente_id?: string;
  corretor_id?: string;
  imobiliaria_id?: string;
  empreendimento_id?: string;
  gestor_id?: string;
  data_inicio: string;  // formato: 'YYYY-MM-DD'
  data_fim: string;     // formato: 'YYYY-MM-DD'
  hora_inicio?: string;  // formato: 'HH:mm'
  hora_fim?: string;     // formato: 'HH:mm'
  observacoes?: string;
  temperatura_cliente?: ClienteTemperatura;
  requer_followup?: boolean;
  data_followup?: string;
  deadline_date?: string;
}

export interface ConcluirAtividadeData {
  resultado: string;
  temperatura_cliente?: ClienteTemperatura;
  requer_followup?: boolean;
  data_followup?: string;
}

export interface AtividadeFilters {
  tipo?: AtividadeTipo;
  categoria?: AtividadeCategoria;
  status?: AtividadeStatus;
  // legado: alguns pontos antigos do app ainda referenciam gestor_id como filtro
  // (equivalente ao responsavel_id no novo padrão)
  gestor_id?: string;
  responsavel_id?: string;
  created_by?: string;
  empreendimento_id?: string;
  empreendimento_ids?: string[]; // Suporte a múltiplos empreendimentos (portal incorporador)
  cliente_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface ConfiguracoesAtividades {
  id: string;
  dias_retorno_corretor: number;
  alerta_followup_horas: number;
}

// Interface para comentários/interações em atividades
export interface AtividadeComentario {
  id: string;
  atividade_id: string;
  user_id: string | null;
  comentario: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
}
