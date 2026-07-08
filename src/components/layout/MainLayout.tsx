import { ReactNode } from 'react';
import { AppTopbar } from './AppTopbar';
import { PageHeader } from './PageHeader';
import { AceitarTermosDialog } from '@/components/auth/AceitarTermosDialog';
import { useVerificarAceite } from '@/hooks/useTermosAceite';
import { useAuth } from '@/contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  backTo?: string;
  backLabel?: string;
  metadata?: ReactNode;
}

export function MainLayout({ children, title, subtitle, actions, badge, backTo, backLabel, metadata }: MainLayoutProps) {
  const { isAuthenticated } = useAuth();
  const { data: verificacao, refetch } = useVerificarAceite();

  const precisaAceitarTermos = isAuthenticated && verificacao?.precisaAceitar;

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

      <main className="p-4 md:p-6">
        {children}
      </main>

      <AceitarTermosDialog
        open={!!precisaAceitarTermos}
        onAccepted={() => refetch()}
      />
    </div>
  );
}
