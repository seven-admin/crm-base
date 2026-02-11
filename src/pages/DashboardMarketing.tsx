import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ClipboardList,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Timer,
  Tv,
  X,
  Settings,
  Building2,
  Users,
  Palette,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KPICardCompact } from '@/components/dashboard-executivo/KPICardCompact';
import { TrendChart } from '@/components/dashboard-executivo/TrendChart';
import { DonutChart } from '@/components/dashboard-executivo/DonutChart';
import { TicketsAtrasadosList } from '@/components/marketing/TicketsAtrasadosList';
import { ProximasEntregasList } from '@/components/marketing/ProximasEntregasList';
import { ProdutividadeEquipeTable } from '@/components/marketing/ProdutividadeEquipeTable';
import { DashboardMarketingSkeleton } from '@/components/marketing/DashboardMarketingSkeleton';
import { TVLayoutConfigDialog } from '@/components/tv-layout/TVLayoutConfigDialog';
import { useDashboardMarketing } from '@/hooks/useDashboardMarketing';
import { useTVLayoutConfig } from '@/hooks/useTVLayoutConfig';
import type { CategoriaTicket } from '@/types/marketing.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  PieChart,
  Pie,
} from 'recharts';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

type TipoFilter = 'all' | 'interno' | 'externo';

const CATEGORIA_OPTIONS: { value: CategoriaTicket | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'render_3d', label: 'Render 3D' },
  { value: 'design_grafico', label: 'Design Gráfico' },
  { value: 'video_animacao', label: 'Vídeo/Animação' },
  { value: 'evento', label: 'Evento' },
  { value: 'pedido_orcamento', label: 'Orçamento' },
];

