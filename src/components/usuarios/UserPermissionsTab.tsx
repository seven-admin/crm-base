import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RotateCcw, Info, Shield } from 'lucide-react';
import { AppRole, ROLE_LABELS } from '@/types/auth.types';
import { 
  useModulesWithPermissions, 
  useResetUserPermissions,
  ModuleWithPermission
} from '@/hooks/useUserPermissions';
import { ModulePermissionRow } from './ModulePermissionRow';

interface UserPermissionsTabProps {
  userId: string;
  userRole: AppRole | null;
}

export function UserPermissionsTab({ userId, userRole }: UserPermissionsTabProps) {
  const { data: modules, isLoading } = useModulesWithPermissions(userId, userRole || undefined);
  const resetPermissions = useResetUserPermissions();
  
  const customCount = modules?.filter(m => m.effective_permission.is_custom).length || 0;

  const handleResetAll = () => {
    if (confirm('Isso removerá todas as permissões customizadas. O usuário usará apenas as permissões do perfil. Continuar?')) {
      resetPermissions.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Perfil Base: </span>
          <Badge variant="outline" className="ml-1">
            <Shield className="mr-1 h-3 w-3" />
            {userRole ? ROLE_LABELS[userRole] : 'Sem perfil'}
          </Badge>
          <span className="ml-2 text-muted-foreground">
            Personalize os módulos abaixo para sobrescrever as permissões do perfil.
          </span>
        </AlertDescription>
      </Alert>

      {/* Actions */}
      {customCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{customCount}</span> permissões customizadas
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            disabled={resetPermissions.isPending}
          >
            {resetPermissions.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Restaurar Padrões
          </Button>
        </div>
      )}

      {/* Modules List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {modules?.map((module) => (
            <ModulePermissionRow
              key={module.id}
              module={module}
              userId={userId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
