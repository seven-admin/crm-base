// Tipos para autenticação e RBAC

// AppRole agora é string pois roles são dinâmicos (tabela roles)
export type AppRole = string;

export type ActionType = 'view' | 'create' | 'edit' | 'delete';

export type ScopeType = 'global' | 'empreendimento' | 'proprio';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  role?: Role;
  created_at: string;
}

export interface Module {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  route: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  scope: ScopeType;
  created_at: string;
  role?: Role;
  module?: Module;
}

export interface UserEmpreendimento {
  id: string;
  user_id: string;
  empreendimento_id: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  role: AppRole | null;
}

export interface ModulePermission {
  module: Module;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  scope: ScopeType;
}

// Labels padrão para roles do sistema (fallback)
export const DEFAULT_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  gestor_produto: 'Gestor de Produto',
  gestor_imobiliaria: 'Gestor de Imobiliária',
  incorporador: 'Incorporador / Parceiro',
  corretor: 'Corretor / Imobiliária',
  supervisor_relacionamento: 'Supervisor Relacionamento',
  supervisor_render: 'Supervisor Render',
  supervisor_criacao: 'Supervisor Criação',
  supervisor_video: 'Supervisor Vídeo',
  equipe_marketing: 'Equipe Marketing',
  cliente_externo: 'Cliente Externo',
};

export const DEFAULT_ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Acesso total incluindo configurações avançadas do sistema',
  admin: 'Acesso administrativo (sem configurações de sistema)',
  gestor_produto: 'Acesso aos empreendimentos vinculados',
  gestor_imobiliaria: 'Gerencia corretores da sua imobiliária',
  incorporador: 'Acesso somente leitura',
  corretor: 'Pode criar negociações e contratos',
  supervisor_relacionamento: 'Gestão de eventos e relacionamento',
  supervisor_render: 'Gestão de projetos 3D',
  supervisor_criacao: 'Gestão de projetos de design',
  supervisor_video: 'Gestão de projetos de vídeo',
  equipe_marketing: 'Acesso aos projetos de marketing',
  cliente_externo: 'Visualização e aprovação de projetos',
};

// Aliases para compatibilidade
export const ROLE_LABELS = DEFAULT_ROLE_LABELS;
export const ROLE_DESCRIPTIONS = DEFAULT_ROLE_DESCRIPTIONS;
