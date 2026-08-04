import { CalendarDays, CircleDollarSign } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FunilArqoCard } from './components/FunilArqoCard';
import { TopEmpreendimentosTable } from './components/TopEmpreendimentosTable';
import { PropostasNexaCard } from './components/PropostasNexaCard';
import { useDashboardKPIs } from './useDashboardData';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

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

  return (
    <MainLayout contentClassName="pb-10 pt-4 md:pt-6">
      <div className="space-y-5 md:space-y-6">
        <h1 className="sr-only">Dashboard comercial</h1>

        <section className="dashboard-hero relative overflow-hidden rounded-[2rem] bg-[#f7f3ed] p-6 shadow-[0_18px_55px_-35px_rgba(37,24,14,.45)] sm:p-8 lg:rounded-[2.5rem] lg:p-10">
          <div className="pointer-events-none absolute -right-24 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-[#ff7417]/25" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-start lg:gap-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f47418]">Visão comercial</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-3 py-2 text-xs font-medium capitalize text-black/55 backdrop-blur-md">
                <CalendarDays className="h-3.5 w-3.5" /> {periodo}
              </span>
            </div>

            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-medium text-black/45">{primeiroNome ? `${saudacao()}, ${primeiroNome}.` : 'Visão geral da operação.'}</p>
              {isLoading || !kpis ? (
                <Skeleton className="h-20 w-3/4 rounded-2xl" />
              ) : (
                <>
                  <p className="text-[clamp(3rem,6vw,6rem)] font-semibold leading-[.85] tracking-[-0.075em] text-[#181613]">
                    {formatarMoedaCompacta(kpis.vgvNegociacao)}
                  </p>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-black/50">
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
        </section>

        <section aria-label="Propostas Nexa">
          <PropostasNexaCard />
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
