import { usePermissions } from './usePermissions';
import { useAuth } from '@/contexts/AuthContext';

// Ordem de prioridade para redirecionamento
// Admin/Super Admin vão direto para dashboard, outros seguem prioridade
const routePriority = [
  { path: '/', module: 'dashboard' },
  { path: '/marketing', module: 'projetos_marketing' },
  { path: '/mapa-unidades', module: 'unidades' },
  { path: '/empreendimentos', module: 'empreendimentos' },
  { path: '/clientes', module: 'clientes' },
  { path: '/negociacoes', module: 'negociacoes' },
  { path: '/atividades', module: 'atividades' },
  { path: '/contratos', module: 'contratos' },
  { path: '/comissoes', module: 'comissoes' },
];

export function useDefaultRoute() {
  const { canAccessModule, isLoading, isAdmin, permissions } = usePermissions();
  const { role } = useAuth();

  const getDefaultRoute = (): string => {
    // Admin e Super Admin sempre vão para o dashboard
    if (isAdmin() || role === 'super_admin' || role === 'admin') {
      return '/';
    }
    
    // Incorporadores vão para o portal dedicado - SEMPRE
    if (role === 'incorporador') {
      return '/portal-incorporador';
    }

    // Corretores e gestores de imobiliária vão para o portal do corretor - SEMPRE
    if (role === 'corretor' || role === 'gestor_imobiliaria') {
      return '/portal-corretor';
    }
    
    // Se permissions ainda não carregaram, retornar fallback seguro
    // O componente que chama deve verificar isLoading antes de usar
    if (permissions.length === 0) {
      return '/';
    }
    
    for (const route of routePriority) {
      if (canAccessModule(route.module, 'view')) {
        return route.path;
      }
    }
    
    // Fallback final - página de sem acesso
    return '/sem-acesso';
  };

  const canAccessDashboard = (): boolean => {
    return canAccessModule('dashboard', 'view');
  };

  return {
    getDefaultRoute,
    canAccessDashboard,
    isLoading,
  };
}
