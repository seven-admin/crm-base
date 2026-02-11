import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

import { useConfiguracoesSistema } from '@/hooks/useConfiguracoesSistema';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

interface LoginFormProps {
  onRegisterImobiliaria?: () => void;
}

export function LoginForm({ onRegisterImobiliaria }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { data: configs, isError } = useConfiguracoesSistema();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const getConfig = (chave: string, fallback: string) => {
    if (isError || !configs) return fallback;
    return configs.find(c => c.chave === chave)?.valor || fallback;
  };

  const loginSubtitulo = getConfig('login_subtitulo', 'CRM Imobiliário');
  const loginDescricao = getConfig('login_descricao', 'Plataforma completa para gestão de empreendimentos imobiliários');
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

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Abstract decorative elements */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-1/4 -left-20 w-80 h-80 rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, hsl(207 55% 51%) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, hsl(207 55% 62%) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute top-10 right-1/4 w-40 h-40 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, hsl(207 55% 70%) 0%, transparent 70%)' }}
          />
          {/* Subtle grid */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <p className="text-base text-slate-500 tracking-[0.3em] uppercase font-medium mb-3">
            {loginSubtitulo}
          </p>
          <h1 className="text-5xl font-bold text-white text-center tracking-tight">
            Seven Group 360
          </h1>
          <p className="text-slate-400 text-center mt-4 max-w-md text-base leading-relaxed">
            {loginDescricao}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <h2 className="text-xl font-bold text-foreground">Seven Group 360</h2>
          </div>

          <div className="space-y-6">
            <div className="text-center lg:text-left">
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
                <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
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

              <Button 
                type="submit" 
                className="w-full h-11 text-sm font-semibold" 
                disabled={loginLoading}
              >
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </Button>

              {onRegisterImobiliaria && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onRegisterImobiliaria}
                    className="text-sm text-primary hover:underline"
                  >
                    Cadastrar Imobiliária
                  </button>
                </div>
              )}
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-10">
            © {copyright}
          </p>
        </div>
      </div>
    </div>
  );
}
