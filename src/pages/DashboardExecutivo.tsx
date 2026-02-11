import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDashboardExecutivo } from '@/hooks/useDashboardExecutivo';
import { KPICardCompact, TrendChart, DonutChart, AlertsList, FunnelMini, ModuleStatusCard } from '@/components/dashboard-executivo';
import { CorretoresRanking } from '@/components/dashboard/CorretoresRanking';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useTVLayoutConfig } from '@/hooks/useTVLayoutConfig';
import { TVLayoutConfigDialog } from '@/components/tv-layout';
import { DollarSign, TrendingUp, Home, Users, FileText, Wallet, Target, Megaphone, Monitor, X, Settings, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CORES_DASHBOARD } from '@/lib/chartColors';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

export default function DashboardExecutivo() {
  const [empreendimentoId, setEmpreendimentoId] = useState<string>();
  const [modoTV, setModoTV] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());
  const { data, isLoading, refetch } = useDashboardExecutivo(empreendimentoId);
  const { data: empreendimentos } = useEmpreendimentos();
  const { config, visibleItems, toggleVisibility, reorder, resetToDefault } = useTVLayoutConfig('executivo');

  // Toggle fullscreen
  const toggleModoTV = async () => {
    if (!modoTV) {
      try {
        await document.documentElement.requestFullscreen?.();
        setModoTV(true);
        setUltimaAtualizacao(new Date());
      } catch (e) {
        console.error('Fullscreen não suportado:', e);
      }
    } else {
      try {
        await document.exitFullscreen?.();
      } catch (e) {}
      setModoTV(false);
    }
  };

  // Listener ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setModoTV(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-refresh a cada 60s no modo TV
  useEffect(() => {
    if (!modoTV) return;
    const interval = setInterval(() => {
      refetch();
      setUltimaAtualizacao(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [modoTV, refetch]);

  if (isLoading) {
    return (
      <MainLayout title="Dashboard" subtitle="Visão consolidada de todos os módulos">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </MainLayout>
    );
  }

  const unidadesData = [
    { name: 'Disponíveis', value: data?.unidades.disponiveis || 0, color: CORES_DASHBOARD.azul },
    { name: 'Reservadas', value: data?.unidades.reservadas || 0, color: CORES_DASHBOARD.amarelo },
    { name: 'Vendidas', value: data?.unidades.vendidas || 0, color: CORES_DASHBOARD.verde },
    { name: 'Bloqueadas', value: data?.unidades.bloqueadas || 0, color: CORES_DASHBOARD.cinza },
  ].filter(d => d.value > 0);

  const kpis = [
    { title: 'Total Vendido', value: formatCurrency(data?.vendas.totalVendido || 0), icon: DollarSign, variacao: data?.vendas.variacaoMensal },
    { title: 'Vendas do Mês', value: formatCurrency(data?.vendas.vendasMesAtual || 0), subtitle: `${data?.vendas.unidadesVendidas || 0} unidades`, icon: TrendingUp },
    { title: 'Unidades Disponíveis', value: data?.unidades.disponiveis || 0, subtitle: formatCurrency(data?.unidades.vgvDisponivel || 0), icon: Home },
    { title: 'Taxa de Conversão', value: `${(data?.negociacoes.taxaConversao || 0).toFixed(1)}%`, subtitle: `${data?.negociacoes.total || 0} ativas`, icon: Target },
    { title: 'Tempo Médio Fechamento', value: `${data?.negociacoes.tempoMedioFechamento || 0}d`, subtitle: 'dias até fechar', icon: Clock },
    { title: 'Comissões Pendentes', value: formatCurrency(data?.comissoes.totalPendente || 0), subtitle: `Pago: ${formatCurrency(data?.comissoes.totalPago || 0)}`, icon: Users },
    { title: 'Tickets Marketing', value: data?.marketing.ticketsEmAndamento || 0, subtitle: `${data?.marketing.briefingsPendentes || 0} briefings`, icon: Megaphone },
    { title: 'Clientes Ativos', value: data?.crm.clientesAtivos || 0, subtitle: `${data?.crm.leadsQuentes || 0} quentes`, icon: FileText },
  ];

  // Renderizar widget do modo TV baseado no ID
  const renderTVWidget = (itemId: string) => {
    switch (itemId) {
      case 'kpis':
        return (
          <div key={itemId} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-2xl lg:text-3xl font-bold text-foreground truncate">{kpi.value}</p>
                        <p className="text-xs text-muted-foreground truncate">{kpi.title}</p>
                        {kpi.subtitle && (
                          <p className="text-xs text-muted-foreground/70 truncate">{kpi.subtitle}</p>
                        )}
                      </div>
                      {kpi.variacao !== undefined && (
                        <div className={`text-sm font-medium ${kpi.variacao >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {kpi.variacao >= 0 ? '+' : ''}{kpi.variacao.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      case 'vendas-trend':
        return (
          <Card key={itemId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Evolução de Vendas (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                title=""
                data={data?.vendas.tendencia || []}
                dataKey="valor"
                type="area"
                formatValue={(v) => formatCurrency(v)}
              />
            </CardContent>
          </Card>
        );
      case 'pipeline':
        return (
          <Card key={itemId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Pipeline Comercial</CardTitle>
            </CardHeader>
            <CardContent>
              <FunnelMini
                title=""
                stages={data?.negociacoes.porEtapa || []}
                formatValue={(v) => formatCurrency(v)}
              />
            </CardContent>
          </Card>
        );
      case 'unidades-donut':
        return (
          <Card key={itemId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Distribuição de Unidades</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                title=""
                data={unidadesData}
                height={220}
              />
            </CardContent>
          </Card>
        );
      case 'ranking-corretores':
        return (
          <Card key={itemId} className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Ranking de Corretores</CardTitle>
            </CardHeader>
            <CardContent>
              <CorretoresRanking />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  // Modo TV Layout
  if (modoTV) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-auto">
        {/* Header TV */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">DASHBOARD EXECUTIVO</h1>
            <span className="text-muted-foreground text-sm">
              Última atualização: {format(ultimaAtualizacao, "HH:mm:ss", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfigDialogOpen(true)} className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleModoTV} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5 mr-2" />
              Sair (ESC)
            </Button>
          </div>
        </div>

        {/* Conteúdo TV - Renderização dinâmica baseada em config */}
        <div className="p-6 space-y-6">
          {visibleItems.map(item => {
            // KPIs ocupam linha inteira
            if (item.id === 'kpis') {
              return renderTVWidget(item.id);
            }
            return null;
          })}

          {/* Gráficos principais em grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleItems
              .filter(item => ['vendas-trend', 'pipeline'].includes(item.id))
              .map(item => renderTVWidget(item.id))}
          </div>

          {/* Painéis inferiores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {visibleItems
              .filter(item => ['unidades-donut', 'ranking-corretores'].includes(item.id))
              .map(item => renderTVWidget(item.id))}
          </div>
        </div>

        {/* Dialog de configuração */}
        <TVLayoutConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          config={config}
          onToggleVisibility={toggleVisibility}
          onReorder={reorder}
          onReset={resetToDefault}
        />
      </div>
    );
  }

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Visão consolidada de todos os módulos"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleModoTV}>
            <Monitor className="h-4 w-4 mr-2" />
            Modo TV
          </Button>
          <Select value={empreendimentoId || 'all'} onValueChange={(v) => setEmpreendimentoId(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos empreendimentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos empreendimentos</SelectItem>
              {empreendimentos?.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICardCompact
          title="Total Vendido"
          value={formatCurrency(data?.vendas.totalVendido || 0)}
          variacao={data?.vendas.variacaoMensal}
          icon={DollarSign}
        />
        <KPICardCompact
          title="Vendas do Mês"
          value={formatCurrency(data?.vendas.vendasMesAtual || 0)}
          subtitle={`${data?.vendas.unidadesVendidas || 0} unidades`}
          icon={TrendingUp}
        />
        <KPICardCompact
          title="Unidades Disponíveis"
          value={data?.unidades.disponiveis || 0}
          subtitle={formatCurrency(data?.unidades.vgvDisponivel || 0)}
          icon={Home}
        />
        <KPICardCompact
          title="Taxa de Conversão"
          value={`${(data?.negociacoes.taxaConversao || 0).toFixed(1)}%`}
          subtitle={`${data?.negociacoes.total || 0} ativas`}
          icon={Target}
        />
        <KPICardCompact
          title="Receita do Mês"
          value={formatCurrency(data?.financeiro.receitasMes || 0)}
          subtitle={`Saldo: ${formatCurrency(data?.financeiro.saldoMes || 0)}`}
          icon={Wallet}
        />
        <KPICardCompact
          title="Comissões Pendentes"
          value={formatCurrency(data?.comissoes.totalPendente || 0)}
          subtitle={`Pago: ${formatCurrency(data?.comissoes.totalPago || 0)}`}
          icon={Users}
        />
        <KPICardCompact
          title="Tickets Marketing"
          value={data?.marketing.ticketsEmAndamento || 0}
          subtitle={`${data?.marketing.briefingsPendentes || 0} briefings`}
          icon={Megaphone}
        />
        <KPICardCompact
          title="Clientes Ativos"
          value={data?.crm.clientesAtivos || 0}
          subtitle={`${data?.crm.leadsQuentes || 0} quentes`}
          icon={FileText}
        />
      </div>

      {/* Gráficos de Tendência + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <TrendChart
            title="Evolução de Vendas (6 meses)"
            data={data?.vendas.tendencia || []}
            dataKey="valor"
            type="area"
            formatValue={(v) => formatCurrency(v)}
          />
        </div>
        <CorretoresRanking />
      </div>

      {/* Receitas vs Despesas + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TrendChart
          title="Receitas vs Despesas"
          data={data?.financeiro.tendencia || []}
          dataKey={['receitas', 'despesas']}
          type="bar"
          colors={[CORES_DASHBOARD.verde, CORES_DASHBOARD.rosa]}
          formatValue={(v) => formatCurrency(v)}
          showLabels
        />
        <FunnelMini
          title="Pipeline Comercial"
          stages={data?.negociacoes.porEtapa || []}
          formatValue={(v) => formatCurrency(v)}
        />
      </div>

      {/* Painéis de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <DonutChart
          title="Distribuição de Unidades"
          data={unidadesData}
          height={220}
        />
        <ModuleStatusCard
          title="CRM"
          icon={Users}
          link="/clientes"
          highlight={{
            value: data?.crm.clientesAtivos || 0,
            label: 'Clientes ativos'
          }}
          items={[
            { label: 'Quentes', value: data?.crm.leadsQuentes || 0, color: 'danger' },
            { label: 'Mornos', value: data?.crm.leadsMornos || 0, color: 'warning' },
            { label: 'Frios', value: data?.crm.leadsFrios || 0, color: 'default' },
            { label: 'Follow-ups', value: data?.crm.followupsPendentes || 0, color: 'warning' },
          ]}
        />
      </div>

      {/* Alertas */}
      <AlertsList alertas={data?.alertas || []} />
    </MainLayout>
  );
}
