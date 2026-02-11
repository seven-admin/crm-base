import { ShieldOff, LogOut, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SemAcesso() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
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
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
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
