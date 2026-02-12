import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import logoIcon from '@/assets/logo-icon.png';

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
        <img src={logoIcon} alt="Seven Group" className="h-48 object-contain opacity-10" />
      </div>
    </MainLayout>
  );
};

export default Index;
