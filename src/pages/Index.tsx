import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DashboardHome } from './dashboard/DashboardHome';

const Index = () => {
  const { role, isLoading: authLoading } = useAuth();

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

  if (role === 'corretor' || role === 'gestor_imobiliaria') {
    return <Navigate to="/portal-corretor" replace />;
  }

  return <DashboardHome />;
};

export default Index;
