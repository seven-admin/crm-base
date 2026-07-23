import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgendaAtendimentosTab } from '@/components/arqo/AgendaAtendimentosTab';
import { WhatsAppAtividadesTab } from '@/components/shared/WhatsAppAtividadesTab';
import { HistoricoContatosTab } from '@/components/arqo/HistoricoContatosTab';

export default function ArqoAtividades() {
  return (
    <MainLayout title="Atividades Arqo" subtitle="Agenda de atendimentos e histórico de conversas do WhatsApp">
      <Tabs defaultValue="agenda">
        <TabsList className="mb-5">
          <TabsTrigger value="agenda">Agenda Atendimentos</TabsTrigger>
          <TabsTrigger value="contatos">Meus contatos</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda">
          <AgendaAtendimentosTab />
        </TabsContent>

        <TabsContent value="contatos">
          <HistoricoContatosTab />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppAtividadesTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
