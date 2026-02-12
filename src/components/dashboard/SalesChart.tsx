import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { useVendasPorMes } from '@/hooks/useRelatorios';
import { Skeleton } from '@/components/ui/skeleton';
import { CORES_DASHBOARD, TOOLTIP_STYLE, TOOLTIP_CURSOR_STYLE } from '@/lib/chartColors';

export function SalesChart() {
  const { data: vendasPorMes, isLoading } = useVendasPorMes();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);

  const formatLabel = (value: number) => {
    if (value === 0) return '';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  if (isLoading) {
    return (
      <div className="card-elevated p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Vendas por Mês
        </h3>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const hasData = vendasPorMes && vendasPorMes.some(m => m.vendas > 0);

  return (
    <div className="card-elevated p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Vendas por Mês
      </h3>
      <div className="h-72">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Nenhuma venda registrada nos últimos 6 meses
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendasPorMes} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="mes"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                contentStyle={TOOLTIP_STYLE}
                cursor={TOOLTIP_CURSOR_STYLE}
              />
              <Bar
                dataKey="vendas"
                fill={CORES_DASHBOARD.laranja}
                radius={[4, 4, 0, 0]}
                barSize={24}
              >
                <LabelList
                  dataKey="vendas"
                  position="top"
                  formatter={formatLabel}
                  fill="hsl(var(--muted-foreground))"
                  fontSize={11}
                  fontWeight={500}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
