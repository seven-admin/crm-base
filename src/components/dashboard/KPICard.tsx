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
      className="bg-card rounded-2xl border border-border/60 shadow-card p-6 transition-shadow duration-200 hover:shadow-popover animate-fade-in"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground mt-2 tracking-tight tabular-nums">{value}</p>

          {change && (
            <span className={cn(
              'inline-flex items-center gap-1 mt-3 text-xs font-medium px-2 py-0.5 rounded-full',
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

        <div className={cn('flex items-center justify-center shrink-0 h-12 w-12 rounded-full', styles.bg)}>
          <Icon className={cn('h-5 w-5', styles.fg)} />
        </div>
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';
