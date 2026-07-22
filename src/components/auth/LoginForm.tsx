import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail, MapPin } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import logoSeven from '@/assets/logo-sevengroup.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const dayFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' });
const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
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
        if (error.message.includes('Invalid login credentials')) setLoginError('Email ou senha incorretos');
        else if (error.message.includes('Email not confirmed')) setLoginError('Email não confirmado. Verifique sua caixa de entrada.');
        else setLoginError(error.message);
      } else {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch {
      setLoginError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    const { error } = await signInWithGoogle();
    if (error) setLoginError(error.message);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    setLoginError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setLoginError(error.message);
      else {
        toast({ title: 'Email enviado!', description: 'Verifique sua caixa de entrada para redefinir sua senha.' });
        setShowForgotPassword(false);
        setForgotEmail('');
      }
    } catch {
      setLoginError('Erro ao enviar email de recuperação.');
    } finally {
      setForgotLoading(false);
    }
  };

  const weekDay = dateFormatter.format(now).replace('.', '').toUpperCase();
  const day = dayFormatter.format(now);

  return (
    <main className="login-canvas min-h-screen overflow-hidden bg-[#0d0c0a] p-3 text-[#181613] sm:p-5 lg:h-screen lg:min-h-[720px] lg:p-7">
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1580px] gap-3 lg:h-full lg:min-h-0 lg:grid-cols-[1.04fr_.96fr] lg:gap-5">
        <section className="grid min-h-[700px] gap-3 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-5">
          <div className="login-access-card relative flex min-h-[570px] flex-col overflow-hidden rounded-[2rem] border border-white/45 bg-[#d5d1cc]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,.28)] backdrop-blur-xl sm:p-9 lg:min-h-0 lg:rounded-[2.6rem] lg:p-12">
            <div className="flex items-center justify-between gap-5">
              <img src={logoSeven} alt="Seven Group" className="h-auto w-44 sm:w-52" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">SVN CRM</span>
            </div>

            <div className="my-auto max-w-xl py-12 lg:py-8">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f47418]">Acesso ao sistema</p>
              <h1 className="max-w-lg text-[clamp(2.35rem,4.2vw,4.6rem)] font-semibold leading-[.96] tracking-[-0.055em] text-[#181613]">
                Bem-vindo<br />de volta.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-black/55 sm:text-base">
                Sua operação comercial, organizada para decisões mais rápidas.
              </p>
            </div>

            <div className="relative z-10 max-w-2xl">
              {loginError && (
                <div role="alert" aria-live="polite" className="mb-3 rounded-2xl border border-red-900/15 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Label htmlFor="login-email" className="sr-only">Email</Label>
                  <Mail className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Insira seu email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    className="h-14 rounded-full border-white/80 bg-white/80 pl-12 pr-5 text-[#181613] shadow-none placeholder:text-black/35 focus-visible:border-[#f47418] focus-visible:ring-[#f47418]/20 sm:h-16"
                    required
                  />
                </div>

                <div className="relative">
                  <Label htmlFor="login-password" className="sr-only">Senha</Label>
                  <LockKeyhole className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Insira sua senha"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    className="h-14 rounded-full border-white/80 bg-white/80 pl-12 pr-20 text-[#181613] shadow-none placeholder:text-black/35 focus-visible:border-[#f47418] focus-visible:ring-[#f47418]/20 sm:h-16"
                    required
                  />
                  <button
                    type="submit"
                    aria-label="Entrar"
                    disabled={loginLoading}
                    className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#181613] text-white transition-transform hover:scale-[1.04] disabled:cursor-wait disabled:opacity-60 sm:h-[52px] sm:w-[52px]"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-3 px-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword((current) => !current);
                      setForgotEmail(loginEmail);
                      setLoginError('');
                    }}
                    className="text-left text-xs font-medium text-black/55 transition-colors hover:text-black"
                  >
                    Esqueci minha senha
                  </button>
                  <button type="button" onClick={handleGoogleLogin} className="inline-flex items-center gap-2 text-xs font-semibold text-black/70 transition-colors hover:text-black">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white font-bold text-[#4285f4]">G</span>
                    Continuar com Google
                  </button>
                </div>
              </form>

              {showForgotPassword && (
                <div className="mt-4 rounded-[1.4rem] border border-white/70 bg-white/55 p-4 backdrop-blur-md">
                  <div className="mb-3">
                    <p className="text-sm font-semibold">Recuperar acesso</p>
                    <p className="mt-1 text-xs text-black/50">Enviaremos um link seguro para o seu email.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      aria-label="Email para recuperação"
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(event) => setForgotEmail(event.target.value)}
                      className="h-11 flex-1 rounded-full border-white bg-white/80"
                      required
                    />
                    <Button type="button" onClick={handleForgotPassword} disabled={forgotLoading} className="h-11 rounded-full bg-[#181613] px-5 hover:bg-black">
                      {forgotLoading ? 'Enviando...' : 'Enviar link'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="relative hidden min-h-40 overflow-hidden rounded-[2.6rem] border border-[#f47418]/45 bg-[#201a17]/95 px-10 py-8 text-[#f7f2ec] shadow-[0_30px_80px_rgba(0,0,0,.25)] lg:block">
            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border border-[#f47418]/25" />
            <blockquote className="relative max-w-2xl text-lg font-medium leading-relaxed tracking-[-0.02em]">
              “A excelência está na constância de fazer bem-feito, todos os dias.”
            </blockquote>
            <p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Cultura Seven</p>
          </aside>
        </section>

        <aside className="relative hidden min-h-[700px] overflow-hidden rounded-[2.8rem] bg-[#f8f5f0] shadow-[0_30px_90px_rgba(0,0,0,.28)] lg:block">
          <div className="absolute right-[4%] top-11 text-right">
            <p className="text-sm font-semibold">O que vamos</p>
            <p className="text-sm text-black/45">construir hoje?</p>
          </div>
          <div className="absolute left-[46%] top-[31%] h-[38%] aspect-square rounded-full bg-[#ff7417]" />
          <div className="absolute left-[42%] top-[52%] h-12 w-12 -translate-y-1/2 rounded-full bg-[#f8f5f0] shadow-[0_10px_30px_rgba(0,0,0,.12)]" />

          <div className="login-date-panel absolute inset-y-6 left-6 flex w-[51%] flex-col rounded-[2.25rem] border border-white/60 bg-white/42 p-8 shadow-[18px_0_55px_rgba(34,23,14,.13)] backdrop-blur-xl xl:p-12">
            <div>
              <p className="text-[clamp(3.2rem,6vw,6.7rem)] font-medium uppercase leading-[.82] tracking-[-0.085em]">{weekDay}</p>
              <p className="mt-5 text-[clamp(4rem,7.5vw,8.2rem)] font-light leading-[.72] tracking-[-0.08em] text-black/25">{day}</p>
            </div>
            <div className="mt-auto">
              <p className="text-3xl font-semibold tracking-[-0.04em]">{timeFormatter.format(now)}</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4" /> Campo Grande</p>
            </div>
            <div className="mt-auto flex items-end justify-between pt-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">Seven Group 360</span>
              <span className="text-5xl font-light leading-none tracking-[-0.15em] text-[#f47418]">N<span className="align-top text-xl">·</span></span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
