import { ReactNode } from 'react';
import { AppTopbar } from './AppTopbar';
import { PageHeader } from './PageHeader';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  backTo?: string;
  backLabel?: string;
  metadata?: ReactNode;
  fluid?: boolean;
  contentClassName?: string;
}

export function MainLayout({
  children,
  title,
  subtitle,
  actions,
  badge,
  backTo,
  backLabel,
  metadata,
  fluid = false,
  contentClassName,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppTopbar />

      {title && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          badge={badge}
          backTo={backTo}
          backLabel={backLabel}
          metadata={metadata}
        />
      )}

      <main
        className={cn(
          'w-full px-4 py-5 md:px-6 md:py-7 lg:px-8',
          !fluid && 'mx-auto max-w-[1600px]',
          contentClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
