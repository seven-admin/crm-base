import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultRoute } from '@/hooks/useDefaultRoute';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { role, isLoading: authLoading } = useAuth();
  const { getDefaultRoute, isLoading: permLoading } = useDefaultRoute();

  // Aguardar TODAS as informações carregarem antes de decidir redirecionamento
  // IMPORTANTE: Incluir verificação de role === null para evitar race conditions
  if (authLoading || permLoading || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Incorporadores vão para o portal dedicado - verificação explícita antes de getDefaultRoute
  if (role === 'incorporador') {
    return <Navigate to="/portal-incorporador" replace />;
  }

  // Corretores e gestores de imobiliária vão para o portal do corretor
  if (role === 'corretor' || role === 'gestor_imobiliaria') {
    return <Navigate to="/portal-corretor" replace />;
  }

  // Agora as permissões estão carregadas, getDefaultRoute() retorna valor correto
  const defaultRoute = getDefaultRoute();
  
  // Se a rota padrão é "/" (este componente), redireciona para dashboard-executivo para evitar loop
  if (defaultRoute === '/') {
    return <Navigate to="/dashboard-executivo" replace />;
  }

  return <Navigate to={defaultRoute} replace />;
};

export default Index;
