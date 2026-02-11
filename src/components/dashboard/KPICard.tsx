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

const iconColorClasses = {
  red: 'icon-container-red',
  orange: 'icon-container-orange',
  green: 'icon-container-green',
  blue: 'icon-container-blue',
  purple: 'icon-container-purple',
};

export const KPICard = forwardRef<HTMLDivElement, KPICardProps>(({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'blue',
}, ref) => {
  return (
    <div 
      ref={ref} 
      className="bg-card border border-border rounded-xl p-5 hover-lift animate-fade-in"
    >
      <div className="flex items-start gap-4">
        {/* Icon container with colored background */}
        <div className={cn('icon-container', iconColorClasses[iconColor])}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">{value}</p>
          
          {change && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-destructive',
              changeType === 'neutral' && 'text-muted-foreground'
            )}>
              {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
              {changeType === 'negative' && <TrendingDown className="h-3 w-3" />}
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';
