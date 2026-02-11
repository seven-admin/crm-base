// Tipos para o módulo de Marketing - Atividades de Produção

export type CategoriaTicket = 'render_3d' | 'design_grafico' | 'video_animacao' | 'evento' | 'pedido_orcamento' | 'criacao_campanha';

export type StatusTicket = 'aguardando_analise' | 'em_producao' | 'revisao' | 'aprovacao_cliente' | 'ajuste' | 'concluido' | 'arquivado';

export type PrioridadeTicket = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Ticket {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  categoria: CategoriaTicket;
  status: StatusTicket;
  // Quando o Kanban usa etapas dinâmicas, este campo é a fonte de verdade da coluna.
  ticket_etapa_id?: string | null;
  prioridade: PrioridadeTicket;
  cliente_id: string | null;
  supervisor_id: string | null;
  empreendimento_id: string | null;
  briefing_id?: string | null;
  data_solicitacao: string;
  data_inicio: string | null;
  data_previsao: string | null;
  data_entrega: string | null;
  briefing_texto: string | null;
  briefing_anexos: string[];
  ordem_kanban: number;
  is_interno: boolean;
  is_active: boolean;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  // Relacionamentos
  cliente?: {
    id: string;
    full_name: string;
    email: string;
  };
  supervisor?: {
    id: string;
    full_name: string;
  };
  empreendimento?: {
    id: string;
    nome: string;
  };
  briefing?: {
    id: string;
    codigo: string;
    cliente: string;
    tema: string;
    objetivo: string | null;
    formato_peca: string | null;
    composicao: string | null;
    head_titulo: string | null;
    sub_complemento: string | null;
    mensagem_chave: string | null;
    tom_comunicacao: string | null;
    estilo_visual: string | null;
    diretrizes_visuais: string | null;
    referencia: string | null;
    importante: string | null;
    observacoes: string | null;
    status: string;
  } | null;
  criador?: {
    id: string;
    full_name: string;
  } | null;
}

// Alias para compatibilidade
export type ProjetoMarketing = Ticket;
export type CategoriaProjeto = CategoriaTicket;
export type StatusProjeto = StatusTicket;
export type PrioridadeProjeto = PrioridadeTicket;

export interface TarefaTicket {
  id: string;
  projeto_id: string;
  titulo: string;
  descricao: string | null;
  responsavel_id: string | null;
  status: 'pendente' | 'em_andamento' | 'concluida';
  data_inicio: string | null;
  data_fim: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
  responsavel?: {
    id: string;
    full_name: string;
  };
}

// Alias
export type TarefaProjeto = TarefaTicket;

export interface TicketHistorico {
  id: string;
  projeto_id: string;
  user_id: string | null;
  status_anterior: StatusTicket | null;
  status_novo: StatusTicket;
  observacao: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
  };
}

// Alias
export type ProjetoHistorico = TicketHistorico;

export interface TicketComentario {
  id: string;
  projeto_id: string;
  user_id: string | null;
  comentario: string;
  anexo_url: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

// Alias
export type ProjetoComentario = TicketComentario;

export interface TicketCriativo {
  id: string;
  projeto_id: string;
  tipo: 'imagem' | 'video' | 'link';
  nome: string | null;
  url: string;
  is_final: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Evento {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  empreendimento_id: string | null;
  data_evento: string;
  local: string | null;
  responsavel_id: string | null;
  status: 'planejamento' | 'em_andamento' | 'concluido' | 'cancelado';
  orcamento: number | null;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  empreendimento?: {
    id: string;
    nome: string;
  };
  responsavel?: {
    id: string;
    full_name: string;
  };
}

export interface EventoTarefa {
  id: string;
  evento_id: string;
  titulo: string;
  responsavel_id: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: 'pendente' | 'em_andamento' | 'concluida';
  dependencia_id: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
  responsavel?: {
    id: string;
    full_name: string;
  };
}

// Labels para exibição
export const CATEGORIA_LABELS: Record<CategoriaTicket, string> = {
  render_3d: 'Renders / 3D',
  design_grafico: 'Design Gráfico',
  video_animacao: 'Vídeos / Animação',
  evento: 'Evento',
  pedido_orcamento: 'Pedido de Orçamento',
  criacao_campanha: 'Criação de Campanha'
};

export const STATUS_LABELS: Record<StatusTicket, string> = {
  aguardando_analise: 'Aguardando Análise',
  em_producao: 'Em Produção',
  revisao: 'Revisão',
  aprovacao_cliente: 'Aprovação Cliente',
  ajuste: 'Ajuste',
  concluido: 'Concluído',
  arquivado: 'Arquivado'
};

export const STATUS_COLORS: Record<StatusTicket, string> = {
  aguardando_analise: '#f59e0b',
  em_producao: '#3b82f6',
  revisao: '#8b5cf6',
  aprovacao_cliente: '#ec4899',
  ajuste: '#f97316',
  concluido: '#22c55e',
  arquivado: '#6b7280'
};

export const PRIORIDADE_LABELS: Record<PrioridadeTicket, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente'
};

export const PRIORIDADE_COLORS: Record<PrioridadeTicket, string> = {
  baixa: '#22c55e',
  media: '#3b82f6',
  alta: '#f59e0b',
  urgente: '#ef4444'
};

// Colunas do Kanban
export const KANBAN_COLUMNS: StatusTicket[] = [
  'aguardando_analise',
  'em_producao',
  'revisao',
  'aprovacao_cliente',
  'ajuste',
  'concluido'
];
