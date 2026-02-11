// Tipos para o módulo de Planejamento

export interface PlanejamentoFase {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanejamentoItemResponsavel {
  id: string;
  item_id: string;
  user_id: string;
  papel: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface PlanejamentoStatus {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  is_final: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanejamentoItem {
  id: string;
  empreendimento_id: string;
  fase_id: string;
  status_id: string;
  item: string;
  responsavel_tecnico_id: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  obs: string | null;
  ordem: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanejamentoItemWithRelations extends PlanejamentoItem {
  fase?: PlanejamentoFase;
  status?: PlanejamentoStatus;
  responsavel?: {
    id: string;
    full_name: string;
    email: string;
  };
  responsaveis?: PlanejamentoItemResponsavel[];
  empreendimento?: {
    id: string;
    nome: string;
  };
}

export interface PlanejamentoHistorico {
  id: string;
  item_id: string;
  user_id: string | null;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  created_at: string;
  user?: {
    full_name: string;
  };
}

export interface PlanejamentoItemCreate {
  empreendimento_id: string;
  fase_id: string;
  status_id: string;
  item: string;
  responsavel_tecnico_id?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  obs?: string | null;
  ordem?: number;
}

export interface PlanejamentoItemUpdate {
  id: string;
  fase_id?: string;
  status_id?: string;
  item?: string;
  responsavel_tecnico_id?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  obs?: string | null;
  ordem?: number;
  is_active?: boolean;
}

export interface PlanejamentoFilters {
  empreendimento_id?: string;
  fase_id?: string;
  status_id?: string;
  responsavel_tecnico_id?: string;
  data_inicio_de?: string;
  data_inicio_ate?: string;
  data_fim_de?: string;
  data_fim_ate?: string;
  busca?: string;
}
