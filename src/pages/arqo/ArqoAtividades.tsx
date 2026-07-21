import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { WhatsAppAtividadesTab } from '@/components/shared/WhatsAppAtividadesTab';

export default function ArqoAtividades() {
  return (
    <MainLayout title="Arqo — Atividades" subtitle="Histórico de conversas do WhatsApp dos leads">
      <Tabs defaultValue="whatsapp">
        <TabsList className="mb-4">
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <WhatsAppAtividadesTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
