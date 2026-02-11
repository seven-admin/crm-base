import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/ui/sparkline';

interface KPICardCompactProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variacao?: number;
  icon?: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
  sparklineData?: number[];
  sparklineColor?: string;
}

export function KPICardCompact({ 
  title, 
  value, 
  subtitle, 
  variacao, 
  icon: Icon,
  iconColor = 'text-primary',
  onClick,
  sparklineData,
  sparklineColor
}: KPICardCompactProps) {
  const getVariacaoIcon = () => {
    if (variacao === undefined || variacao === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (variacao > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    return <TrendingDown className="h-3 w-3 text-destructive" />;
  };

  const getVariacaoColor = () => {
    if (variacao === undefined || variacao === 0) return 'text-muted-foreground';
    if (variacao > 0) return 'text-emerald-500';
    return 'text-destructive';
  };

  // Determinar cor do sparkline baseado na variação
  const getSparklineColor = () => {
    if (sparklineColor) return sparklineColor;
    if (variacao !== undefined && variacao > 0) return 'hsl(var(--chart-2))';
    if (variacao !== undefined && variacao < 0) return 'hsl(var(--destructive))';
    return 'hsl(var(--primary))';
  };

  return (
    <Card 
      className={cn(
        "p-4 transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-bold truncate">{value}</p>
          {(subtitle || variacao !== undefined) && (
            <div className="flex items-center gap-1.5">
              {variacao !== undefined && (
                <>
                  {getVariacaoIcon()}
                  <span className={cn("text-xs font-medium", getVariacaoColor())}>
                    {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                  </span>
                </>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
              )}
            </div>
          )}
          {sparklineData && sparklineData.length > 1 && (
            <Sparkline 
              data={sparklineData} 
              color={getSparklineColor()}
              height={28}
              className="mt-2"
            />
          )}
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-lg bg-primary/10 shrink-0", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  );
}
