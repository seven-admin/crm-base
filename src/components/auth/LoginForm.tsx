import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

import { useConfiguracoesSistema } from '@/hooks/useConfiguracoesSistema';
import logoAsset from '@/assets/logo-sevengroup.png.asset.json';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

interface LoginFormProps {
  onRegisterImobiliaria?: () => void;
  onRegisterCorretor?: () => void;
}

export function LoginForm({ onRegisterImobiliaria, onRegisterCorretor }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { data: configs, isError } = useConfiguracoesSistema();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const getConfig = (chave: string, fallback: string) => {
    if (isError || !configs) return fallback;
    return configs.find(c => c.chave === chave)?.valor || fallback;
  };

  const copyright = getConfig('copyright_texto', '2024 Seven Group. Todos os direitos reservados.');

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <img
            src={logoAsset.url}
            alt="Seven Group"
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Entre com suas credenciais para acessar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
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
                className="h-11"
                required
              />
            </div>

            {showForgotPassword && (
              <div className="p-4 border border-border rounded-lg bg-muted/50 space-y-3">
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
                    className="h-10"
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={forgotLoading} className="flex-1">
                      {forgotLoading ? 'Enviando...' : 'Enviar Link'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
              className="w-full h-11 text-sm font-semibold" 
              disabled={loginLoading}
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            {(onRegisterImobiliaria || onRegisterCorretor) && (
              <div className="text-center pt-2 space-y-1">
                {onRegisterImobiliaria && (
                  <button
                    type="button"
                    onClick={onRegisterImobiliaria}
                    className="text-sm text-primary hover:underline block w-full"
                  >
                    Cadastrar Imobiliária
                  </button>
                )}
                {onRegisterCorretor && (
                  <button
                    type="button"
                    onClick={onRegisterCorretor}
                    className="text-sm text-primary hover:underline block w-full"
                  >
                    Cadastrar Corretor
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          © {copyright}
        </p>
      </div>
    </div>
  );
}
