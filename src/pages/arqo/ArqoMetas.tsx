import { Link } from 'react-router-dom';
import { CalendarDays, PhoneCall } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArqoMetasDashboard } from '@/components/arqo/ArqoMetasDashboard';
import { ArqoMetasManager } from '@/components/arqo/ArqoMetasManager';
import { useArqoMetasAtendimento } from '@/hooks/useArqo';
import { useProfilesByRoles } from '@/hooks/useFuncionariosSeven';
import { usePermissions } from '@/hooks/usePermissions';

function MetasActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to="/arqo/calendario"><CalendarDays className="mr-2 h-4 w-4" /> Calendário</Link>
      </Button>
      <Button asChild size="sm">
        <Link to="/arqo/roleta"><PhoneCall className="mr-2 h-4 w-4" /> Atendimentos</Link>
      </Button>
    </div>
  );
}

export default function ArqoMetas() {
  const { isSuperAdmin } = usePermissions();
  // Configurar/atribuir metas é exclusivo de super_admin (mesmo padrão do /metas da NEXA).
  const canConfig = isSuperAdmin();
  const { data: metas = [] } = useArqoMetasAtendimento();
  const { data: profiles = [] } = useProfilesByRoles(
    ['arqo_admin', 'arqo_gestor', 'arqo_consultor', 'arqo_closer', 'super_admin'],
  );

  if (!canConfig) {
    return (
      <MainLayout title="Metas Arqo" subtitle="Seu desempenho da semana" actions={<MetasActions />}>
        <ArqoMetasDashboard />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Metas Arqo" subtitle="Metas de atendimento e desempenho da equipe" actions={<MetasActions />}>
      <Tabs defaultValue="dashboard">
        <TabsList className="mb-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="config">Configurar Metas</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><ArqoMetasDashboard /></TabsContent>
        <TabsContent value="config">
          <ArqoMetasManager metas={metas} profiles={profiles} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
