import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Undo2, Loader2, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { ScopeType } from '@/types/auth.types';
import { 
  ModuleWithPermission,
  useSetUserModulePermission,
  useRemoveUserModulePermission
} from '@/hooks/useUserPermissions';

interface ModulePermissionRowProps {
  module: ModuleWithPermission;
  userId: string;
}

const SCOPE_LABELS: Record<ScopeType, string> = {
  global: 'Global',
  empreendimento: 'Por Empreendimento',
  proprio: 'Próprios'
};

export function ModulePermissionRow({ module, userId }: ModulePermissionRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const setPermission = useSetUserModulePermission();
  const removePermission = useRemoveUserModulePermission();

  const { effective_permission, role_permission, user_permission } = module;
  const isCustom = effective_permission.is_custom;
  const isPending = setPermission.isPending || removePermission.isPending;

  const handleToggleCustom = () => {
    if (isCustom) {
      // Remove custom permission, revert to role
      removePermission.mutate({ userId, moduleId: module.id });
    } else {
      // Create custom permission with current effective values
      setPermission.mutate({
        userId,
        moduleId: module.id,
        permissions: {
          can_view: effective_permission.can_view,
          can_create: effective_permission.can_create,
          can_edit: effective_permission.can_edit,
          can_delete: effective_permission.can_delete,
          scope: effective_permission.scope
        }
      });
      setIsOpen(true);
    }
  };

  const handlePermissionChange = (field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete', value: boolean) => {
    setPermission.mutate({
      userId,
      moduleId: module.id,
      permissions: {
        can_view: field === 'can_view' ? value : effective_permission.can_view,
        can_create: field === 'can_create' ? value : effective_permission.can_create,
        can_edit: field === 'can_edit' ? value : effective_permission.can_edit,
        can_delete: field === 'can_delete' ? value : effective_permission.can_delete,
        scope: effective_permission.scope
      }
    });
  };

  const handleScopeChange = (scope: ScopeType) => {
    setPermission.mutate({
      userId,
      moduleId: module.id,
      permissions: {
        can_view: effective_permission.can_view,
        can_create: effective_permission.can_create,
        can_edit: effective_permission.can_edit,
        can_delete: effective_permission.can_delete,
        scope
      }
    });
  };

  const hasAnyPermission = effective_permission.can_view || effective_permission.can_create || 
                           effective_permission.can_edit || effective_permission.can_delete;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`rounded-lg border ${isCustom ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-5">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isCustom}
                  onCheckedChange={handleToggleCustom}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isPending}
                />
                <span className="font-medium">{module.display_name}</span>
                
                {isCustom && (
                  <Badge variant="default" className="text-xs">
                    Customizado
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              
              {/* Quick status icons */}
              <div className="flex items-center gap-1">
                {effective_permission.can_view && (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {effective_permission.can_create && (
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {effective_permission.can_edit && (
                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {effective_permission.can_delete && (
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              {!hasAnyPermission && (
                <Badge variant="secondary" className="text-xs">
                  Sem acesso
                </Badge>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t border-border/50">
            <div className="space-y-4">
              {/* Role Permission Info */}
              {role_permission && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  <span className="font-medium">Permissão do perfil: </span>
                  {role_permission.can_view && 'Ver'}
                  {role_permission.can_create && ', Criar'}
                  {role_permission.can_edit && ', Editar'}
                  {role_permission.can_delete && ', Excluir'}
                  {!role_permission.can_view && !role_permission.can_create && 
                   !role_permission.can_edit && !role_permission.can_delete && 'Sem acesso'}
                  {' '}({SCOPE_LABELS[role_permission.scope]})
                </div>
              )}

              {/* Permission Checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={effective_permission.can_view}
                    onCheckedChange={(checked) => handlePermissionChange('can_view', !!checked)}
                    disabled={!isCustom || isPending}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={effective_permission.can_create}
                    onCheckedChange={(checked) => handlePermissionChange('can_create', !!checked)}
                    disabled={!isCustom || isPending}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Criar
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={effective_permission.can_edit}
                    onCheckedChange={(checked) => handlePermissionChange('can_edit', !!checked)}
                    disabled={!isCustom || isPending}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={effective_permission.can_delete}
                    onCheckedChange={(checked) => handlePermissionChange('can_delete', !!checked)}
                    disabled={!isCustom || isPending}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </span>
                </label>
              </div>

              {/* Scope Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Escopo:</span>
                <Select
                  value={effective_permission.scope}
                  onValueChange={(v) => handleScopeChange(v as ScopeType)}
                  disabled={!isCustom || isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="empreendimento">Por Empreendimento</SelectItem>
                    <SelectItem value="proprio">Próprios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset to Role Button */}
              {isCustom && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePermission.mutate({ userId, moduleId: module.id })}
                  disabled={isPending}
                  className="text-muted-foreground"
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Usar permissão do perfil
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
