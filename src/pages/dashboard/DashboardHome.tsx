import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Home,
  Percent,
  Sparkles,
  Users,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FunilArqoCard } from './components/FunilArqoCard';
import { TopEmpreendimentosTable } from './components/TopEmpreendimentosTable';
import { useDashboardKPIs } from './useDashboardData';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

function variacao(atual: number, anterior: number) {
  if (anterior === 0) return atual > 0 ? 'Sem base anterior' : 'Sem dados';
  const diff = ((atual - anterior) / anterior) * 100;
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs. mês anterior`;
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardHome() {
  const periodo = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const { data: kpis, isLoading } = useDashboardKPIs();
  const { profile } = useAuth();
  const primeiroNome = profile?.full_name?.split(' ')[0];

  const metrics = kpis ? [
    {
      label: 'Leads no mês',
      value: kpis.leadsMes.toLocaleString('pt-BR'),
      detail: variacao(kpis.leadsMes, kpis.leadsMesAnterior),
      icon: Users,
    },
    {
      label: 'Conversão',
      value: `${kpis.taxaConversao.toFixed(1)}%`,
      detail: `${kpis.taxaConversao - kpis.taxaConversaoAnterior >= 0 ? '+' : ''}${(kpis.taxaConversao - kpis.taxaConversaoAnterior).toFixed(1)} p.p.`,
      icon: Percent,
    },
    {
      label: 'Vendas',
      value: String(kpis.vendasMes).padStart(2, '0'),
      detail: kpis.ticketMedio > 0 ? `Ticket ${formatarMoedaCompacta(kpis.ticketMedio)}` : 'Sem vendas registradas',
      icon: Home,
    },
  ] : [];

  return (
    <MainLayout contentClassName="pb-10 pt-4 md:pt-6">
      <div className="space-y-5 md:space-y-6">
        <h1 className="sr-only">Dashboard comercial</h1>
        <section className="dashboard-hero relative overflow-hidden rounded-[2rem] bg-[#f7f3ed] p-6 shadow-[0_18px_55px_-35px_rgba(37,24,14,.45)] sm:p-8 lg:min-h-[390px] lg:rounded-[2.5rem] lg:p-10">
          <div className="pointer-events-none absolute -right-20 top-1/2 h-[360px] w-[360px] -translate-y-1/2 rounded-full bg-[#ff7417] lg:right-[11%] lg:h-[430px] lg:w-[430px]" />
          <div className="pointer-events-none absolute right-[5%] top-1/2 hidden h-16 w-16 -translate-y-1/2 rounded-full bg-[#f7f3ed] shadow-[0_14px_35px_rgba(0,0,0,.12)] lg:block" />

          <div className="relative grid h-full gap-6 lg:grid-cols-[1.45fr_.55fr]">
            <div className="flex min-h-[270px] flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-start lg:gap-8">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f47418]">Visão comercial</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-3 py-2 text-xs font-medium capitalize text-black/55 backdrop-blur-md">
                  <CalendarDays className="h-3.5 w-3.5" /> {periodo}
                </span>
              </div>

              <div className="max-w-2xl py-8 lg:py-4">
                <p className="mb-3 text-sm font-medium text-black/45">{primeiroNome ? `${saudacao()}, ${primeiroNome}.` : 'Visão geral da operação.'}</p>
                {isLoading || !kpis ? (
                  <Skeleton className="h-20 w-3/4 rounded-2xl" />
                ) : (
                  <>
                    <p className="text-[clamp(3.4rem,7vw,7.2rem)] font-semibold leading-[.82] tracking-[-0.075em] text-[#181613]">
                      {formatarMoedaCompacta(kpis.vgvNegociacao)}
                    </p>
                    <p className="mt-5 max-w-md text-base leading-relaxed text-black/50">
                      em valor geral de vendas atualmente em negociação.
                    </p>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-black/55">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ff7417]" /> Operação atualizada</span>
                <span>{kpis?.propostasAtivas ?? '—'} propostas ativas</span>
              </div>
            </div>

            <aside className="relative z-10 flex min-h-[270px] flex-col rounded-[1.75rem] bg-[#201a17] p-6 text-[#f8f4ef] shadow-[0_24px_60px_-24px_rgba(0,0,0,.55)] sm:p-7">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a39]">Agora</span>
                <Sparkles className="h-4 w-4 text-[#ff8a39]" />
              </div>
              <p className="mt-9 text-2xl font-semibold leading-tight tracking-[-0.04em]">Sua operação<br />em movimento.</p>
              <div className="mt-auto space-y-3 border-t border-white/10 pt-5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/50">Propostas ativas</span>
                  <strong className="font-semibold tabular-nums">{kpis?.propostasAtivas ?? '—'}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/50">Vendas no mês</span>
                  <strong className="font-semibold tabular-nums">{kpis?.vendasMes ?? '—'}</strong>
                </div>
              </div>
              <Link to="/arqo/leads" className="mt-5 inline-flex items-center justify-between rounded-full bg-[#ff7417] px-4 py-3 text-xs font-bold text-[#21150d] transition-transform hover:scale-[1.01]">
                Ver operação Arqo <ArrowUpRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </section>

        <section aria-label="Indicadores principais" className="overflow-hidden rounded-[1.75rem] border border-black/[.06] bg-[#fffdfa]">
          {isLoading || !kpis ? (
            <div className="grid gap-px bg-black/[.06] sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-none bg-[#fffdfa]" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-3">
              {metrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <article key={metric.label} className="group relative min-h-40 border-b border-black/[.06] p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">{metric.label}</p>
                      <Icon className="h-4 w-4 text-[#f47418]" />
                    </div>
                    <p className="mt-6 text-4xl font-semibold tracking-[-0.055em] text-[#181613] tabular-nums lg:text-5xl">{metric.value}</p>
                    <p className="mt-3 text-xs text-black/45">{metric.detail}</p>
                    <span className="absolute inset-x-6 bottom-0 h-0.5 origin-left scale-x-0 bg-[#ff7417] transition-transform group-hover:scale-x-100" />
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[.85fr_1.15fr]" aria-label="Desempenho comercial">
          <FunilArqoCard />
          <TopEmpreendimentosTable />
        </section>

        <footer className="flex flex-col gap-2 px-2 text-xs text-black/35 sm:flex-row sm:items-center sm:justify-between">
          <span>SVN CRM · Seven Group 360</span>
          <span className="inline-flex items-center gap-1.5"><CircleDollarSign className="h-3.5 w-3.5" /> Indicadores calculados com dados da operação</span>
        </footer>
      </div>
    </MainLayout>
  );
}
