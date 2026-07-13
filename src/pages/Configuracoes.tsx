import { useSearchParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { DominiosGoogleTab } from '@/components/configuracoes/DominiosGoogleTab';

export default function Configuracoes() {
  const [params, setParams] = useSearchParams();
  const { isSuperAdmin } = usePermissions();
  const superAdmin = isSuperAdmin();

  const currentTab = params.get('tab') || 'perfil';

  const setTab = (tab: string) => {
    const p = new URLSearchParams(params);
    p.set('tab', tab);
    setParams(p, { replace: true });
  };

  return (
    <MainLayout title="Configurações" subtitle="Preferências e ajustes do sistema">
      <Tabs value={currentTab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          {superAdmin && (
            <TabsTrigger value="dominios-google">Domínios Google</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="perfil">
          <Card className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              As configurações do seu perfil ficam na página dedicada.
            </p>
            <Button asChild variant="outline">
              <Link to="/meu-perfil">Abrir meu perfil</Link>
            </Button>
          </Card>
        </TabsContent>

        {superAdmin && (
          <TabsContent value="dominios-google">
            <DominiosGoogleTab />
          </TabsContent>
        )}
      </Tabs>
    </MainLayout>
  );
}
