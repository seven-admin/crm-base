import { Database } from '@/integrations/supabase/types';

export type BriefingStatus = Database['public']['Enums']['briefing_status'];

export interface Briefing {
  id: string;
  codigo: string;
  cliente: string;
  tema: string;
  objetivo?: string | null;
  empreendimento_id?: string | null;
  formato_peca?: string | null;
  composicao?: string | null;
  head_titulo?: string | null;
  sub_complemento?: string | null;
  mensagem_chave?: string | null;
  tom_comunicacao?: string | null;
  estilo_visual?: string | null;
  diretrizes_visuais?: string | null;
  referencia?: string | null;
  referencia_imagem_url?: string | null;
  importante?: string | null;
  observacoes?: string | null;
  status: BriefingStatus;
  criado_por: string | null;
  triado_por?: string | null;
  data_triagem?: string | null;
  data_entrega?: string | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at: string;
  // Joined data
  empreendimento?: {
    id: string;
    nome: string;
  } | null;
  criador?: {
    id: string;
    full_name: string | null;
  } | null;
  triador?: {
    id: string;
    full_name: string | null;
  } | null;
}

export const BRIEFING_STATUS_LABELS: Record<BriefingStatus, string> = {
  pendente: 'Pendente',
  triado: 'Triado',
  em_producao: 'Em Produção',
  revisao: 'Em Revisão',
  entregue: 'Entregue',
  aprovado: 'Aprovado',
  cancelado: 'Cancelado',
};

export const BRIEFING_STATUS_COLORS: Record<BriefingStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  triado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  em_producao: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  revisao: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  entregue: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  aprovado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export const FORMATO_PECA_OPTIONS = [
  'Post Redes Sociais',
  'Story',
  'Banner Digital',
  'Banner Impresso',
  'Flyer',
  'Folder',
  'E-mail Marketing',
  'Landing Page',
  'Apresentação',
  'Outdoor',
  'Vídeo',
  'Outro',
];

export const TOM_COMUNICACAO_OPTIONS = [
  'Formal',
  'Informal',
  'Técnico',
  'Emocional',
  'Aspiracional',
  'Urgente',
  'Institucional',
];

export const ESTILO_VISUAL_OPTIONS = [
  'Minimalista',
  'Moderno',
  'Clássico',
  'Luxuoso',
  'Jovem/Descolado',
  'Corporativo',
  'Clean',
];

export interface BriefingFormData {
  cliente: string;
  tema: string;
  objetivo?: string;
  empreendimento_id?: string;
  formato_peca?: string;
  composicao?: string;
  head_titulo?: string;
  sub_complemento?: string;
  mensagem_chave?: string;
  tom_comunicacao?: string;
  estilo_visual?: string;
  diretrizes_visuais?: string;
  referencia?: string;
  referencia_imagem_url?: string;
  importante?: string;
  observacoes?: string;
}

export interface BriefingReferencia {
  id: string;
  briefing_id: string;
  tipo: 'imagem' | 'link';
  url: string;
  titulo: string | null;
  created_at: string;
}

export interface BriefingFilters {
  status?: BriefingStatus;
  cliente?: string;
  empreendimento_id?: string;
}
