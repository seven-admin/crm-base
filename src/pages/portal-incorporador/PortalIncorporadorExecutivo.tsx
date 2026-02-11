import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { useDashboardExecutivo } from '@/hooks/useDashboardExecutivo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendChart,
  DonutChart,
  FunnelMini,
} from '@/components/dashboard-executivo';
import {
  DollarSign,
  TrendingUp,
  Home,
  Building2,
  Package,
  FileText,
} from 'lucide-react';

export default function PortalIncorporadorExecutivo() {
  const { empreendimentoIds, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();
  const { data, isLoading: loadingDash } = useDashboardExecutivo(undefined, empreendimentoIds);

  const isLoading = loadingEmps || loadingDash;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum dado disponível para os empreendimentos vinculados.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.vendas.totalVendido)}</div>
            <p className="text-xs text-muted-foreground">
              {data.vendas.variacaoMensal > 0 ? '+' : ''}{data.vendas.variacaoMensal.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.vendas.vendasMesAtual)}</div>
            <p className="text-xs text-muted-foreground">{data.vendas.unidadesVendidas} unidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.vendas.ticketMedio)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negociações Ativas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.negociacoes.total}</div>
            <p className="text-xs text-muted-foreground">{data.negociacoes.novasHoje} novas hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Unidades */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Unidades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.unidades.total}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <Home className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data.unidades.disponiveis}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservadas</CardTitle>
            <Home className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{data.unidades.reservadas}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendidas</CardTitle>
            <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.unidades.vendidas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Tendência de Vendas"
          data={data.vendas.tendencia}
          dataKey="valor"
          xAxisKey="mes"
          height={220}
        />

        <FunnelMini
          title="Funil de Negociações"
          stages={data.negociacoes.porEtapa}
        />
      </div>

      {/* VGV */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DonutChart
          title="VGV por Status"
          data={[
            { name: 'Disponível', value: data.unidades.vgvDisponivel, color: 'hsl(142, 71%, 45%)' },
            { name: 'Vendido', value: data.unidades.vgvVendido, color: 'hsl(217, 91%, 60%)' },
          ]}
          height={220}
          showLegend
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Unidades por Empreendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {data.unidades.porEmpreendimento.map((emp) => (
                <div key={emp.nome} className="flex items-center justify-between">
                  <span className="text-sm truncate flex-1 mr-2">{emp.nome}</span>
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-600 dark:text-green-400 whitespace-nowrap">
                      {emp.disponiveis} disp.
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {emp.vendidas} vend.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
