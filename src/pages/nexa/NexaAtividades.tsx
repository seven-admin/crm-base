import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgendaVisitasTab } from '@/components/nexa/AgendaVisitasTab';
import { RegistroAtividadesTab } from '@/components/nexa/RegistroAtividadesTab';
import { WhatsAppAtividadesTab } from '@/components/shared/WhatsAppAtividadesTab';

export default function NexaAtividades() {
  return (
    <MainLayout title="Atividades Nexa" subtitle="Agenda de visitas, registro de atividades e conversas do WhatsApp">
      <Tabs defaultValue="agenda">
        <TabsList className="mb-5">
          <TabsTrigger value="agenda">Agenda de Visitas</TabsTrigger>
          <TabsTrigger value="registro">Registro</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda">
          <AgendaVisitasTab />
        </TabsContent>

        <TabsContent value="registro">
          <RegistroAtividadesTab />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppAtividadesTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
