// TODO: substituir por dados reais
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { mockKPIs } from './mockData';
import { FunilArqoCard } from './components/FunilArqoCard';
import { TopEmpreendimentosTable } from './components/TopEmpreendimentosTable';

export function DashboardHome() {
  const periodoMock = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <MainLayout>
      <PageHeader
        title="Visão Geral"
        subtitle={`Resumo executivo · ${periodoMock}`}
      />

      <div className="p-4 md:p-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockKPIs.map((kpi) => (
            <KPICard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              changeType={kpi.changeType}
              icon={kpi.icon}
              iconColor={kpi.iconColor}
            />
          ))}
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
