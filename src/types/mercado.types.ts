// Tipos para o módulo de Mercado (Imobiliárias, Corretores, Incorporadoras)

export const ESTADOS_CIVIS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Separado(a)',
] as const;

export type EstadoCivil = typeof ESTADOS_CIVIS[number];

export const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

export interface Imobiliaria {
  id: string;
  nome: string;
  cnpj?: string | null;
  site?: string | null;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
  gestor_nome?: string | null;
  gestor_telefone?: string | null;
  gestor_email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  user_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  corretores_count?: number;
}

export interface Corretor {
  id: string;
  nome_completo: string;
  cpf?: string | null;
  imobiliaria_id?: string | null;
  imobiliaria?: { id: string; nome: string } | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  creci?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  user?: { id: string; email: string; full_name: string } | null;
}

export interface Incorporadora {
  id: string;
  nome: string;
  razao_social?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImobiliariaFormData {
  nome: string;
  cnpj?: string;
  site?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  gestor_nome?: string;
  gestor_telefone?: string;
  gestor_email?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  is_active?: boolean;
}

export interface CorretorFormData {
  nome_completo: string;
  cpf?: string;
  imobiliaria_id: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  creci?: string;
  is_active?: boolean;
  user_id?: string | null;
}

export interface IncorporadoraFormData {
  nome: string;
  razao_social?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  is_active?: boolean;
}
