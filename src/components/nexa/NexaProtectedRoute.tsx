import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';
import { NEXA_ROLES } from '@/types/nexa.types';

export function NexaProtectedRoute({ children, moduleName }: { children: ReactNode; moduleName?: string }) {
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

  // Rotas com módulo: quem decide é canAccessModule (que já trata super_admin,
  // o bypass de 'admin' e os módulos restritos ao super_admin como contratos).
  // Rotas sem módulo: mantém o acesso amplo (admin ou papel Nexa).
  const hasAccess = moduleName
    ? canAccessModule(moduleName)
    : (isAdmin() || Boolean(role && (NEXA_ROLES as readonly string[]).includes(role)));
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar o módulo Nexa.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
