import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { useDashboardExecutivo } from '@/hooks/useDashboardExecutivo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Home,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function PortalIncorporadorDashboard() {
  const { empreendimentoIds, empreendimentos, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();
  const { data: dashData, isLoading: loadingDash } = useDashboardExecutivo(undefined, empreendimentoIds);

  const isLoading = loadingEmps || loadingDash;

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
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empreendimentos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empreendimentos.length}</div>
            <p className="text-xs text-muted-foreground">vinculados à sua conta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades Disponíveis</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashData?.unidades.disponiveis || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {dashData?.unidades.total || 0} unidades totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VGV Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashData?.unidades.vgvVendido || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashData?.unidades.vendidas || 0} unidades vendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashData?.vendas.vendasMesAtual || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashData?.vendas.variacaoMensal > 0 ? '+' : ''}{dashData?.vendas.variacaoMensal.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
