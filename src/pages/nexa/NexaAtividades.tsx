import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { RegistroAtividadesTab } from '@/components/nexa/RegistroAtividadesTab';
import { WhatsAppAtividadesTab } from '@/components/shared/WhatsAppAtividadesTab';

export default function NexaAtividades() {
  return (
    <MainLayout title="Atividades Nexa" subtitle="Registro de atividades de mercado, atendimentos e conversas do WhatsApp">
      <Tabs defaultValue="registro">
        <TabsList className="mb-5">
          <TabsTrigger value="registro">Atividades</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

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
