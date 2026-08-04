import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NexaMetasDashboard } from '@/components/nexa/NexaMetasDashboard';
import { NexaMetasManager } from '@/components/nexa/NexaMetasManager';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

const GESTOR_ROLES = new Set(['admin', 'super_admin', 'nexa_admin', 'nexa_gestor']);

export default function NexaMetas() {
  const { role } = useAuth();
  const { isAdmin } = usePermissions();
  const canManage = isAdmin() || (!!role && GESTOR_ROLES.has(role));

  if (!canManage) {
    return (
      <MainLayout title="Metas Nexa" subtitle="Seu desempenho da semana">
        <NexaMetasDashboard />
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
        <TabsContent value="dashboard"><NexaMetasDashboard /></TabsContent>
        <TabsContent value="config"><NexaMetasManager /></TabsContent>
      </Tabs>
    </MainLayout>
  );
}
