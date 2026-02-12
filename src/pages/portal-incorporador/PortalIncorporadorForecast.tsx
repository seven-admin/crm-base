import { useState } from 'react';
import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FunilTemperatura } from '@/components/forecast/FunilTemperatura';
import { VisitasPorEmpreendimento } from '@/components/forecast/VisitasPorEmpreendimento';
import { AtividadesPorTipo } from '@/components/forecast/AtividadesPorTipo';
import { ProximasAtividades } from '@/components/forecast/ProximasAtividades';
import { AtendimentosResumo } from '@/components/forecast/AtendimentosResumo';
import { CalendarioCompacto } from '@/components/forecast/CalendarioCompacto';
import { CategoriaCard } from '@/components/forecast/CategoriaCard';
import { AtividadesListaPortal } from '@/components/portal-incorporador/AtividadesListaPortal';
import { useResumoAtividades } from '@/hooks/useForecast';
import { useResumoAtividadesPorCategoria } from '@/hooks/useResumoAtividadesPorCategoria';
import { ATIVIDADE_CATEGORIA_LABELS, type AtividadeCategoria } from '@/types/atividades.types';
import {
  BarChart3,
  ListTodo,
  Info,
  Briefcase,
  Building2,
  Users,
  UserCheck,
} from 'lucide-react';

export default function PortalIncorporadorForecast() {
  const [tab, setTab] = useState<'dashboard' | 'atividades'>('dashboard');
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const { empreendimentoIds, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();
  
  const empsFilter = empreendimentoIds.length > 0 ? empreendimentoIds : undefined;
  const { data: resumoAtividades, isLoading: loadingResumo } = useResumoAtividades(
    undefined, undefined, undefined, empsFilter
  );
  const { data: resumoCategorias, isLoading: loadingCategorias } = useResumoAtividadesPorCategoria(
    undefined, undefined, undefined, empsFilter
  );

  const CATEGORIA_CONFIG: Record<AtividadeCategoria, { icon: typeof Building2; iconColor: string; bgColor: string }> = {
    seven: { icon: Briefcase, iconColor: 'text-primary', bgColor: 'bg-primary/10' },
    incorporadora: { icon: Building2, iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    imobiliaria: { icon: Users, iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    cliente: { icon: UserCheck, iconColor: 'text-chart-4', bgColor: 'bg-chart-4/10' },
  };

  const isLoading = loadingEmps || loadingResumo || loadingCategorias;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (empreendimentoIds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum empreendimento vinculado à sua conta.
      </div>
    );
  }

  // Verificar se há dados de atividades
  const hasAtividadesData = (resumoAtividades?.total || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Alerta quando não há atividades */}
      {!hasAtividadesData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma atividade encontrada</AlertTitle>
          <AlertDescription>
            Não há atividades registradas para seus empreendimentos no momento. 
            As informações de forecast serão exibidas aqui quando atividades forem agendadas, 
            negociações forem iniciadas ou leads forem registrados.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'dashboard' | 'atividades')}>
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="atividades" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Atividades
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Cards por Categoria */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {(['seven', 'incorporadora', 'imobiliaria', 'cliente'] as AtividadeCategoria[]).map((cat) => {
              const cfg = CATEGORIA_CONFIG[cat];
              return (
                <CategoriaCard
                  key={cat}
                  nome={ATIVIDADE_CATEGORIA_LABELS[cat]}
                  icon={cfg.icon}
                  iconColor={cfg.iconColor}
                  bgColor={cfg.bgColor}
                  dados={resumoCategorias?.[cat]}
                />
              );
            })}
          </div>

          {/* Funil e Visitas */}
          <div className="grid gap-4 lg:grid-cols-2">
            <FunilTemperatura empreendimentoIds={empreendimentoIds} />
            <VisitasPorEmpreendimento empreendimentoIds={empreendimentoIds} />
          </div>

          {/* Atividades e Próximas */}
          <div className="grid gap-4 lg:grid-cols-2">
            <AtividadesPorTipo empreendimentoIds={empreendimentoIds} />
            <ProximasAtividades empreendimentoIds={empreendimentoIds} />
          </div>

          {/* Atendimentos - ocupa largura total */}
          <AtendimentosResumo empreendimentoIds={empreendimentoIds} />
        </TabsContent>

        {/* Atividades Tab */}
        <TabsContent value="atividades" className="space-y-6 mt-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <CalendarioCompacto 
                empreendimentoIds={empreendimentoIds} 
                onDayClick={setDataSelecionada}
                selectedDate={dataSelecionada}
              />
            </div>
            <div className="lg:col-span-2">
              <AtividadesListaPortal 
                empreendimentoIds={empreendimentoIds}
                dataSelecionada={dataSelecionada}
                onLimparData={() => setDataSelecionada(null)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
