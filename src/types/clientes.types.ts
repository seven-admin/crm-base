// ============================================================
// Tipos para Clientes (Unificado - substitui Lead + Cliente)
// ============================================================

// Fases do ciclo de vida do cliente
export type ClienteFase = 'prospecto' | 'qualificado' | 'negociando' | 'comprador' | 'perdido';

export const CLIENTE_FASE_LABELS: Record<ClienteFase, string> = {
  prospecto: 'Prospecto',
  qualificado: 'Qualificado',
  negociando: 'Em Negociação',
  comprador: 'Comprador',
  perdido: 'Perdido'
};

export const CLIENTE_FASE_COLORS: Record<ClienteFase, string> = {
  prospecto: 'bg-slate-100 text-slate-800 border-slate-200',
  qualificado: 'bg-blue-100 text-blue-800 border-blue-200',
  negociando: 'bg-amber-100 text-amber-800 border-amber-200',
  comprador: 'bg-green-100 text-green-800 border-green-200',
  perdido: 'bg-red-100 text-red-800 border-red-200'
};

export const CLIENTE_FASE_ICON_COLORS: Record<ClienteFase, string> = {
  prospecto: 'text-slate-500',
  qualificado: 'text-blue-500',
  negociando: 'text-amber-500',
  comprador: 'text-green-500',
  perdido: 'text-red-500'
};

// Temperatura (nível de interesse)
export type ClienteTemperatura = 'frio' | 'morno' | 'quente';

export const CLIENTE_TEMPERATURA_LABELS: Record<ClienteTemperatura, string> = {
  frio: 'Frio',
  morno: 'Morno',
  quente: 'Quente'
};

export const CLIENTE_TEMPERATURA_COLORS: Record<ClienteTemperatura, string> = {
  frio: 'bg-blue-100 text-blue-800 border-blue-200',
  morno: 'bg-orange-100 text-orange-800 border-orange-200',
  quente: 'bg-red-100 text-red-800 border-red-200'
};

// Motivos de perda pré-definidos
export const MOTIVOS_PERDA = [
  'Desistiu da compra',
  'Comprou com concorrente',
  'Não conseguiu financiamento',
  'Sem retorno / Não atende',
  'Fora do perfil',
  'Preço / Condições',
  'Outro'
] as const;

export type MotivoPerda = typeof MOTIVOS_PERDA[number];

// Origens
export const CLIENTE_ORIGENS = [
  'Site',
  'Indicação',
  'Plantão',
  'Redes Sociais',
  'WhatsApp',
  'Telefone',
  'Email',
  'Evento',
  'Imobiliária',
  'Outro'
] as const;

export type ClienteOrigem = typeof CLIENTE_ORIGENS[number];

// Estados civis
export const ESTADOS_CIVIS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Separado(a)',
] as const;

export type EstadoCivil = typeof ESTADOS_CIVIS[number];

// UFs
export const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

// Tipos de interação
export const INTERACAO_TIPOS = [
  'Ligação',
  'Email',
  'WhatsApp',
  'Visita',
  'Reunião',
  'Outro'
] as const;

export type InteracaoTipo = typeof INTERACAO_TIPOS[number];

// ============================================================
// Interface Principal: Cliente
// ============================================================

export interface Cliente {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  cpf?: string | null;
  rg?: string | null;
  passaporte?: string | null;
  data_nascimento?: string | null;
  profissao?: string | null;
  renda_mensal?: number | null;
  estado_civil?: string | null;
  nacionalidade?: string | null;
  nome_mae?: string | null;
  nome_pai?: string | null;
  
  // Endereço
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
  
  // Ciclo de vida
  fase: ClienteFase;
  temperatura?: ClienteTemperatura | null;
  origem?: string | null;
  
  // Datas de evolução
  data_qualificacao?: string | null;
  data_primeira_negociacao?: string | null;
  data_primeira_compra?: string | null;
  data_perda?: string | null;
  motivo_perda?: string | null;
  
// Vínculos
  corretor_id?: string | null;
  corretor?: { id: string; nome_completo: string } | null;
  imobiliaria_id?: string | null;
  imobiliaria?: { id: string; nome: string } | null;
  gestor_id?: string | null;
  
  // Cônjuge (relacionamento com outro cliente)
  conjuge_id?: string | null;
  conjuge?: { id: string; nome: string } | null;
  
  // Empreendimento de interesse
  empreendimento_id?: string | null;
  empreendimento?: { id: string; nome: string } | null;
  
  // Outros
  interesse?: string[] | null;
  observacoes?: string | null;
  lead_id?: string | null; // Referência legacy
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Form Data
// ============================================================

export interface ClienteFormData {
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  cpf?: string;
  rg?: string;
  passaporte?: string;
  data_nascimento?: string;
  profissao?: string;
  renda_mensal?: number;
  estado_civil?: string;
  nacionalidade?: string;
  nome_mae?: string;
  nome_pai?: string;
  
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  
  fase?: ClienteFase;
  temperatura?: ClienteTemperatura;
  origem?: string;
  
  corretor_id?: string;
  imobiliaria_id?: string;
  empreendimento_id?: string;
  conjuge_id?: string;
  
  interesse?: string[];
  observacoes?: string;
}

// ============================================================
// Sócios do Cliente (relacionamento N:N)
// ============================================================

export interface ClienteSocio {
  id: string;
  cliente_id: string;
  socio_id: string;
  socio?: { id: string; nome: string; cpf?: string | null };
  percentual_participacao?: number | null;
  observacao?: string | null;
  created_at: string;
}

export interface ClienteSocioFormData {
  cliente_id: string;
  socio_id: string;
  percentual_participacao?: number;
  observacao?: string;
}

// ============================================================
// Interações do Cliente
// ============================================================

export interface ClienteInteracao {
  id: string;
  cliente_id: string;
  user_id?: string | null;
  user?: {
    full_name: string;
    email?: string;
  } | null;
  tipo: string;
  descricao?: string | null;
  created_at: string;
}

export interface ClienteInteracaoFormData {
  cliente_id: string;
  tipo: string;
  descricao?: string;
}

// ============================================================
// Filtros
// ============================================================

export interface ClienteFilters {
  search?: string;
  fase?: ClienteFase;
  origem?: string;
  corretor_id?: string;
  imobiliaria_id?: string;
  gestor_id?: string;
}
