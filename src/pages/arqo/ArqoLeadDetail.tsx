import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useArqoLead, useArqoLeadEvents, useArqoEtapas, useTransicionarEtapa, useQualificarIA, useRegistrarTentativa } from '@/hooks/useArqo';
import { ArrowLeft, Phone, Mail, Sparkles, PhoneOff, User, Building, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ArqoLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading } = useArqoLead(id);
  const { data: events = [] } = useArqoLeadEvents(id);
  const { data: etapas = [] } = useArqoEtapas();
  const transicionar = useTransicionarEtapa();
  const qualificar = useQualificarIA();
  const tentar = useRegistrarTentativa();

  if (isLoading || !lead) {
    return (
      <MainLayout title="Lead">
        <Skeleton className="h-96" />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={lead.cliente?.nome ?? 'Lead'}
      subtitle={`Etapa: ${lead.etapa?.nome ?? '—'}`}
      actions={
        <Button variant="outline" asChild size="sm">
          <Link to="/arqo/leads"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Cliente</h2>
                <p className="text-sm text-muted-foreground">
                  Nível: <Badge variant="outline">{lead.cliente?.nivel_cadastro ?? '—'}</Badge>
                </p>
              </div>
              {lead.temperatura && (
                <Badge style={{ backgroundColor: lead.temperatura.cor, color: '#fff' }}>{lead.temperatura.nome}</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {lead.cliente?.telefone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {lead.cliente.telefone}</div>}
              {lead.cliente?.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {lead.cliente.email}</div>}
              {lead.empreendimento && <div className="flex items-center gap-2"><Building className="h-4 w-4" /> {lead.empreendimento.nome}</div>}
              {lead.valor_estimado != null && <div>💰 R$ {Number(lead.valor_estimado).toLocaleString('pt-BR')}</div>}
              {lead.consultor && <div>👤 {lead.consultor.full_name}</div>}
              <div>Tentativas: <Badge variant="outline">{lead.tentativas_contato}</Badge></div>
            </div>
            {lead.observacoes && (
              <div className="mt-4 p-3 bg-muted rounded text-sm whitespace-pre-wrap">{lead.observacoes}</div>
            )}
          </Card>

          {lead.qualificacao_resumo && (
            <Card className="p-4 border-primary/40">
              <div className="flex items-center gap-2 font-medium mb-2">
                <Sparkles className="h-4 w-4 text-primary" /> Qualificação IA — score {lead.qualificacao_score}
              </div>
              <p className="text-sm text-muted-foreground">{lead.qualificacao_resumo}</p>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Ações</h3>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => tentar.mutate({ leadId: lead.id })}>
                <PhoneOff className="h-4 w-4 mr-2" /> Sem resposta
              </Button>
              <Button size="sm" variant="outline" disabled={qualificar.isPending} onClick={() => qualificar.mutate(lead.id)}>
                {qualificar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Qualificar com IA
              </Button>
              {etapas.filter(e => e.id !== lead.etapa_id).map(e => (
                <Button key={e.id} size="sm" variant="ghost"
                  onClick={() => {
                    if (e.categoria === 'perda') {
                      const motivo = prompt('Motivo da perda:');
                      if (motivo) transicionar.mutate({ leadId: lead.id, etapaPara: e.id, motivoPerda: motivo });
                    } else {
                      transicionar.mutate({ leadId: lead.id, etapaPara: e.id });
                    }
                  }}
                >
                  <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: e.cor }} />
                  {e.nome}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">Linha do tempo</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {events.length === 0 && <p className="text-xs text-muted-foreground">Sem eventos registrados</p>}
            {events.map((ev: any) => (
              <div key={ev.id} className="border-l-2 border-primary pl-3 pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{ev.tipo}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ev.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {ev.comentario && <p className="text-xs mt-1">{ev.comentario}</p>}
                {ev.payload && Object.keys(ev.payload).length > 0 && (
                  <pre className="text-[10px] mt-1 text-muted-foreground overflow-x-auto">
                    {JSON.stringify(ev.payload, null, 0).slice(0, 200)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
