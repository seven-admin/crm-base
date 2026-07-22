import { useMemo } from 'react';
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

const EVENTO_LABELS: Record<string, string> = {
  transicao_etapa: 'Mudança de etapa',
  atribuicao: 'Atribuição via roleta',
  tentativa_sem_resposta: 'Sem resposta',
  liberacao_consultor: 'Liberado para fila',
  atendimento_registrado: 'Atendimento registrado',
  lead_indicado_gerado: 'Lead indicado gerado',
  indicacao_recebida: 'Lead recebido por indicação',
};

export default function ArqoLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading } = useArqoLead(id);
  const { data: events = [] } = useArqoLeadEvents(id);
  const { data: etapas = [] } = useArqoEtapas();
  const transicionar = useTransicionarEtapa();
  const qualificar = useQualificarIA();
  const tentar = useRegistrarTentativa();

  const nomePorEtapaId = useMemo(() => new Map(etapas.map(e => [e.id, e.nome])), [etapas]);

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
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden border-0 bg-[#201a17] p-6 text-white shadow-popover sm:p-7">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#ff8a39]">Oportunidade</p>
                <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.04em]"><User className="h-4 w-4" /> Cliente</h2>
                <p className="mt-1 text-sm text-white/45">
                  Nível: <Badge variant="outline">{lead.cliente?.nivel_cadastro ?? '—'}</Badge>
                </p>
              </div>
              {lead.temperatura && (
                <Badge style={{ backgroundColor: lead.temperatura.cor, color: '#fff' }}>{lead.temperatura.nome}</Badge>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {lead.cliente?.telefone && <div className="flex items-center gap-2 rounded-xl bg-white/[.07] px-3 py-2.5"><Phone className="h-4 w-4 text-[#ff8a39]" /> {lead.cliente.telefone}</div>}
              {lead.cliente?.email && <div className="flex items-center gap-2 rounded-xl bg-white/[.07] px-3 py-2.5"><Mail className="h-4 w-4 text-[#ff8a39]" /> {lead.cliente.email}</div>}
              {lead.empreendimento && <div className="flex items-center gap-2 rounded-xl bg-white/[.07] px-3 py-2.5"><Building className="h-4 w-4 text-[#ff8a39]" /> {lead.empreendimento.nome}</div>}
              {lead.valor_estimado != null && <div className="rounded-xl bg-white/[.07] px-3 py-2.5">💰 R$ {Number(lead.valor_estimado).toLocaleString('pt-BR')}</div>}
              {lead.consultor && <div className="rounded-xl bg-white/[.07] px-3 py-2.5">👤 {lead.consultor.full_name}</div>}
              <div className="rounded-xl bg-white/[.07] px-3 py-2.5">Tentativas: <Badge variant="outline" className="border-white/20 text-white">{lead.tentativas_contato}</Badge></div>
            </div>
            {lead.observacoes && (
              <div className="mt-4 rounded-xl bg-white/[.07] p-3 text-sm text-white/65 whitespace-pre-wrap">{lead.observacoes}</div>
            )}
          </Card>

          {lead.qualificacao_resumo && (
            <Card className="border-primary/25 bg-primary-soft/60 p-5 shadow-none">
              <div className="flex items-center gap-2 font-medium mb-2">
                <Sparkles className="h-4 w-4 text-primary" /> Qualificação IA — score {lead.qualificacao_score}
              </div>
              <p className="text-sm text-muted-foreground">{lead.qualificacao_resumo}</p>
            </Card>
          )}

          <Card className="p-5">
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

        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Histórico</p>
          <h3 className="mb-4 mt-2 text-xl font-semibold tracking-[-0.035em]">Linha do tempo</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {events.length === 0 && <p className="text-xs text-muted-foreground">Sem eventos registrados</p>}
            {events.map((ev: any) => (
              <div key={ev.id} className="border-l-2 border-primary pl-3 pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{EVENTO_LABELS[ev.tipo] ?? ev.tipo}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ev.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {ev.tipo === 'transicao_etapa' && (
                  <p className="text-xs mt-1 font-medium">
                    {nomePorEtapaId.get(ev.etapa_de) ?? '—'} → {nomePorEtapaId.get(ev.etapa_para) ?? '—'}
                  </p>
                )}
                {ev.tipo === 'atendimento_registrado' && ev.payload && (
                  <p className="mt-1 text-xs font-medium">
                    {[ev.payload.status_codigo, ev.payload.qualificacao_codigo, ev.payload.interesse_codigo, ev.payload.perfil_codigo, ev.payload.acao_codigo]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {ev.comentario && <p className="text-xs mt-1 text-muted-foreground">{ev.comentario}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
