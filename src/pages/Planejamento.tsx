import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Calendar, Clock, List } from 'lucide-react';
import { PlanejamentoGlobalResumo } from '@/components/planejamento/PlanejamentoGlobalResumo';
import { PlanejamentoGlobalTimeline } from '@/components/planejamento/PlanejamentoGlobalTimeline';
import { PlanejamentoGlobalEquipe } from '@/components/planejamento/PlanejamentoGlobalEquipe';
import { PlanejamentoCalendario } from '@/components/planejamento/PlanejamentoCalendario';
import { PlanejamentoListaGlobal } from '@/components/planejamento/PlanejamentoListaGlobal';
import type { PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { useConfiguracao } from '@/hooks/useConfiguracoesSistema';

export default function Planejamento() {
  const [activeTab, setActiveTab] = useState('calendario');
  const [filters, setFilters] = useState<PlanejamentoGlobalFilters>({});

  const { data: configSobrecarga } = useConfiguracao('planejamento_limite_sobrecarga');
  const limiteSobrecarga = configSobrecarga?.valor ? parseInt(configSobrecarga.valor) : 5;

  return (
    <MainLayout
      title="Planejamento"
      subtitle="Gerencie o cronograma de tarefas de todos os empreendimentos"
    >
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="calendario" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="lista" className="gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="resumo" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2">
              <Users className="h-4 w-4" />
              Equipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendario" className="mt-4">
            <PlanejamentoCalendario filters={filters} onFiltersChange={setFilters} />
          </TabsContent>

          <TabsContent value="lista" className="mt-4">
            <PlanejamentoListaGlobal filters={filters} onFiltersChange={setFilters} />
          </TabsContent>

          <TabsContent value="resumo" className="mt-4">
            <PlanejamentoGlobalResumo 
              filters={filters} 
              onFiltersChange={setFilters} 
              limiteSobrecarga={limiteSobrecarga}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <PlanejamentoGlobalTimeline filters={filters} onFiltersChange={setFilters} />
          </TabsContent>

          <TabsContent value="equipe" className="mt-4">
            <PlanejamentoGlobalEquipe 
              filters={filters} 
              onFiltersChange={setFilters}
              limiteSobrecarga={limiteSobrecarga}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
