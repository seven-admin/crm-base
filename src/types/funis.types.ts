export interface Funil {
  id: string;
  nome: string;
  descricao: string | null;
  empreendimento_id: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  empreendimento?: {
    id: string;
    nome: string;
  } | null;
  etapas?: FunilEtapa[];
}

export interface FunilEtapa {
  id: string;
  funil_id: string;
  nome: string;
  codigo: string;
  cor: string;
  cor_bg: string | null;
  icone: string | null;
  ordem: number;
  is_inicial: boolean;
  is_final_sucesso: boolean;
  is_final_perda: boolean;
  is_active: boolean;
  created_at: string;
}

export interface FunilFormData {
  nome: string;
  descricao?: string;
  empreendimento_id?: string | null;
  is_default?: boolean;
}

export interface FunilEtapaFormData {
  nome: string;
  codigo: string;
  cor: string;
  cor_bg?: string;
  icone?: string;
  ordem: number;
  is_inicial?: boolean;
  is_final_sucesso?: boolean;
  is_final_perda?: boolean;
}

// Cores predefinidas para etapas
export const CORES_ETAPAS = [
  { cor: '#6b7280', cor_bg: '#f3f4f6', label: 'Cinza' },
  { cor: '#3b82f6', cor_bg: '#dbeafe', label: 'Azul' },
  { cor: '#f59e0b', cor_bg: '#fef3c7', label: 'Amarelo' },
  { cor: '#8b5cf6', cor_bg: '#ede9fe', label: 'Roxo' },
  { cor: '#22c55e', cor_bg: '#dcfce7', label: 'Verde' },
  { cor: '#ef4444', cor_bg: '#fee2e2', label: 'Vermelho' },
  { cor: '#ec4899', cor_bg: '#fce7f3', label: 'Rosa' },
  { cor: '#14b8a6', cor_bg: '#ccfbf1', label: 'Teal' },
  { cor: '#f97316', cor_bg: '#ffedd5', label: 'Laranja' },
];
