import { MainLayout } from '@/components/layout/MainLayout';
import { WhatsAppAtividadesTab } from '@/components/shared/WhatsAppAtividadesTab';

export default function ArqoAtividades() {
  return (
    <MainLayout title="Arqo — Atividades" subtitle="Histórico de conversas do WhatsApp dos leads">
      <WhatsAppAtividadesTab />
    </MainLayout>
  );
}