export default function DashboardMarketing() {
  const [competencia, setCompetencia] = useState(new Date());
  const [categoria, setCategoria] = useState<CategoriaTicket | 'all'>('all');
  const [tipo, setTipo] = useState<TipoFilter>('all');
  const [modoTV, setModoTV] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { config, visibleItems, toggleVisibility, reorder, resetToDefault } = useTVLayoutConfig('forecast');

  const filters = useMemo(() => {
    const periodoInicio = startOfMonth(competencia);
    const periodoFim = endOfMonth(competencia);

    return {
      periodoInicio,
      periodoFim,
      categoria: categoria === 'all' ? undefined : categoria,
      tipo: tipo === 'all' ? undefined : tipo,
    };
  }, [competencia, categoria, tipo]);

  const { data, isLoading, isFetching, refetch } = useDashboardMarketing(filters);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL / 1000);

  // Fullscreen toggle
  const toggleModoTV = async () => {
    if (!modoTV) {
      await document.documentElement.requestFullscreen?.();
      setModoTV(true);
    } else {
      await document.exitFullscreen?.();
      setModoTV(false);
    }
  };

  // Listen for ESC/fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setModoTV(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-refresh every 30 seconds (always active, not just TV mode)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastUpdate(new Date());
      setCountdown(AUTO_REFRESH_INTERVAL / 1000);
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [refetch]);

  // Countdown timer for visual feedback
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? AUTO_REFRESH_INTERVAL / 1000 : prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Manual refresh handler
  const handleManualRefresh = () => {
    refetch();
    setLastUpdate(new Date());
    setCountdown(AUTO_REFRESH_INTERVAL / 1000);
  };

  // Loading state with detailed skeletons
  if (isLoading) {
    return (
      <MainLayout>
        <PageHeader title="Dashboard Marketing" subtitle="Carregando dados..." />
        <DashboardMarketingSkeleton />
      </MainLayout>
    );
  }

  // Prepare chart data
  const etapasChartData = data?.porEtapa.map(e => ({
    name: e.nome,
    value: e.count,
    fill: e.color,
  })) || [];

  const categoriaChartData = data?.porCategoria.map(c => ({
    name: c.label,
    interno: c.interno,
    externo: c.externo,
    total: c.count,
  })) || [];

  const entregasChartData = data?.entregasPorSemana || [];

  const pieData = data?.internoVsExterno || [];

  // TV Mode Render
  if (modoTV) {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Palette className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Dashboard Marketing</h1>
            <span className="text-sm font-medium text-primary uppercase">
              {format(competencia, "MMM/yyyy", { locale: ptBR })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Atualizado: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
              </span>
              {isFetching && (
                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
              )}
              <Badge variant="outline" className="text-xs font-mono">
                {countdown}s
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleManualRefresh} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfigOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setModoTV(false)}>
              <X className="h-4 w-4 mr-1" />
              ESC
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICardCompact
              title="Tickets Ativos"
              value={data?.ticketsAtivos || 0}
              icon={ClipboardList}
            />
            <KPICardCompact
              title="Em Produção"
              value={data?.emProducao || 0}
              icon={Wrench}
            />
            <KPICardCompact
              title="Aguardando Aprovação"
              value={data?.aguardandoAprovacao || 0}
              icon={Clock}
            />
            <KPICardCompact
              title="Concluídos"
              value={data?.concluidosPeriodo || 0}
              subtitle="no período"
              icon={CheckCircle}
            />
            <KPICardCompact
              title="Atrasados"
              value={data?.atrasados || 0}
              icon={AlertTriangle}
              variacao={data?.atrasados ? -1 : 0}
            />
            <KPICardCompact
              title="Tempo Médio"
              value={data && data.tempoMedioDias != null ? `${data.tempoMedioDias}d` : '-'}
              icon={Timer}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Etapas Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tickets por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={etapasChartData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {etapasChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Interno vs Externo */}
            <DonutChart
              title="Interno vs Externo"
              data={pieData}
              height={280}
              showLegend
            />

            {/* Tickets Atrasados */}
            <TicketsAtrasadosList tickets={data?.ticketsAtrasados || []} maxHeight="280px" />

            {/* Próximas Entregas */}
            <ProximasEntregasList tickets={data?.proximasEntregas || []} maxHeight="280px" />
          </div>

          {/* Produtividade e Tendência */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProdutividadeEquipeTable data={data?.produtividadeEquipe || []} maxHeight="280px" />

            <TrendChart
              title="Entregas por Semana"
              data={entregasChartData}
              dataKey={['interno', 'externo']}
              xAxisKey="semana"
              type="bar"
              colors={['hsl(280, 67%, 60%)', 'hsl(217, 91%, 60%)']}
              height={280}
              stacked
            />
          </div>

          {/* Categoria Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tickets por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoriaChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="externo" name="Externos" fill="hsl(217, 91%, 60%)" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="interno" name="Internos" fill="hsl(280, 67%, 60%)" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Config Dialog */}
        <TVLayoutConfigDialog
          open={configOpen}
          onOpenChange={setConfigOpen}
          config={config}
          onToggleVisibility={toggleVisibility}
          onReorder={reorder}
          onReset={resetToDefault}
        />
      </div>
    );
  }

  // Normal Mode Render
  return (
    <MainLayout>
      <PageHeader
        title="Dashboard Marketing"
        subtitle="Visão consolidada de tickets, prazos e produtividade"
        metadata={
          <div className="flex items-center gap-2">
            <span className="text-xs">
              Atualizado: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
            </span>
            {isFetching && (
              <RefreshCw className="h-3 w-3 animate-spin text-primary" />
            )}
            <Badge variant="outline" className="text-xs font-mono h-5">
              {countdown}s
            </Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleManualRefresh} 
              disabled={isFetching}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>

            {/* Seletor de mês */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setCompetencia(subMonths(competencia, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center font-medium text-sm capitalize">
                {format(competencia, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setCompetencia(addMonths(competencia, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Atalhos rápidos */}
            <div className="flex gap-1">
              <Button 
                variant={format(competencia, 'yyyy-MM') === format(new Date(), 'yyyy-MM') ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCompetencia(new Date())}
              >
                Este mês
              </Button>
              <Button 
                variant={format(competencia, 'yyyy-MM') === format(subMonths(new Date(), 1), 'yyyy-MM') ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCompetencia(subMonths(new Date(), 1))}
              >
                Mês anterior
              </Button>
            </div>

            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaTicket | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIA_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="interno">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    Internos
                  </div>
                </SelectItem>
                <SelectItem value="externo">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Externos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={toggleModoTV}>
              <Tv className="h-4 w-4 mr-2" />
              Modo TV
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KPICardCompact
          title="Tickets Ativos"
          value={data?.ticketsAtivos || 0}
          icon={ClipboardList}
        />
        <KPICardCompact
          title="Em Produção"
          value={data?.emProducao || 0}
          icon={Wrench}
        />
        <KPICardCompact
          title="Aguardando Aprovação"
          value={data?.aguardandoAprovacao || 0}
          icon={Clock}
        />
        <KPICardCompact
          title="Concluídos"
          value={data?.concluidosPeriodo || 0}
          subtitle="no período"
          icon={CheckCircle}
        />
        <KPICardCompact
          title="Atrasados"
          value={data?.atrasados || 0}
          icon={AlertTriangle}
          variacao={data?.atrasados ? -1 : 0}
        />
        <KPICardCompact
          title="Tempo Médio"
          value={data && data.tempoMedioDias != null ? `${data.tempoMedioDias}d` : '-'}
          icon={Timer}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Etapas Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tickets por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={etapasChartData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {etapasChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Interno vs Externo */}
        <DonutChart
          title="Interno vs Externo"
          data={pieData}
          height={280}
          showLegend
        />
      </div>

      {/* Tickets Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TicketsAtrasadosList tickets={data?.ticketsAtrasados || []} maxHeight="320px" />
        <ProximasEntregasList tickets={data?.proximasEntregas || []} maxHeight="320px" />
      </div>

      {/* Produtividade e Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProdutividadeEquipeTable data={data?.produtividadeEquipe || []} maxHeight="320px" />

        <TrendChart
          title="Entregas por Semana"
          data={entregasChartData}
          dataKey={['interno', 'externo']}
          xAxisKey="semana"
          type="bar"
          colors={['hsl(280, 67%, 60%)', 'hsl(217, 91%, 60%)']}
          height={320}
          stacked
        />
      </div>

      {/* Categoria Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tickets por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoriaChartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="externo" name="Externos" fill="hsl(217, 91%, 60%)" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="interno" name="Internos" fill="hsl(280, 67%, 60%)" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
