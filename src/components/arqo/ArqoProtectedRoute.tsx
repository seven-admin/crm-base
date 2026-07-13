import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

const ARQO_ROLES = ['arqo_admin', 'arqo_gestor', 'arqo_consultor', 'arqo_closer'];

export function ArqoProtectedRoute({ children, moduleName }: { children: ReactNode; moduleName?: string }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const { isAdmin, isLoading: permLoading, canAccessModule } = usePermissions();

  if (isLoading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  const hasModuleAccess = moduleName ? canAccessModule(moduleName) : true;
  const hasAccess = isAdmin() || Boolean(role && ARQO_ROLES.includes(role) && hasModuleAccess);
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar o módulo Arqo.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
