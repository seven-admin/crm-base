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
import { AtividadesListaPortal } from '@/components/portal-incorporador/AtividadesListaPortal';
import { useResumoAtividades } from '@/hooks/useForecast';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  ListTodo,
  Info,
} from 'lucide-react';

export default function PortalIncorporadorForecast() {
  const [tab, setTab] = useState<'dashboard' | 'atividades'>('dashboard');
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const { empreendimentoIds, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();
  
  // Passar empreendimentoIds para filtrar os dados do incorporador
  const { data: resumoAtividades, isLoading: loadingResumo } = useResumoAtividades(
    undefined, // gestorId
    undefined, // dataInicio
    undefined, // dataFim
    empreendimentoIds.length > 0 ? empreendimentoIds : undefined
  );

  const isLoading = loadingEmps || loadingResumo;

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
          {/* KPIs de Atividades */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{resumoAtividades?.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Total de Atividades</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-chart-2/10">
                    <CheckCircle2 className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{resumoAtividades?.concluidas || 0}</p>
                    <p className="text-sm text-muted-foreground">Concluídas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-chart-3/10">
                    <Clock className="h-5 w-5 text-chart-3" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{resumoAtividades?.pendentes || 0}</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{resumoAtividades?.vencidas || 0}</p>
                    <p className="text-sm text-muted-foreground">Vencidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
