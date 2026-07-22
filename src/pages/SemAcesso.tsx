import { ShieldOff, LogOut, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useDefaultRoute } from '@/hooks/useDefaultRoute';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function SemAcesso() {
  const { user } = useAuth();
  const { permissions, isLoading, isAdmin } = usePermissions();
  const { getDefaultRoute } = useDefaultRoute();

  const defaultRoute = getDefaultRoute();
  if (!isLoading && defaultRoute !== '/sem-acesso' && (isAdmin() || permissions.some((permission) => permission.can_view))) {
    return <Navigate to={defaultRoute} replace />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
  };

  return (
    <div className="login-canvas relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d0c0a] p-4">
      <Card className="relative z-10 w-full max-w-md border-white/50 bg-[#f7f3ed]/95 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <ShieldOff className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-xl">Acesso Pendente</CardTitle>
          <CardDescription>
            Seu perfil ainda não possui permissões configuradas no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[1.25rem] bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">O que fazer?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Entre em contato com o administrador do sistema</li>
              <li>Solicite a liberação das permissões necessárias</li>
              <li>Aguarde a configuração do seu perfil de acesso</li>
            </ul>
          </div>

          {user?.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Logado como: {user.email}</span>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair e trocar de conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
