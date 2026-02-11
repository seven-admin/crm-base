import type { PolygonCoords } from './mapa.types';

// Enums
export type EmpreendimentoTipo = 'loteamento' | 'condominio' | 'predio' | 'comercial';
export type EmpreendimentoStatus = 'lancamento' | 'obra' | 'entregue';
export type UnidadeStatus = 'disponivel' | 'reservada' | 'negociacao' | 'contrato' | 'vendida' | 'bloqueada';
export type DocumentoTipo = 'registro_incorporacao' | 'matricula' | 'projeto' | 'licenca' | 'contrato' | 'memorial' | 'outro';
export type MidiaTipo = 'imagem' | 'video' | 'tour_virtual' | 'pdf' | 'link';

// Labels e cores
export const EMPREENDIMENTO_TIPO_LABELS: Record<EmpreendimentoTipo, string> = {
  loteamento: 'Loteamento',
  condominio: 'Condomínio',
  predio: 'Prédio',
  comercial: 'Comercial',
};

export const EMPREENDIMENTO_STATUS_LABELS: Record<EmpreendimentoStatus, string> = {
  lancamento: 'Lançamento',
  obra: 'Em Obra',
  entregue: 'Entregue',
};

export const EMPREENDIMENTO_STATUS_COLORS: Record<EmpreendimentoStatus, string> = {
  lancamento: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  obra: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  entregue: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

export const UNIDADE_STATUS_LABELS: Record<UnidadeStatus, string> = {
  disponivel: 'Disponível',
  reservada: 'Reservada',
  negociacao: 'Em Negociação',
  contrato: 'Em Contrato',
  vendida: 'Vendida',
  bloqueada: 'Bloqueada',
};

export const UNIDADE_STATUS_COLORS: Record<UnidadeStatus, string> = {
  disponivel: 'bg-emerald-500',
  reservada: 'bg-yellow-500',
  negociacao: 'bg-blue-500',
  contrato: 'bg-purple-500',
  vendida: 'bg-red-500',
  bloqueada: 'bg-gray-500',
};

export const DOCUMENTO_TIPO_LABELS: Record<DocumentoTipo, string> = {
  registro_incorporacao: 'Registro de Incorporação',
  matricula: 'Matrícula-Mãe',
  projeto: 'Projeto',
  licenca: 'Licença',
  contrato: 'Contrato Padrão',
  memorial: 'Memorial Descritivo',
  outro: 'Outro',
};

// Interfaces
export interface Empreendimento {
  id: string;
  nome: string;
  tipo: EmpreendimentoTipo;
  status: EmpreendimentoStatus;
  incorporadora: string | null;
  construtora: string | null;
  responsavel_comercial_id: string | null;
  descricao_curta: string | null;
  descricao_completa: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  endereco_cep: string | null;
  latitude: number | null;
  longitude: number | null;
  total_unidades: number;
  infraestrutura: string[] | null;
  registro_incorporacao: string | null;
  matricula_mae: string | null;
  legenda_status_visiveis: UnidadeStatus[] | null;
  mapa_label_formato: string[] | null;
  auto_vincular_corretor: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmpreendimentoWithStats extends Empreendimento {
  unidades_disponiveis: number;
  unidades_reservadas: number;
  unidades_vendidas: number;
  unidades_bloqueadas: number;
  unidades_negociacao: number;
  valor_total: number;
  valor_vendido: number;
  capa_url?: string;
}

export interface Bloco {
  id: string;
  empreendimento_id: string;
  nome: string;
  total_andares: number | null;
  unidades_por_andar: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipologia categoria
export type TipologiaCategoria = 'casa' | 'apartamento' | 'terreno';

export const TIPOLOGIA_CATEGORIA_LABELS: Record<TipologiaCategoria, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
};

export interface Tipologia {
  id: string;
  empreendimento_id: string;
  nome: string;
  categoria: TipologiaCategoria;
  area_privativa: number | null;
  area_total: number | null;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  valor_base: number | null;
  planta_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unidade {
  id: string;
  empreendimento_id: string;
  bloco_id: string | null;
  tipologia_id: string | null;
  fachada_id: string | null;
  numero: string;
  andar: number | null;
  posicao: string | null;
  area_privativa: number | null;
  area_total?: number | null;
  valor: number | null;
  status: UnidadeStatus;
  descricao: string | null;
  observacoes: string | null;
  polygon_coords: PolygonCoords | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  bloco?: Bloco;
  tipologia?: Tipologia;
  fachada?: {
    id: string;
    nome: string;
    descricao: string | null;
    imagem_url: string | null;
  };
}

export interface EmpreendimentoDocumento {
  id: string;
  empreendimento_id: string;
  tipo: DocumentoTipo;
  nome: string;
  descricao: string | null;
  arquivo_url: string;
  created_by: string | null;
  created_at: string;
}

export interface EmpreendimentoMidia {
  id: string;
  empreendimento_id: string;
  tipo: MidiaTipo;
  nome: string | null;
  url: string;
  is_capa: boolean;
  ordem: number;
  created_at: string;
}

export interface EmpreendimentoCorretor {
  id: string;
  empreendimento_id: string;
  corretor_id: string;
  autorizado_em: string;
  autorizado_por: string | null;
  // Joined data
  corretor?: {
    id: string;
    nome_completo: string;
    email: string | null;
    telefone: string | null;
    creci: string | null;
  };
}

export interface EmpreendimentoImobiliaria {
  id: string;
  empreendimento_id: string;
  imobiliaria_id: string;
  comissao_percentual: number | null;
  autorizado_em: string;
  autorizado_por: string | null;
  // Joined data
  imobiliaria?: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
  };
}

// Form types
export interface EmpreendimentoFormData {
  nome: string;
  tipo: EmpreendimentoTipo;
  status: EmpreendimentoStatus;
  incorporadora_id?: string;
  responsavel_comercial_id?: string;
  descricao_curta?: string;
  descricao_completa?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  latitude?: number;
  longitude?: number;
  infraestrutura?: string[];
  registro_incorporacao?: string;
  matricula_mae?: string;
  legenda_status_visiveis?: UnidadeStatus[];
  mapa_label_formato?: string[];
}

export interface BlocoFormData {
  nome: string;
  total_andares?: number;
  unidades_por_andar?: number;
}

export interface TipologiaFormData {
  nome: string;
  categoria: TipologiaCategoria;
  area_privativa?: number;
  area_total?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  valor_base?: number;
  planta_url?: string;
}

export interface UnidadeFormData {
  bloco_id?: string;
  tipologia_id?: string;
  fachada_id?: string;
  numero: string;
  andar?: number;
  posicao?: string;
  area_privativa?: number;
  area_total?: number;
  valor?: number;
  status?: UnidadeStatus;
  descricao?: string;
  observacoes?: string;
  polygon_coords?: PolygonCoords | null;
}

// Filters
export interface EmpreendimentoFilters {
  tipo?: EmpreendimentoTipo;
  status?: EmpreendimentoStatus;
  cidade?: string;
  search?: string;
}

// ===================== BOX (Vagas de Estacionamento) =====================

export type BoxTipo = 'simples' | 'dupla';
export type BoxStatus = 'disponivel' | 'reservado' | 'vendido';

export const BOX_TIPO_LABELS: Record<BoxTipo, string> = {
  simples: 'Simples',
  dupla: 'Dupla',
};

export const BOX_STATUS_LABELS: Record<BoxStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
};

export interface Box {
  id: string;
  empreendimento_id: string;
  bloco_id: string | null;
  numero: string;
  tipo: BoxTipo;
  coberto: boolean;
  valor: number | null;
  status: BoxStatus;
  unidade_id: string | null;
  observacoes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  bloco?: { id: string; nome: string };
  unidade?: { id: string; numero: string };
}

export interface BoxFormData {
  bloco_id?: string;
  numero: string;
  tipo: BoxTipo;
  coberto: boolean;
  valor?: number;
  observacoes?: string;
}

export interface BoxBulkFormData {
  bloco_id?: string;
  quantidade: number;
  numero_inicial: number;
  prefixo?: string;
  tipo: BoxTipo;
  coberto: boolean;
  valor?: number;
}
