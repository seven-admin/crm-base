import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Loader2, Phone, Upload, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArqoImportarLeadsDialog } from '@/components/arqo/ArqoImportarLeadsDialog';
import { ArqoAtendimentoFlow } from '@/components/arqo/ArqoAtendimentoFlow';
import { ArqoPerformanceDashboard } from '@/components/arqo/ArqoPerformanceDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useArqoAtendimentoDashboard } from '@/hooks/useArqoAtendimentoDashboard';
import { useArqoEtapas, useArqoFilaUsuario, useArqoLeads, useMeusArqoGrupos, usePuxarProximoLead } from '@/hooks/useArqo';

export default function ArqoRoleta() {
  const { user } = useAuth();
  const [importOpen, setImportOpen] = useState(false);
  const { data: meusGrupos = [], isLoading: loadingGrupos } = useMeusArqoGrupos(user?.id);
  const { data: allLeads = [], isLoading: loadingLeads } = useArqoLeads();
  const { data: etapas = [] } = useArqoEtapas();
  const { data: fila = [] } = useArqoFilaUsuario();
  const puxar = usePuxarProximoLead();
  const dashboard = useArqoAtendimentoDashboard();

  const meuLeadAtivo = useMemo(
    () => allLeads.find((lead) => lead.consultor_id === user?.id && !lead.fechado_em && lead.etapa?.bloqueia_roleta !== false),
    [allLeads, user?.id],
  );

  const minhasPendencias = useMemo(
    () => allLeads.filter((lead) => lead.consultor_id === user?.id && !lead.fechado_em && lead.etapa?.bloqueia_roleta === false),
    [allLeads, user?.id],
  );

  const filaPorGrupo = useMemo(
    () => new Map(fila.map((item) => [item.grupo_id, Number(item.quantidade)])),
    [fila],
  );

  return (
    <MainLayout
      title="Atendimento Arqo"
      subtitle="Carteira, performance e próxima oportunidade em um único fluxo"
      actions={
        <Button variant="outline" onClick={() => setImportOpen(true)} className="bg-card">
          <Upload className="mr-2 h-4 w-4" /> Importar leads
        </Button>
      }
      contentClassName="pt-4 md:pt-6"
    >
      <ArqoImportarLeadsDialog open={importOpen} onOpenChange={setImportOpen} />

      <ArqoPerformanceDashboard dashboard={dashboard} />

      <section className="mt-6" aria-labelledby="atendimento-atual-title">
        <div className="mb-4 flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Atendimento</p>
            <h2 id="atendimento-atual-title" className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Oportunidade atual</h2>
          </div>
          {meuLeadAtivo && <Badge className="bg-success text-success-foreground">Em andamento</Badge>}
        </div>
        {loadingLeads ? (
          <Card className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></Card>
        ) : meuLeadAtivo ? (
          <ArqoAtendimentoFlow lead={meuLeadAtivo} etapas={etapas} />
        ) : (
          <Card className="border-dashed bg-[#fffdfa] p-10 text-center text-muted-foreground shadow-none">
            <Users className="mx-auto mb-4 h-8 w-8 text-primary/60" />
            <p className="font-medium text-foreground">Nenhuma oportunidade em atendimento</p>
            <p className="mt-1 text-sm">Use a roleta abaixo para receber o próximo lead disponível.</p>
          </Card>
        )}
      </section>

      <section id="roleta" className="relative mt-6 overflow-hidden rounded-[2rem] bg-[#201a17] p-5 text-white sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full border-[48px] border-[#ff7417]/10" />
        <div className="relative mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#ff8a39]">Roleta</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Puxar próximo lead</h2>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-white/45">A seleção acontece no banco em uma única operação e respeita a ordem da fila.</p>
        </div>

        {loadingGrupos ? (
          <Card className="flex justify-center border-white/10 bg-white/[.05] p-6 text-white shadow-none"><Loader2 className="h-5 w-5 animate-spin" /></Card>
        ) : meusGrupos.length === 0 ? (
          <Card className="border-white/10 bg-white/[.05] p-6 text-center text-sm text-white/50 shadow-none">
            Você não está vinculado a nenhum grupo de atendimento.
          </Card>
        ) : (
          <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {meusGrupos.map((group) => {
              const quantity = filaPorGrupo.get(group.id) ?? 0;
              return (
                <Card key={group.id} className="border-white/10 bg-white/[.055] p-4 text-white shadow-none">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/40">{group.papel}</p>
                      <h3 className="mt-1 truncate font-semibold">{group.nome}</h3>
                    </div>
                    <Badge className="border-0 bg-[#ff7417] px-3 text-lg text-[#21150d]">{quantity}</Badge>
                  </div>
                  <Button
                    className="w-full bg-[#ff7417] text-[#21150d] hover:bg-[#ff8a39]"
                    size="sm"
                    disabled={!!meuLeadAtivo || quantity === 0 || puxar.isPending}
                    onClick={() => puxar.mutate(group.id)}
                  >
                    {puxar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Puxar próximo lead
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {minhasPendencias.length > 0 && (
        <section className="mt-6 rounded-[2rem] border border-black/[.06] bg-[#fffdfa] p-5 sm:p-7">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-black/45">
            <Clock className="h-4 w-4" /> Pendências ({minhasPendencias.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {minhasPendencias.map((lead) => (
              <Link key={lead.id} to={`/arqo/leads/${lead.id}`}>
                <Card className="h-full bg-[#f7f3ed] p-4 shadow-none transition-colors hover:border-primary/25 hover:bg-primary-soft/40">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-medium">{lead.cliente?.nome ?? '—'}</span>
                    <Badge style={{ backgroundColor: lead.etapa?.cor, color: '#fff' }} className="shrink-0 text-xs">{lead.etapa?.nome}</Badge>
                  </div>
                  {lead.cliente?.telefone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {lead.cliente.telefone}</div>}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </MainLayout>
  );
}
