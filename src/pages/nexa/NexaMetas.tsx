import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NexaMetasDashboard } from '@/components/nexa/NexaMetasDashboard';
import { NexaMetasManager } from '@/components/nexa/NexaMetasManager';
import { PropostasNexaCard } from '@/pages/dashboard/components/PropostasNexaCard';
import { usePermissions } from '@/hooks/usePermissions';

// Metas é a inicial dos usuários NEXA: mostra desempenho da semana + feed de propostas.
function MetasHome() {
  return (
    <div className="space-y-5">
      <NexaMetasDashboard />
      <PropostasNexaCard />
    </div>
  );
}

export default function NexaMetas() {
  const { isSuperAdmin } = usePermissions();
  // Configurar metas é exclusivo de super_admin (decisão do produto).
  const canConfig = isSuperAdmin();

  if (!canConfig) {
    return (
      <MainLayout title="Metas Nexa" subtitle="Seu desempenho da semana">
        <MetasHome />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Metas Nexa" subtitle="Metas semanais de visitas e atendimentos">
      <Tabs defaultValue="dashboard">
        <TabsList className="mb-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="config">Configurar Metas</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><MetasHome /></TabsContent>
        <TabsContent value="config"><NexaMetasManager /></TabsContent>
      </Tabs>
    </MainLayout>
  );
}
