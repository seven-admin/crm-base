import { MainLayout } from '@/components/layout/MainLayout';
import { PlanejamentoFasesEditor } from '@/components/planejamento/PlanejamentoFasesEditor';
import { PlanejamentoStatusEditor } from '@/components/planejamento/PlanejamentoStatusEditor';
import { ConfiguracaoSobrecargaCard } from '@/components/planejamento/ConfiguracaoSobrecargaCard';

export default function PlanejamentoConfiguracoes() {
  return (
    <MainLayout
      title="Configurações do Planejamento"
      subtitle="Gerencie as fases, status e parâmetros do planejamento"
    >
      <div className="space-y-6">
        <ConfiguracaoSobrecargaCard />
        <div className="grid gap-6 lg:grid-cols-2">
          <PlanejamentoFasesEditor />
          <PlanejamentoStatusEditor />
        </div>
      </div>
    </MainLayout>
  );
}
