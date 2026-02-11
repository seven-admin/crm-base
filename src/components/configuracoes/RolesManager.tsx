import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Shield, Save, Plus, MoreVertical, Edit, Trash2, Lock, Copy, Search, Eye, FileText, Briefcase, HelpCircle, Zap, Globe, Building2, User, Info } from 'lucide-react';
import { 
  useRoles,
  useAllRoles,
  useModules, 
  useRolePermissions, 
  useBulkUpdateRolePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useCloneRole,
} from '@/hooks/useRoles';
import type { Role } from '@/types/auth.types';

// Enhanced scope options with icons, colors, and practical examples
const SCOPE_OPTIONS = [
  { 
    value: 'global', 
    label: 'Todos os Registros', 
    shortLabel: 'Todos',
    icon: Globe,
    colorClass: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    description: 'Acesso a TODOS os registros do sistema, independente de quem criou ou qual empreendimento',
    example: 'Ex: Ver TODAS as negociações de TODOS os corretores de TODOS os empreendimentos'
  },
  { 
    value: 'empreendimento', 
    label: 'Por Empreendimento', 
    shortLabel: 'Empreend.',
    icon: Building2,
    colorClass: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    description: 'Acesso apenas aos registros dos empreendimentos que o usuário está vinculado',
    example: 'Ex: Gestor do "Reserva do Lago" vê apenas as negociações deste empreendimento'
  },
  { 
    value: 'proprio', 
    label: 'Apenas Próprios', 
    shortLabel: 'Próprios',
    icon: User,
    colorClass: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
    description: 'Acesso somente aos registros que o próprio usuário criou ou é responsável',
    example: 'Ex: Corretor vê apenas as próprias negociações e seus clientes'
  },
];

// Quick permission presets
const PERMISSION_PRESETS = [
  { 
    id: 'view_only', 
    label: 'Apenas Visualizar', 
    icon: Eye,
    description: 'Marca apenas "Ver" em todos os módulos',
    apply: () => ({ can_view: true, can_create: false, can_edit: false, can_delete: false })
  },
  { 
    id: 'full_access', 
    label: 'Acesso Total', 
    icon: Zap,
    description: 'Marca todas as permissões em todos os módulos',
    apply: () => ({ can_view: true, can_create: true, can_edit: true, can_delete: true })
  },
  { 
    id: 'no_delete', 
    label: 'Sem Excluir', 
    icon: FileText,
    description: 'Ver, Criar e Editar, mas não pode excluir',
    apply: () => ({ can_view: true, can_create: true, can_edit: true, can_delete: false })
  },
  { 
    id: 'clear_all', 
    label: 'Limpar Tudo', 
    icon: Trash2,
    description: 'Remove todas as permissões',
    apply: () => ({ can_view: false, can_create: false, can_edit: false, can_delete: false })
  },
];

