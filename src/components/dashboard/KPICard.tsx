import { forwardRef } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: 'red' | 'orange' | 'green' | 'blue' | 'purple';
}

const iconStyles: Record<NonNullable<KPICardProps['iconColor']>, { bg: string; fg: string }> = {
  red:    { bg: 'bg-destructive/10', fg: 'text-destructive' },
  orange: { bg: 'bg-primary-soft',   fg: 'text-primary' },
  green:  { bg: 'bg-success/10',     fg: 'text-success' },
  blue:   { bg: 'bg-info/10',        fg: 'text-info' },
  purple: { bg: 'bg-chart-5/15',     fg: 'text-[hsl(258,83%,58%)]' },
};

export const KPICard = forwardRef<HTMLDivElement, KPICardProps>(({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'blue',
}, ref) => {
  const styles = iconStyles[iconColor];
  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-card transition-all duration-200 hover:bg-primary-soft/30 animate-fade-in"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground tabular-nums">{value}</p>

          {change && (
            <span className={cn(
              'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium',
              changeType === 'positive' && 'bg-success/10 text-success',
              changeType === 'negative' && 'bg-destructive/10 text-destructive',
              changeType === 'neutral' && 'bg-secondary text-muted-foreground'
            )}>
              {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
              {changeType === 'negative' && <TrendingDown className="h-3 w-3" />}
              <span>{change}</span>
            </span>
          )}
        </div>

        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', styles.bg)}>
          <Icon className={cn('h-5 w-5', styles.fg)} />
        </div>
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';
