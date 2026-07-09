import { usePermissions } from './usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresaAccess } from './useEmpresaAccess';

const routePriority = [
  { path: '/', module: 'dashboard' },
  { path: '/mapa-unidades', module: 'unidades' },
  { path: '/empreendimentos', module: 'empreendimentos' },
  { path: '/clientes', module: 'clientes' },
];

export function useDefaultRoute() {
  const { canAccessModule, isLoading, isAdmin, permissions } = usePermissions();
  const { role } = useAuth();
  const { empresa } = useEmpresaAccess();

  const getDefaultRoute = (): string => {
    // Empresa define a área principal, exceto para admins Seven
    if (empresa === 'externo') return '/sem-acesso';
    if (empresa === 'arqo' && !isAdmin()) return '/arqo/roleta';
    if (empresa === 'nexa' && !isAdmin()) return '/nexa/agenda';
    if (empresa === 'incorporador') return '/portal-incorporador';

    // Admins e usuários Seven
    if (isAdmin() || role === 'super_admin' || role === 'admin') return '/';

    // Legado (compat com roles antigos)
    if (role === 'incorporador') return '/portal-incorporador';
    if (role === 'corretor' || role === 'gestor_imobiliaria') return '/portal-corretor';

    if (permissions.length === 0) return '/';

    for (const route of routePriority) {
      if (canAccessModule(route.module, 'view')) return route.path;
    }
    return '/sem-acesso';
  };

  const canAccessDashboard = (): boolean => canAccessModule('dashboard', 'view');

  return { getDefaultRoute, canAccessDashboard, isLoading };
}

