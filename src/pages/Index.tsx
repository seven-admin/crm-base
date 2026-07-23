import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DashboardHome } from './dashboard/DashboardHome';
import { useEmpresaAccess } from '@/hooks/useEmpresaAccess';

const Index = () => {
  const { role, isLoading: authLoading } = useAuth();
  const { empresa } = useEmpresaAccess();

  if (authLoading || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === 'incorporador') {
    return <Navigate to="/sem-acesso" replace />;
  }

  if (empresa === 'arqo') {
    return <Navigate to="/arqo/roleta" replace />;
  }

  if (role === 'corretor' || role === 'gestor_imobiliaria') {
    return <Navigate to="/portal-corretor" replace />;
  }

  return <DashboardHome />;
};

export default Index;
