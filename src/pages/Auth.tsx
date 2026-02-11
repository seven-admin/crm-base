import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultRoute } from '@/hooks/useDefaultRoute';
import { LoginForm } from '@/components/auth/LoginForm';
import { ImobiliariaRegisterForm } from '@/components/auth/ImobiliariaRegisterForm';

type AuthView = 'login' | 'register-imobiliaria';

export default function Auth() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { getDefaultRoute, isLoading: permLoading } = useDefaultRoute();
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>('login');

  useEffect(() => {
    if (!authLoading && !permLoading && isAuthenticated) {
      const defaultRoute = getDefaultRoute();
      navigate(defaultRoute, { replace: true });
    }
  }, [isAuthenticated, authLoading, permLoading, navigate, getDefaultRoute]);

  if (authLoading || permLoading) {
    return null;
  }

  if (view === 'register-imobiliaria') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-lg">
          <ImobiliariaRegisterForm onBack={() => setView('login')} />
        </div>
      </div>
    );
  }

  return <LoginForm onRegisterImobiliaria={() => setView('register-imobiliaria')} />;
}