export function RolesManager() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [localPermissions, setLocalPermissions] = useState<Record<string, {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    scope: string;
  }>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToClone, setRoleToClone] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ display_name: '', description: '' });
  const [cloneName, setCloneName] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');

  const { data: roles, isLoading: rolesLoading } = useAllRoles();
  const { data: modules, isLoading: modulesLoading } = useModules();
  const { data: rolePermissions, isLoading: permissionsLoading } = useRolePermissions(selectedRole?.id || null);
  const bulkUpdate = useBulkUpdateRolePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const cloneRole = useCloneRole();

  const isLoading = modulesLoading || permissionsLoading;

  // Filter modules by search
  const filteredModules = modules?.filter(m => 
    m.display_name.toLowerCase().includes(moduleSearch.toLowerCase())
  ) || [];

  const initializePermissions = () => {
    if (!modules) return;
    
    const perms: typeof localPermissions = {};
    modules.forEach(module => {
      const existing = rolePermissions?.find(rp => rp.module_id === module.id);
      perms[module.id] = {
        can_view: existing?.can_view ?? false,
        can_create: existing?.can_create ?? false,
        can_edit: existing?.can_edit ?? false,
        can_delete: existing?.can_delete ?? false,
        scope: existing?.scope ?? 'proprio',
      };
    });
    setLocalPermissions(perms);
  };

  useEffect(() => {
    if (rolePermissions && modules) {
      initializePermissions();
    }
  }, [rolePermissions, modules]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setLocalPermissions({});
  };

  const handlePermissionChange = (
    moduleId: string,
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'scope',
    value: boolean | string
  ) => {
    setLocalPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      },
    }));
  };

  const handleApplyPreset = (presetId: string) => {
    if (!modules) return;
    
    const preset = PERMISSION_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    
    const newPerms: typeof localPermissions = {};
    modules.forEach(module => {
      const currentScope = localPermissions[module.id]?.scope || 'proprio';
      newPerms[module.id] = {
        ...preset.apply(),
        scope: currentScope,
      };
    });
    setLocalPermissions(newPerms);
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;

    const permissions = Object.entries(localPermissions).map(([moduleId, perm]) => ({
      moduleId,
      ...perm,
    }));

    bulkUpdate.mutate({ roleId: selectedRole.id, permissions });
  };

  const handleCreateRole = () => {
    if (!formData.display_name.trim()) return;
    
    createRole.mutate({
      name: formData.display_name,
      display_name: formData.display_name,
      description: formData.description || undefined,
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({ display_name: '', description: '' });
      }
    });
  };

  const handleEditRole = () => {
    if (!selectedRole || !formData.display_name.trim()) return;
    
    updateRole.mutate({
      id: selectedRole.id,
      display_name: formData.display_name,
      description: formData.description || undefined,
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setFormData({ display_name: '', description: '' });
      }
    });
  };

  const handleDeleteRole = () => {
    if (!roleToDelete) return;
    
    deleteRole.mutate(roleToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setRoleToDelete(null);
        if (selectedRole?.id === roleToDelete.id) {
          setSelectedRole(null);
        }
      }
    });
  };

  const openEditDialog = (role: Role) => {
    setFormData({ display_name: role.display_name, description: role.description || '' });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const openCloneDialog = (role: Role) => {
    setRoleToClone(role);
    setCloneName(`${role.display_name} (cópia)`);
    setCloneDialogOpen(true);
  };

  const handleCloneRole = () => {
    if (!roleToClone || !cloneName.trim()) return;
    
    cloneRole.mutate({ sourceRoleId: roleToClone.id, newDisplayName: cloneName }, {
      onSuccess: () => {
        setCloneDialogOpen(false);
        setRoleToClone(null);
        setCloneName('');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Perfis de Acesso</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Crie, edite e configure as permissões de cada perfil de usuário
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de Roles */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Perfis</CardTitle>
            <CardDescription>Selecione um perfil para editar</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {rolesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="divide-y">
                {roles?.map(role => (
                  <div 
                    key={role.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedRole?.id === role.id ? 'bg-muted' : ''}`}
                    onClick={() => handleRoleSelect(role)}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{role.display_name}</p>
                        <p className="text-xs text-muted-foreground">{role.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {role.is_system && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Sistema
                        </Badge>
                      )}
                      {!role.is_active && (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRoleSelect(role); openEditDialog(role); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCloneDialog(role); }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          {!role.is_system && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); openDeleteDialog(role); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissões */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Permissões</CardTitle>
                <CardDescription>
                  {selectedRole ? `Configurar permissões de "${selectedRole.display_name}"` : 'Selecione um perfil'}
                </CardDescription>
              </div>
              {selectedRole && (
                <Button 
                  onClick={handleSavePermissions} 
                  disabled={bulkUpdate.isPending}
                  size="sm"
                >
                  {bulkUpdate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecione um perfil para configurar suas permissões</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TooltipProvider>
                <div className="space-y-4">
                  {/* Quick Presets */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Atalhos:</span>
                    {PERMISSION_PRESETS.map(preset => {
                      const Icon = preset.icon;
                      return (
                        <Tooltip key={preset.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApplyPreset(preset.id)}
                              className="h-8"
                            >
                              <Icon className="h-3.5 w-3.5 mr-1.5" />
                              {preset.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{preset.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>

                  {/* Module Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar módulo..."
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                
                {/* Scope Legend */}
                <div className="border rounded-lg p-4 bg-muted/30 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Entenda os Escopos de Acesso</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {SCOPE_OPTIONS.map(scope => {
                      const Icon = scope.icon;
                      return (
                        <div key={scope.value} className={`flex items-start gap-2 p-2 rounded-md ${scope.colorClass}`}>
                          <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-xs">{scope.label}</p>
                            <p className="text-xs opacity-80 mt-0.5">{scope.example}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    💡 <strong>Dica:</strong> Corretores normalmente usam "Próprios" para ver apenas suas negociações. Gestores comerciais usam "Por Empreendimento".
                  </p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Módulo</TableHead>
                        <TableHead className="text-center w-20">Ver</TableHead>
                        <TableHead className="text-center w-20">Criar</TableHead>
                        <TableHead className="text-center w-20">Editar</TableHead>
                        <TableHead className="text-center w-20">Excluir</TableHead>
                        <TableHead className="w-[180px]">Escopo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredModules.map(module => {
                      const perm = localPermissions[module.id] || {
                        can_view: false,
                        can_create: false,
                        can_edit: false,
                        can_delete: false,
                        scope: 'proprio',
                      };

                      return (
                        <TableRow key={module.id}>
                          <TableCell className="font-medium text-sm">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">
                                  {module.display_name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-sm">{(module as any).description || 'Módulo do sistema'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm.can_view}
                              onCheckedChange={(checked) => handlePermissionChange(module.id, 'can_view', !!checked)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm.can_create}
                              onCheckedChange={(checked) => handlePermissionChange(module.id, 'can_create', !!checked)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm.can_edit}
                              onCheckedChange={(checked) => handlePermissionChange(module.id, 'can_edit', !!checked)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm.can_delete}
                              onCheckedChange={(checked) => handlePermissionChange(module.id, 'can_delete', !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={perm.scope}
                              onValueChange={(value) => handlePermissionChange(module.id, 'scope', value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                {(() => {
                                  const selectedScope = SCOPE_OPTIONS.find(s => s.value === perm.scope);
                                  if (selectedScope) {
                                    const Icon = selectedScope.icon;
                                    return (
                                      <span className="flex items-center gap-1.5">
                                        <Icon className="h-3.5 w-3.5" />
                                        {selectedScope.shortLabel}
                                      </span>
                                    );
                                  }
                                  return <SelectValue />;
                                })()}
                              </SelectTrigger>
                              <SelectContent className="w-80">
                                {SCOPE_OPTIONS.map(opt => {
                                  const Icon = opt.icon;
                                  return (
                                    <SelectItem key={opt.value} value={opt.value} className="py-2">
                                      <div className="flex items-start gap-2">
                                        <Icon className={`h-4 w-4 mt-0.5 shrink-0`} />
                                        <div className="min-w-0">
                                          <p className="font-medium text-sm">{opt.label}</p>
                                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Perfil de Acesso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Perfil *</Label>
              <Input
                value={formData.display_name}
                onChange={e => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Ex: Gerente de Vendas"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição das responsabilidades..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateRole} disabled={createRole.isPending || !formData.display_name.trim()}>
              {createRole.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Perfil *</Label>
              <Input
                value={formData.display_name}
                onChange={e => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditRole} disabled={updateRole.isPending || !formData.display_name.trim()}>
              {updateRole.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o perfil "{roleToDelete?.display_name}"?
              Usuários com este perfil serão migrados para "Cliente Externo".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
