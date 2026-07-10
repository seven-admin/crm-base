import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultRoute } from '@/hooks/useDefaultRoute';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Auth() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { getDefaultRoute, isLoading: permLoading } = useDefaultRoute();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !permLoading && isAuthenticated) {
      const defaultRoute = getDefaultRoute();
      navigate(defaultRoute, { replace: true });
    }
  }, [isAuthenticated, authLoading, permLoading, navigate, getDefaultRoute]);

  if (authLoading || permLoading) {
    return null;
  }

  return <LoginForm />;
}
