import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useArqoEtapas, useArqoTemperaturas, useArqoSources, useArqoGrupos, useArqoSlaRegras, useArqoRegua } from '@/hooks/useArqo';

export default function ArqoConfig() {
  const { data: etapas = [] } = useArqoEtapas();
  const { data: temps = [] } = useArqoTemperaturas();
  const { data: sources = [] } = useArqoSources();
  const { data: grupos = [] } = useArqoGrupos();
  const { data: sla = [] } = useArqoSlaRegras();
  const { data: regua = [] } = useArqoRegua();

  return (
    <MainLayout title="Arqo — Configurações" subtitle="Funil, temperaturas, fontes, grupos, SLA e reengajamento">
      <Tabs defaultValue="etapas">
        <TabsList className="mb-4">
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="temperaturas">Temperaturas</TabsTrigger>
          <TabsTrigger value="sources">Fontes</TabsTrigger>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="regua">Reengajamento</TabsTrigger>
        </TabsList>

        <TabsContent value="etapas">
          <Card className="p-4 space-y-2">
            {etapas.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2 border-b last:border-0">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: e.cor }} />
                <span className="font-medium flex-1">{e.nome}</span>
                <Badge variant="outline">{e.categoria}</Badge>
                <Badge variant="secondary">peso {e.peso}</Badge>
                <span className="text-xs text-muted-foreground w-12 text-right">#{e.ordem}</span>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="temperaturas">
          <Card className="p-4 space-y-2">
            {temps.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2 border-b last:border-0">
                <span className="h-4 w-4 rounded" style={{ backgroundColor: t.cor }} />
                <span className="font-medium flex-1">{t.nome}</span>
                <Badge>peso {t.peso}</Badge>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card className="p-4 space-y-2">
            {sources.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2 border-b last:border-0">
                <span className="font-medium flex-1">{s.nome}</span>
                {s.descricao && <span className="text-sm text-muted-foreground">{s.descricao}</span>}
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="grupos">
          <Card className="p-4 space-y-2">
            {grupos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado. Use o SQL Editor para criar grupos e associar membros por enquanto.</p>}
            {grupos.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-2 border-b last:border-0">
                <span className="font-medium flex-1">{g.nome}</span>
                <Badge variant="outline">{g.tipo}</Badge>
                <Badge variant={g.is_active ? 'default' : 'secondary'}>{g.is_active ? 'Ativo' : 'Inativo'}</Badge>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="sla">
          <Card className="p-4 space-y-2">
            {sla.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma regra de SLA cadastrada.</p>}
            {sla.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-2 border-b last:border-0">
                <span className="text-sm flex-1">Etapa {etapas.find(e => e.id === r.etapa_id)?.nome ?? '—'}</span>
                <Badge variant="outline">{r.horas_max}h</Badge>
                <Badge>{r.acao_expiracao}</Badge>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="regua">
          <Card className="p-4 space-y-2">
            {regua.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma régua de reengajamento cadastrada.</p>}
            {regua.map(r => (
              <div key={r.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium flex-1">{r.nome}</span>
                  <Badge variant="outline">{r.canal}</Badge>
                  <Badge>D+{r.dias_apos_ultimo_contato}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{r.mensagem_template}</p>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
