import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgendaVisitasTab } from '@/components/nexa/AgendaVisitasTab';
import { WhatsAppAtividadesTab } from '@/components/nexa/WhatsAppAtividadesTab';

export default function NexaAtividades() {
  return (
    <MainLayout title="Atividades" subtitle="Agenda de visitas e histórico de conversas do WhatsApp">
      <Tabs defaultValue="agenda">
        <TabsList className="mb-4">
          <TabsTrigger value="agenda">Agenda de Visitas</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda">
          <AgendaVisitasTab />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppAtividadesTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
