import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

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
    return <Navigate to="/portal-incorporador" replace />;
  }

  if (role === 'corretor' || role === 'gestor_imobiliaria') {
    return <Navigate to="/portal-corretor" replace />;
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-sm text-muted-foreground">Bem-vindo ao Seven Group</p>
      </div>
    </MainLayout>
  );
};

export default Index;
