import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useArqoLeads, useArqoEtapas, useTransicionarEtapa } from '@/hooks/useArqo';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Phone, Mail, Upload } from 'lucide-react';
import type { ArqoLeadWithRelations } from '@/types/arqo.types';
import { ArqoImportarLeadsDialog } from '@/components/arqo/ArqoImportarLeadsDialog';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

const ARQO_ADMIN_ROLES = new Set(['super_admin', 'admin', 'arqo_admin', 'arqo_gestor']);

export default function ArqoLeadsKanban() {
  const { user, role } = useAuth();
  const { isAdmin } = usePermissions();
  const podeVerTudo = isAdmin() || (role ? ARQO_ADMIN_ROLES.has(role) : false);
  const { data: leads = [], isLoading } = useArqoLeads(
    podeVerTudo ? undefined : { consultorId: user?.id },
  );
  const { data: etapas = [] } = useArqoEtapas();
  const transicionar = useTransicionarEtapa();
  const [dragging, setDragging] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Mostra todas as etapas cadastradas (ativa/ganho/perda/descartado) como
  // colunas, na mesma ordem do cadastro — antes só "ativa" aparecia, então
  // leads em Ganho/Perdido/Descartado ficavam sem coluna e somem da visão.
  const grouped = useMemo(() => {
    const map = new Map<string, ArqoLeadWithRelations[]>();
    etapas.forEach(e => map.set(e.id, []));
    leads.forEach(l => {
      const arr = map.get(l.etapa_id);
      if (arr) arr.push(l);
    });
    return map;
  }, [leads, etapas]);

  const moverParaEtapa = (leadId: string, etapa: (typeof etapas)[number]) => {
    if (etapa.categoria === 'perda') {
      const motivo = window.prompt('Motivo da perda:');
      if (!motivo) return;
      transicionar.mutate({ leadId, etapaPara: etapa.id, motivoPerda: motivo });
    } else {
      transicionar.mutate({ leadId, etapaPara: etapa.id });
    }
  };

  return (
    <MainLayout
      title="Pipeline de leads"
      subtitle="Acompanhe o fluxo comercial e mova oportunidades entre etapas"
      actions={
        <Button variant="outline" size="sm" className="bg-card" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-2" /> Importar CSV
        </Button>
      }
    >
      <div className="mb-4 flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-card px-4 py-3 text-xs text-muted-foreground shadow-card">
        <span className="font-semibold uppercase tracking-[.14em] text-primary">Pipeline Arqo</span>
        <span>{leads.length} oportunidades · {etapas.length} etapas</span>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : (
        <div className="flex min-h-[480px] max-h-[calc(100vh-250px)] gap-3 overflow-x-auto pb-4">
          {etapas.map(etapa => {
            const items = grouped.get(etapa.id) ?? [];
            return (
              <div
                key={etapa.id}
                className="flex w-80 flex-shrink-0 flex-col rounded-[1.6rem] border border-black/[.05] bg-[#eae5df] p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragging) {
                    moverParaEtapa(dragging, etapa);
                    setDragging(null);
                  }
                }}
              >
                <div className="mb-3 flex shrink-0 items-center justify-between px-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: etapa.cor }} />
                    <h3 className="text-sm font-semibold tracking-[-0.02em]">{etapa.nome}</h3>
                  </div>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="min-h-[200px] flex-1 space-y-2 overflow-y-auto pr-1">
                  {items.map(l => (
                    <Card
                      key={l.id}
                      draggable
                      onDragStart={() => setDragging(l.id)}
                      onDragEnd={() => setDragging(null)}
                      className="cursor-grab rounded-[1.25rem] border-white/80 bg-[#fffdfa] p-4 shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/arqo/leads/${l.id}`} className="font-medium text-sm hover:underline flex-1 truncate">
                          {l.cliente?.nome ?? '—'}
                        </Link>
                        {l.qualificacao_score != null && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Sparkles className="h-3 w-3" /> {l.qualificacao_score}
                          </Badge>
                        )}
                      </div>
                      {l.temperatura && (
                        <Badge className="mt-2 text-xs" style={{ backgroundColor: l.temperatura.cor, color: '#fff' }}>
                          {l.temperatura.nome}
                        </Badge>
                      )}
                      <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                        {l.cliente?.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{l.cliente.telefone}</span>}
                        {l.cliente?.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{l.cliente.email}</span>}
                        {l.empreendimento && <span className="truncate">🏢 {l.empreendimento.nome}</span>}
                        {l.valor_estimado != null && <span>💰 R$ {Number(l.valor_estimado).toLocaleString('pt-BR')}</span>}
                      </div>
                      {l.consultor && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Consultor:</span> {l.consultor.full_name}
                        </div>
                      )}
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-[1.2rem] border border-dashed border-black/15 py-8 text-center text-xs text-muted-foreground">
                      Solte um lead aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ArqoImportarLeadsDialog open={importOpen} onOpenChange={setImportOpen} />
    </MainLayout>
  );
}
