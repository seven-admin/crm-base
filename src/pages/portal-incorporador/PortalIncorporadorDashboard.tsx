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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const kpis = [
    {
      icon: Building2,
      label: 'Empreendimentos',
      value: isLoading ? null : empreendimentos.length,
      sub: 'vinculados',
    },
    {
      icon: Home,
      label: 'Disponíveis',
      value: isLoading ? null : `${dashData?.unidades.disponiveis || 0}/${dashData?.unidades.total || 0}`,
      sub: 'unidades',
    },
    {
      icon: DollarSign,
      label: 'VGV Vendido',
      value: isLoading ? null : formatCurrency(dashData?.unidades.vgvVendido || 0),
      sub: `${dashData?.unidades.vendidas || 0} vendidas`,
    },
    {
      icon: TrendingUp,
      label: 'Vendas do Mês',
      value: isLoading ? null : formatCurrency(dashData?.vendas.vendasMesAtual || 0),
      sub: dashData?.vendas.variacaoMensal !== undefined
        ? `${dashData.vendas.variacaoMensal > 0 ? '+' : ''}${dashData.vendas.variacaoMensal.toFixed(1)}% vs anterior`
        : '',
    },
  ];

  return (
    <div className="rounded-xl bg-muted/30 border p-4 mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background">
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
              {kpi.value === null ? (
                <Skeleton className="h-5 w-16 mt-0.5" />
              ) : (
                <p className="text-sm font-bold truncate">{kpi.value}</p>
              )}
              <p className="text-[10px] text-muted-foreground truncate">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
