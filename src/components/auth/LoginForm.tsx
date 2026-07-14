import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      setLoginError(validation.error.errors[0].message);
      return;
    }

    setLoginLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          setLoginError(error.message);
        }
      } else {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setLoginError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setLoginError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setLoginError(error.message);
      } else {
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
        setShowForgotPassword(false);
        setForgotEmail('');
      }
    } catch {
      setLoginError('Erro ao enviar email de recuperação.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-[hsl(208,91%,95%)] via-[hsl(220,20%,97%)] to-[hsl(28,100%,95%)] dark:from-[hsl(220,26%,9%)] dark:via-[hsl(220,26%,11%)] dark:to-[hsl(217,33%,14%)]">
      {/* Floating color blobs */}
      <div className="blob h-[30rem] w-[30rem] bg-primary/30 -top-40 -left-40" />
      <div className="blob h-[26rem] w-[26rem] bg-accent/25 top-1/4 -right-32" style={{ animationDelay: '4s' }} />
      <div className="blob h-[24rem] w-[24rem] bg-success/20 -bottom-32 left-1/4" style={{ animationDelay: '8s' }} />

      <div className="relative z-10 w-full max-w-sm liquid-glass rounded-[2rem] p-8 sm:p-10">
        <div className="relative flex flex-col items-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            SVN <span className="text-primary">CRM</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Entre com suas credenciais para acessar
          </p>
        </div>

        <div className="relative space-y-7">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl text-sm font-medium liquid-input hover:bg-white/70 dark:hover:bg-white/10"
            onClick={async () => {
              setLoginError('');
              const { error } = await signInWithGoogle();
              if (error) setLoginError(error.message);
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/60 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="liquid-input px-2 py-0.5 rounded-full text-muted-foreground">ou</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="h-12 rounded-xl liquid-input"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">Senha</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setForgotEmail(loginEmail);
                    setLoginError('');
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="h-12 rounded-xl liquid-input"
                required
              />
            </div>

            {showForgotPassword && (
              <div className="p-4 border border-white/60 dark:border-white/10 rounded-xl liquid-input space-y-3">
                <p className="text-sm text-foreground font-medium">Recuperar senha</p>
                <p className="text-xs text-muted-foreground">
                  Informe seu email para receber o link de recuperação.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-10 rounded-xl liquid-input"
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={forgotLoading} className="flex-1 rounded-xl">
                      {forgotLoading ? 'Enviando...' : 'Enviar Link'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="liquid-input rounded-xl"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25"
              disabled={loginLoading}
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="relative text-center text-xs text-muted-foreground mt-10">
          © 2026 SVN - CRM. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
