import { useState } from 'react';
import { CircleDollarSign } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FunilArqoCard } from './components/FunilArqoCard';
import { TopEmpreendimentosTable } from './components/TopEmpreendimentosTable';
import { OperacaoCard } from './components/OperacaoCard';
import { RankingOperacaoCard } from './components/RankingOperacaoCard';
import { MonthPicker } from '@/components/shared/MonthPicker';
import { useAuth } from '@/contexts/AuthContext';

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardHome() {
  const [month, setMonth] = useState(new Date());
  const { profile } = useAuth();
  const primeiroNome = profile?.full_name?.split(' ')[0];

  return (
    <MainLayout contentClassName="pb-10 pt-4 md:pt-6">
      <div className="space-y-5 md:space-y-6">
        <h1 className="sr-only">Dashboard comercial</h1>

        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f47418]">Visão comercial</span>
            <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#181613]">
              {primeiroNome ? `${saudacao()}, ${primeiroNome}.` : 'Visão geral da operação.'}
            </p>
          </div>
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        <OperacaoCard month={month} />

        <RankingOperacaoCard month={month} />

        <section aria-label="Portfólio de empreendimentos">
          <TopEmpreendimentosTable month={month} />
        </section>

        <section aria-label="Funil comercial">
          <FunilArqoCard />
        </section>

        <footer className="flex flex-col gap-2 px-2 text-xs text-black/35 sm:flex-row sm:items-center sm:justify-between">
          <span>SVN CRM · Seven Group 360</span>
          <span className="inline-flex items-center gap-1.5"><CircleDollarSign className="h-3.5 w-3.5" /> Indicadores calculados com dados da operação</span>
        </footer>
      </div>
    </MainLayout>
  );
}
