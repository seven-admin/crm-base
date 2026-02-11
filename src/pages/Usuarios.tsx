import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/types/auth.types';
import { Button } from '@/components/ui/button';
import { useRoles } from '@/hooks/useRoles';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Search, 
  Edit, 
  Shield, 
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  Settings,
  Key,
  Trash2,
  Building2,
  UserCheck,
  Clock
} from 'lucide-react';
import { UserPermissionsTab } from '@/components/usuarios/UserPermissionsTabNew';
import { UserEmpreendimentosTab } from '@/components/usuarios/UserEmpreendimentosTab';

import { RolesManager } from '@/components/configuracoes/RolesManager';
import { usePermissions } from '@/hooks/usePermissions';
import { useActivateCorretor, useBulkActivateCorretores } from '@/hooks/useActivateCorretor';
import { Checkbox } from '@/components/ui/checkbox';

interface UserWithRole extends Profile {
  role?: AppRole | null;
  tipo_vinculo?: 'funcionario_seven' | 'terceiro' | null;
  cargo?: string | null;
}

export default function Usuarios() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showOnlyPendentes, setShowOnlyPendentes] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Buscar roles dinâmicos do banco
  const { data: rolesFromDb = [] } = useRoles();
  
  // Hooks de ativação
  const activateCorretor = useActivateCorretor();
  const bulkActivate = useBulkActivateCorretores();
  
  // Helper para obter display_name do role
  const getRoleDisplayName = useMemo(() => {
    return (roleName: string | null | undefined): string => {
      if (!roleName) return 'Sem perfil';
      const role = rolesFromDb.find(r => r.name === roleName);
      return role?.display_name || ROLE_LABELS[roleName] || roleName;
    };
  }, [rolesFromDb]);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [pageTab, setPageTab] = useState('usuarios');
  
  const { isSuperAdmin, isAdmin } = usePermissions();

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<AppRole>('corretor');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editTipoVinculo, setEditTipoVinculo] = useState<'funcionario_seven' | 'terceiro'>('terceiro');
  const [editCargo, setEditCargo] = useState('');

  // Create form state
  const [createEmail, setCreateEmail] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState<AppRole>('corretor');
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createTipoVinculo, setCreateTipoVinculo] = useState<'funcionario_seven' | 'terceiro'>('terceiro');
  const [createCargo, setCreateCargo] = useState('');
  const [createBaseRoleId, setCreateBaseRoleId] = useState<string>('');

  // Check if selected role has permissions
  const selectedRoleHasPermissions = useMemo(() => {
    const selectedRole = rolesFromDb.find(r => r.name === createRole);
    // We'll assume roles with is_active and well-known names have permissions
    // For dynamic roles, we need to check the database (simplified check here)
    const knownRolesWithPermissions = ['admin', 'super_admin', 'gestor_produto', 'corretor', 'incorporador', 'equipe_marketing'];
    return knownRolesWithPermissions.includes(createRole);
  }, [createRole, rolesFromDb]);
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles with role_id + roles table join
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role_id, roles!inner(name)');

      if (rolesError) throw rolesError;

      // Merge profiles with roles (using roles.name from joined table)
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const roleName = (userRole?.roles as any)?.name as AppRole | null;
        return {
          ...profile as Profile,
          role: roleName ?? null,
          tipo_vinculo: (profile as any).tipo_vinculo as 'funcionario_seven' | 'terceiro' | null,
          cargo: (profile as any).cargo as string | null
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditPhone(user.phone || '');
    setEditRole(user.role || 'corretor');
    setEditIsActive(user.is_active);
    setEditTipoVinculo(user.tipo_vinculo || 'terceiro');
    setEditCargo(user.cargo || '');
    setActiveTab('dados');
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName,
          phone: editPhone || null,
          is_active: editIsActive,
          tipo_vinculo: editTipoVinculo,
          cargo: editTipoVinculo === 'funcionario_seven' ? editCargo || null : null
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Check if user has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', editingUser.id)
        .maybeSingle();

      // Get role_id from roles table based on role name
      const { data: roleData, error: roleQueryError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', editRole)
        .single();

      if (roleQueryError || !roleData) {
        throw new Error('Perfil não encontrado: ' + editRole);
      }

      if (existingRole) {
        // Update existing role with role_id
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role_id: roleData.id })
          .eq('user_id', editingUser.id);

        if (roleError) throw roleError;
      } else {
        // Insert new role with role_id only (enum column now optional)
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: editingUser.id, 
            role_id: roleData.id
          });

        if (roleError) throw roleError;
      }

      toast.success('Usuário atualizado com sucesso');
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createEmail || !createFullName) {
      toast.error('Email e nome são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: createEmail,
          full_name: createFullName,
          phone: createPhone || null,
          role: createRole,
          is_active: createIsActive,
          tipo_vinculo: createTipoVinculo,
          cargo: createTipoVinculo === 'funcionario_seven' ? createCargo || null : null,
          base_role_id: !selectedRoleHasPermissions && createBaseRoleId ? createBaseRoleId : null
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar usuário');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(response.data?.message || 'Usuário criado com sucesso');
      setIsCreateDialogOpen(false);
      setCreateEmail('');
      setCreateFullName('');
      setCreatePhone('');
      setCreateRole('corretor');
      setCreateIsActive(true);
      setCreateTipoVinculo('terceiro');
      setCreateCargo('');
      setCreateBaseRoleId('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja resetar a senha de ${email}?\n\nA nova senha será: Seven@1234`)) {
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await supabase.functions.invoke('reset-user-password', {
        body: { user_id: userId }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao resetar senha');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Senha resetada com sucesso! Nova senha: Seven@1234');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Erro ao resetar senha');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário ${email}?\n\nEsta ação não pode ser desfeita!`)) {
      return;
    }

    setIsDeletingUser(true);
    try {
      const response = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao excluir usuário');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Usuário excluído com sucesso!');
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Usuários internos (corretores e gestores de imobiliária são gerenciados em seus módulos)
  const nonCorretorUsers = useMemo(() => 
    users.filter(user => user.role !== 'corretor' && user.role !== 'gestor_imobiliaria')
  , [users]);

  // Filtered users com filtro de pendentes
  const filteredUsers = useMemo(() => {
    let result = nonCorretorUsers.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (showOnlyPendentes) {
      result = result.filter(user => !user.is_active);
    }
    
    return result;
  }, [nonCorretorUsers, searchTerm, showOnlyPendentes]);

  // Usuários pendentes (para badge) - excluindo corretores
  const pendentesCount = useMemo(() => 
    nonCorretorUsers.filter(u => !u.is_active).length
  , [nonCorretorUsers]);

  // Toggle seleção de usuário
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Selecionar todos os pendentes visíveis
  const selectAllPendentes = () => {
    const pendentesIds = filteredUsers.filter(u => !u.is_active).map(u => u.id);
    setSelectedUsers(new Set(pendentesIds));
  };

  // Limpar seleção
  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  // Ativar usuário individual
  const handleActivateUser = async (user: UserWithRole) => {
    await activateCorretor.mutateAsync({
      userId: user.id,
      email: user.email,
      nome: user.full_name
    });
    fetchUsers();
  };

  // Ativar em lote
  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) return;
    const usersToActivate = users
      .filter(u => selectedUsers.has(u.id))
      .map(u => ({
        userId: u.id,
        email: u.email,
        nome: u.full_name
      }));
    await bulkActivate.mutateAsync(usersToActivate);
    setSelectedUsers(new Set());
    fetchUsers();
  };

  const getRoleBadgeVariant = (role?: AppRole | null) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'gestor_produto':
        return 'secondary';
      case 'incorporador':
        return 'outline';
      case 'corretor':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <MainLayout 
      title="Usuários" 
      subtitle="Gestão de usuários, permissões e perfis de acesso"
      actions={
        pageTab === 'usuarios' && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Cadastrar Usuário</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )
      }
    >
      {/* Page Level Tabs */}
      <Tabs value={pageTab} onValueChange={setPageTab} className="space-y-6">
        <div className="border-b border-border overflow-x-auto">
          <TabsList className="inline-flex w-full md:w-auto justify-start bg-transparent rounded-none h-auto p-0 gap-0 min-w-max">
            <TabsTrigger 
              value="usuarios"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            {(isSuperAdmin() || isAdmin()) && (
              <TabsTrigger 
                value="perfis"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground"
              >
                <Shield className="h-4 w-4 mr-2" />
                Perfis de Acesso
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Users Tab Content */}
        <TabsContent value="usuarios" className="space-y-6">
          {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nonCorretorUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nonCorretorUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nonCorretorUsers.filter(u => u.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nonCorretorUsers.filter(u => !u.is_active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Usuários</CardTitle>
                  <CardDescription>Lista de todos os usuários do sistema</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              {/* Filtros e Ações em Lote */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                <Button
                  variant={showOnlyPendentes ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowOnlyPendentes(!showOnlyPendentes)}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Pendentes
                  {pendentesCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {pendentesCount}
                    </Badge>
                  )}
                </Button>

                {showOnlyPendentes && filteredUsers.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllPendentes}
                    >
                      Selecionar Todos
                    </Button>
                    {selectedUsers.size > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearSelection}
                        >
                          Limpar ({selectedUsers.size})
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleBulkActivate}
                          disabled={bulkActivate.isPending}
                          className="gap-2"
                        >
                          {bulkActivate.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          Ativar Selecionados ({selectedUsers.size})
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleEditUser(user)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                        <Badge variant={user.tipo_vinculo === 'funcionario_seven' ? 'default' : 'outline'}>
                          {user.tipo_vinculo === 'funcionario_seven' ? 'Seven' : 'Terceiro'}
                        </Badge>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {user.cargo && (
                        <p className="text-sm text-muted-foreground mt-2">Cargo: {user.cargo}</p>
                      )}
                    </Card>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {showOnlyPendentes && (
                          <TableHead className="w-12"></TableHead>
                        )}
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Vínculo</TableHead>
                        <TableHead className="hidden lg:table-cell">Cargo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow 
                          key={user.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleEditUser(user)}
                        >
                          {showOnlyPendentes && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedUsers.has(user.id)}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                                disabled={user.is_active}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.tipo_vinculo === 'funcionario_seven' ? 'default' : 'outline'}>
                              {user.tipo_vinculo === 'funcionario_seven' ? 'Seven' : 'Terceiro'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">
                            {user.cargo || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {!user.is_active && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleActivateUser(user)}
                                  disabled={activateCorretor.isPending}
                                  title="Ativar usuário"
                                >
                                  {activateCorretor.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 text-success" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={showOnlyPendentes ? 9 : 8} className="text-center py-8 text-muted-foreground">
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={editingUser?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {editingUser ? getInitials(editingUser.full_name) : ''}
                  </AvatarFallback>
                </Avatar>
                Editar Usuário
              </DialogTitle>
              <DialogDescription>
                {editingUser?.email}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Dados
                </TabsTrigger>
                <TabsTrigger value="permissoes" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Permissões
                </TabsTrigger>
                <TabsTrigger value="empreendimentos" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empreendimentos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">Perfil de Acesso (Base)</Label>
                  <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesFromDb.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          <div className="flex flex-col">
                            <span>{role.display_name}</span>
                            {role.description && (
                              <span className="text-xs text-muted-foreground">
                                {role.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    O perfil define as permissões base. Use a aba "Permissões" para personalizar.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status do Usuário</Label>
                    <p className="text-sm text-muted-foreground">
                      Usuários inativos não podem acessar o sistema
                    </p>
                  </div>
                  <Switch
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                  />
                </div>

                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => editingUser && handleResetPassword(editingUser.id, editingUser.email)}
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetando...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Resetar Senha (Seven@1234)
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Vínculo</Label>
                  <Select value={editTipoVinculo} onValueChange={(v) => setEditTipoVinculo(v as 'funcionario_seven' | 'terceiro')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="funcionario_seven">Funcionário Seven</SelectItem>
                      <SelectItem value="terceiro">Terceiro</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Funcionários Seven podem receber bonificações
                  </p>
                </div>

                {editTipoVinculo === 'funcionario_seven' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-cargo">Cargo</Label>
                    <Input
                      id="edit-cargo"
                      value={editCargo}
                      onChange={(e) => setEditCargo(e.target.value)}
                      placeholder="Ex: Gestor de Produto, Coordenador"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cargo do funcionário na Seven
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="permissoes" className="pt-4">
                {editingUser && (
                  <UserPermissionsTab 
                    userId={editingUser.id} 
                    userRole={editRole}
                  />
                )}
              </TabsContent>

              <TabsContent value="empreendimentos" className="pt-4">
                {editingUser && (
                  <UserEmpreendimentosTab 
                    userId={editingUser.id}
                  />
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
              <Button 
                variant="destructive" 
                onClick={() => editingUser && handleDeleteUser(editingUser.id, editingUser.email)}
                disabled={isDeletingUser}
                className="w-full sm:w-auto"
              >
                {isDeletingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Usuário
                  </>
                )}
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1 sm:flex-initial">
                  Cancelar
                </Button>
                <Button onClick={handleSaveUser} disabled={isSaving} className="flex-1 sm:flex-initial">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Cadastrar Novo Usuário
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do novo usuário. Um email será enviado para definição de senha.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-name">Nome Completo *</Label>
                <Input
                  id="create-name"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-phone">Telefone</Label>
                <Input
                  id="create-phone"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-role">Perfil de Acesso *</Label>
                <Select value={createRole} onValueChange={(v) => setCreateRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesFromDb.map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        <div className="flex flex-col">
                          <span>{role.display_name}</span>
                          {role.description && (
                            <span className="text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show base role selector when selected role might not have permissions */}
              {!selectedRoleHasPermissions && (
                <div className="space-y-2 p-3 border border-warning/50 rounded-lg bg-warning/5">
                  <Label htmlFor="create-base-role" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-warning" />
                    Copiar permissões de
                  </Label>
                  <Select value={createBaseRoleId} onValueChange={setCreateBaseRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil base..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesFromDb
                        .filter(r => ['admin', 'gestor_produto', 'corretor', 'equipe_marketing'].includes(r.name))
                        .map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.display_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    O perfil selecionado não possui permissões configuradas. Escolha um perfil base para copiar as permissões.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Usuário Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Pode acessar o sistema imediatamente
                  </p>
                </div>
                <Switch
                  checked={createIsActive}
                  onCheckedChange={setCreateIsActive}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Vínculo</Label>
                <Select value={createTipoVinculo} onValueChange={(v) => setCreateTipoVinculo(v as 'funcionario_seven' | 'terceiro')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionario_seven">Funcionário Seven</SelectItem>
                    <SelectItem value="terceiro">Terceiro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Funcionários Seven podem receber bonificações
                </p>
              </div>

              {createTipoVinculo === 'funcionario_seven' && (
                <div className="space-y-2">
                  <Label htmlFor="create-cargo">Cargo</Label>
                  <Input
                    id="create-cargo"
                    value={createCargo}
                    onChange={(e) => setCreateCargo(e.target.value)}
                    placeholder="Ex: Gestor de Produto, Coordenador"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cargo do funcionário na Seven
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </TabsContent>



        {/* Perfis Tab Content */}
        <TabsContent value="perfis" className="space-y-6">
          <RolesManager />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
