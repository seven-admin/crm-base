import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useArqoLeads, useArqoEtapas, useTransicionarEtapa } from '@/hooks/useArqo';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Phone, Mail } from 'lucide-react';
import type { ArqoLeadWithRelations } from '@/types/arqo.types';

export default function ArqoLeadsKanban() {
  const { data: leads = [], isLoading } = useArqoLeads();
  const { data: etapas = [] } = useArqoEtapas();
  const transicionar = useTransicionarEtapa();
  const [dragging, setDragging] = useState<string | null>(null);

  const etapasAtivas = useMemo(() => etapas.filter(e => e.categoria === 'ativa'), [etapas]);

  const grouped = useMemo(() => {
    const map = new Map<string, ArqoLeadWithRelations[]>();
    etapasAtivas.forEach(e => map.set(e.id, []));
    leads.forEach(l => {
      const arr = map.get(l.etapa_id);
      if (arr) arr.push(l);
    });
    return map;
  }, [leads, etapasAtivas]);

  return (
    <MainLayout title="Arqo — Kanban de Leads" subtitle="Pipeline visual de leads e oportunidades">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {etapasAtivas.map(etapa => {
            const items = grouped.get(etapa.id) ?? [];
            return (
              <div
                key={etapa.id}
                className="flex-shrink-0 w-72"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragging) {
                    transicionar.mutate({ leadId: dragging, etapaPara: etapa.id });
                    setDragging(null);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-3 sticky top-0">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: etapa.cor }} />
                    <h3 className="font-semibold text-sm">{etapa.nome}</h3>
                  </div>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {items.map(l => (
                    <Card
                      key={l.id}
                      draggable
                      onDragStart={() => setDragging(l.id)}
                      onDragEnd={() => setDragging(null)}
                      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
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
                    <div className="text-center text-xs text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                      Solte um lead aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}
