import { ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useDefaultRoute } from '@/hooks/useDefaultRoute';
import { useEmpresaAccess } from '@/hooks/useEmpresaAccess';
import { ActionType } from '@/types/auth.types';
import { Loader2 } from 'lucide-react';


// Check if user has any view permission at all
const hasAnyViewPermission = (permissions: { can_view: boolean }[]): boolean => {
  return permissions.some(p => p.can_view);
};

interface ProtectedRouteProps {
  children: ReactNode;
  moduleName?: string;
  alternativeModules?: string[];
  requiredAction?: ActionType;
  adminOnly?: boolean;
}

export function ProtectedRoute({ 
  children, 
  moduleName, 
  alternativeModules,
  requiredAction = 'view',
  adminOnly = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading, role } = useAuth();
  const { canAccessModule, isAdmin, isLoading: permLoading, permissions } = usePermissions();
  const { getDefaultRoute } = useDefaultRoute();
  const { empresa, isSeven } = useEmpresaAccess();
  const location = useLocation();

  const [timedOut, setTimedOut] = useState(false);

  // Keep loading while authenticated but role not yet loaded
  const isLoading = authLoading || permLoading || (isAuthenticated && role === null);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('ProtectedRoute loading timed out after 10 seconds');
        setTimedOut(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // If timed out and not authenticated, redirect to auth
  if (timedOut && !isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Restrição por empresa (ortogonal ao role). Admins Seven passam.
  const path = location.pathname;
  const isSelfPath = path === '/meu-perfil' || path === '/sem-acesso';
  if (!isSelfPath && !isAdmin()) {
    if (empresa === 'externo') {
      return <Navigate to="/sem-acesso" replace />;
    }
    if (empresa === 'arqo' && !path.startsWith('/arqo')) {
      return <Navigate to="/arqo/roleta" replace />;
    }
    if (empresa === 'nexa' && !path.startsWith('/nexa')) {
      return <Navigate to="/nexa/agenda" replace />;
    }
    if (empresa === 'incorporador' && !path.startsWith('/portal-incorporador')) {
      return <Navigate to="/portal-incorporador" replace />;
    }
  }

  // IMPORTANTE: legado por role (mantém compat com role incorporador / corretor)
  if (role === 'incorporador' && !path.startsWith('/portal-incorporador') && !isSelfPath) {
    return <Navigate to="/portal-incorporador" replace />;
  }

  if ((role === 'corretor' || role === 'gestor_imobiliaria') && !path.startsWith('/portal-corretor') && !path.startsWith('/portal') && !isSelfPath) {
    return <Navigate to="/portal-corretor" replace />;
  }


  // Check admin-only routes
  if (adminOnly && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  // Check if user has ANY permissions at all (not admin and no view permissions)
  if (!isAdmin() && permissions.length > 0 && !hasAnyViewPermission(permissions)) {
    // User has no permissions configured - redirect to dedicated page
    if (location.pathname !== '/sem-acesso') {
      return <Navigate to="/sem-acesso" replace />;
    }
  }

  // Check module permissions
  if (moduleName) {
    const hasMainAccess = canAccessModule(moduleName, requiredAction);
    const hasAlternativeAccess = alternativeModules?.some(m => canAccessModule(m, requiredAction)) ?? false;
    
    if (!hasMainAccess && !hasAlternativeAccess) {
      // Se for o dashboard (rota inicial), redireciona para a rota padrão do usuário
      if (moduleName === 'dashboard' && location.pathname === '/') {
        const defaultRoute = getDefaultRoute();
        if (defaultRoute !== '/') {
          return <Navigate to={defaultRoute} replace />;
        }
        // If no default route found and no permissions, go to sem-acesso
        if (!isAdmin() && !hasAnyViewPermission(permissions)) {
          return <Navigate to="/sem-acesso" replace />;
        }
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar este módulo.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
