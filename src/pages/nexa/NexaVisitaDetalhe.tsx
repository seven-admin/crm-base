import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarClock, Home, Loader2, Mail, MapPin, Phone, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MainLayout } from '@/components/layout/MainLayout';
import { useNexaEventos, useNexaVisita, useUpdateVisitaStatus } from '@/hooks/useNexa';
import { UnidadeAcaoDialog } from '@/components/nexa/UnidadeAcaoDialog';
import { VisitaTimeline } from '@/components/nexa/VisitaTimeline';
import {
  NEXA_SUBTIPO_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  TIPO_ATIVIDADE_LABELS,
  type NexaVisitaStatus,
} from '@/types/nexa.types';
import { formatarTelefone } from '@/lib/documentUtils';

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-white/[.07] p-3">
      <span className="mt-0.5 text-[#ff8a39]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</span>
        <span className="block break-words">{value}</span>
      </span>
    </div>
  );
}

export default function NexaVisitaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { data: atividade, isLoading } = useNexaVisita(id);
  const isAtendimento = atividade?.tipo === 'atendimento';
  const { data: eventos } = useNexaEventos(isAtendimento ? id : undefined);
  const updateStatus = useUpdateVisitaStatus();
  const [acaoOpen, setAcaoOpen] = useState(false);

  if (isLoading) {
    return <MainLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></MainLayout>;
  }
  if (!atividade) {
    return <MainLayout><div>Atividade não encontrada.</div></MainLayout>;
  }

  const categoria = TIPO_ATIVIDADE_LABELS[atividade.tipo] || 'Atividade';
  const subtipo = atividade.subtipo ? NEXA_SUBTIPO_LABELS[atividade.subtipo] : null;
  const nome = atividade.cliente?.nome || atividade.visitante_nome || subtipo || categoria;
  const telefone = atividade.cliente?.telefone || atividade.visitante_telefone;
  const participantes = (atividade.participantes ?? []).map((p) => p.corretor_nome).filter(Boolean).join(', ');
  const requestedReturn = (location.state as { from?: string } | null)?.from;
  const backTo = requestedReturn === '/nexa/calendario' || requestedReturn === '/calendarios'
    ? requestedReturn
    : '/nexa/agenda';
  const backLabel = backTo === '/nexa/agenda' ? 'Voltar para a agenda' : 'Voltar para o calendário';

  return (
    <MainLayout
      title={nome}
      subtitle={format(new Date(atividade.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
      badge={(
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{categoria}</Badge>
          {atividade.status && <Badge className={STATUS_COLORS[atividade.status]}>{STATUS_LABELS[atividade.status]}</Badge>}
        </div>
      )}
      actions={<Button variant="outline" asChild><Link to={backTo}><ArrowLeft className="h-4 w-4" /> {backLabel}</Link></Button>}
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <div className={`grid gap-4 ${isAtendimento ? 'md:grid-cols-3' : ''}`}>
          <Card className={`border-0 bg-[#201a17] text-white ${isAtendimento ? 'md:col-span-2' : ''}`}>
            <CardHeader>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff8a39]">{categoria}</p>
              <CardTitle className="text-2xl">Dados completos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              {subtipo && <Info icon={<CalendarClock className="h-4 w-4" />} label="Tipo" value={subtipo} />}
              {isAtendimento && <Info icon={<User className="h-4 w-4" />} label="Cliente" value={nome} />}
              {telefone && <Info icon={<Phone className="h-4 w-4" />} label="Telefone" value={formatarTelefone(telefone)} />}
              {atividade.cliente?.email && <Info icon={<Mail className="h-4 w-4" />} label="E-mail" value={atividade.cliente.email} />}
              {atividade.empreendimento?.nome && <Info icon={<Home className="h-4 w-4" />} label="Empreendimento" value={atividade.empreendimento.nome} />}
              {atividade.imobiliaria?.nome && <Info icon={<Building2 className="h-4 w-4" />} label="Imobiliária" value={atividade.imobiliaria.nome} />}
              {atividade.corretor?.nome_completo && <Info icon={<User className="h-4 w-4" />} label="Corretor" value={atividade.corretor.nome_completo} />}
              {atividade.local && <Info icon={<MapPin className="h-4 w-4" />} label="Local" value={atividade.local} />}
              {atividade.qtd_pessoas != null && <Info icon={<Users className="h-4 w-4" />} label="Número de pessoas" value={atividade.qtd_pessoas} />}
              {participantes && <Info icon={<Users className="h-4 w-4" />} label="Participantes" value={participantes} />}
              {atividade.criador?.full_name && <Info icon={<User className="h-4 w-4" />} label="Responsável" value={atividade.criador.full_name} />}
              {atividade.observacoes && (
                <div className="col-span-full mt-2 border-t border-white/10 pt-4">
                  <p className="mb-1 font-medium">Observações</p>
                  <p className="whitespace-pre-wrap text-white/60">{atividade.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isAtendimento && atividade.status && (
            <Card>
              <CardHeader><CardTitle>Ações</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Alterar status</Label>
                  <Select
                    value={atividade.status}
                    onValueChange={(status) => updateStatus.mutate({ id: atividade.id, status: status as NexaVisitaStatus })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as NexaVisitaStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {atividade.empreendimento_id && (
                  <Button className="w-full" onClick={() => setAcaoOpen(true)}>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Registrar interesse
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {isAtendimento && (
          <Card>
            <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
            <CardContent><VisitaTimeline eventos={eventos ?? []} /></CardContent>
          </Card>
        )}

        {isAtendimento && atividade.empreendimento_id && (
          <UnidadeAcaoDialog
            open={acaoOpen}
            onOpenChange={setAcaoOpen}
            visitaId={atividade.id}
            empreendimentoId={atividade.empreendimento_id}
          />
        )}
      </div>
    </MainLayout>
  );
}
