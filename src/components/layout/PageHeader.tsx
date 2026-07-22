import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <header className="bg-background">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-2 pt-7 md:px-6 md:pt-9 lg:px-8">
        {backTo && (
          <div className="mb-5">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 gap-1 rounded-full text-muted-foreground hover:text-foreground font-medium"
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel || 'Voltar'}</span>
          </Button>
          </div>
        )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">SVN CRM · Workspace</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-semibold leading-[.95] tracking-[-0.045em] text-foreground md:text-[2.35rem]">{title}</h1>
            {badge}
          </div>
          {(subtitle || metadata) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {subtitle && <span>{subtitle}</span>}
              {subtitle && metadata && <span>·</span>}
              {metadata}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 sm:justify-end sm:pb-1">
            {actions}
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
