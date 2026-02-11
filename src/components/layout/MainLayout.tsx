import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { PageHeader } from './PageHeader';
import { AceitarTermosDialog } from '@/components/auth/AceitarTermosDialog';
import { NotificacaoBell } from './NotificacaoBell';
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
  
  const handleTermosAceitos = () => {
    refetch();
  };
  
  return (
    <div className="min-h-screen gradient-subtle">
      <Sidebar />
      {/* Mobile spacer for fixed header */}
      <div className="lg:hidden h-14" />
      {/* Main content with responsive left padding */}
      <div className="lg:pl-64 transition-[padding-left] duration-300">
        {title && (
          <PageHeader 
            title={title} 
            subtitle={subtitle} 
            actions={
              <div className="flex items-center gap-2">
                {actions}
                {isAuthenticated && <NotificacaoBell />}
              </div>
            }
            badge={badge}
            backTo={backTo}
            backLabel={backLabel}
            metadata={metadata}
          />
        )}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
      
      {/* Dialog de aceite de termos */}
      <AceitarTermosDialog 
        open={!!precisaAceitarTermos} 
        onAccepted={handleTermosAceitos}
      />
    </div>
  );
}
