import { MainLayout } from '@/components/layout/MainLayout';
import { TicketEtapasEditor } from '@/components/marketing/TicketEtapasEditor';

const EtapasTickets = () => {
  return (
    <MainLayout
      title="Etapas de Tickets"
      subtitle="Gerencie as etapas do fluxo de tickets de marketing"
    >
      <TicketEtapasEditor />
    </MainLayout>
  );
};

export default EtapasTickets;
