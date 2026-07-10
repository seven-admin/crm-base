import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { Users, Percent, TrendingUp, Home } from 'lucide-react';
import { FunilArqoCard } from './components/FunilArqoCard';
import { TopEmpreendimentosTable } from './components/TopEmpreendimentosTable';
import { useDashboardKPIs } from './useDashboardData';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

function variacao(atual: number, anterior: number): { label: string; type: 'positive' | 'negative' | 'neutral' } {
  if (anterior === 0) return { label: atual > 0 ? 'Sem base anterior' : 'Sem dados', type: 'neutral' };
  const diff = ((atual - anterior) / anterior) * 100;
  return {
    label: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs mês anterior`,
    type: diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral',
  };
}

export function DashboardHome() {
  const periodoMock = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const { data: kpis, isLoading } = useDashboardKPIs();

  return (
    <MainLayout>
      <PageHeader title="Visão Geral" subtitle={`Resumo executivo · ${periodoMock}`} />

      <div className="p-4 md:p-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading || !kpis ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          ) : (
            <>
              <KPICard
                title="Leads novos no mês"
                value={kpis.leadsMes.toLocaleString('pt-BR')}
                {...(() => { const v = variacao(kpis.leadsMes, kpis.leadsMesAnterior); return { change: v.label, changeType: v.type }; })()}
                icon={Users}
                iconColor="blue"
              />
              <KPICard
                title="Taxa de conversão"
                value={`${kpis.taxaConversao.toFixed(1)}%`}
                change={`${(kpis.taxaConversao - kpis.taxaConversaoAnterior >= 0 ? '+' : '')}${(kpis.taxaConversao - kpis.taxaConversaoAnterior).toFixed(1)} p.p.`}
                changeType={kpis.taxaConversao >= kpis.taxaConversaoAnterior ? 'positive' : 'negative'}
                icon={Percent}
                iconColor="purple"
              />
              <KPICard
                title="VGV em negociação"
                value={formatarMoedaCompacta(kpis.vgvNegociacao)}
                change={`${kpis.propostasAtivas} propostas ativas`}
                changeType="neutral"
                icon={TrendingUp}
                iconColor="orange"
              />
              <KPICard
                title="Vendas no mês"
                value={`${kpis.vendasMes} ${kpis.vendasMes === 1 ? 'unidade' : 'unidades'}`}
                change={kpis.ticketMedio > 0 ? `Ticket médio ${formatarMoedaCompacta(kpis.ticketMedio)}` : 'Sem vendas registradas'}
                changeType={kpis.vendasMes > 0 ? 'positive' : 'neutral'}
                icon={Home}
                iconColor="green"
              />
            </>
          )}
        </section>

        <section>
          <FunilArqoCard />
        </section>

        <section>
          <TopEmpreendimentosTable />
        </section>
      </div>
    </MainLayout>
  );
}
