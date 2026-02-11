import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  backTo?: string;
  backLabel?: string;
  metadata?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, badge, backTo, backLabel, metadata }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-card to-muted/30 border-b border-border px-4 md:px-6 py-4">
      {/* Back Navigation */}
      {backTo && (
        <div className="mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel || 'Voltar'}</span>
          </Button>
        </div>
      )}

      {/* Title Row with Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            {badge}
          </div>
          {(subtitle || metadata) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5 flex-wrap">
              {subtitle && <span>{subtitle}</span>}
              {subtitle && metadata && <span>·</span>}
              {metadata}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
