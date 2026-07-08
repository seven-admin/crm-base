import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Home, User, Phone, Mail, Building2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNexaVisita, useNexaEventos, useUpdateVisitaStatus } from '@/hooks/useNexa';
import { UnidadeAcaoDialog } from '@/components/nexa/UnidadeAcaoDialog';
import { VisitaTimeline } from '@/components/nexa/VisitaTimeline';
import { STATUS_LABELS, STATUS_COLORS, type NexaVisitaStatus } from '@/types/nexa.types';

export default function NexaVisitaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { data: visita, isLoading } = useNexaVisita(id);
  const { data: eventos } = useNexaEventos(id);
  const updateStatus = useUpdateVisitaStatus();
  const [acaoOpen, setAcaoOpen] = useState(false);

  if (isLoading) {
    return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!visita) {
    return <div className="p-6">Visita não encontrada.</div>;
  }

  const nome = visita.cliente?.nome || visita.visitante_nome || 'Visitante';
  const telefone = visita.cliente?.telefone || visita.visitante_telefone;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Link to="/nexa/agenda" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar para agenda
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{nome}</h1>
          <p className="text-muted-foreground">
            {format(new Date(visita.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <Badge className={STATUS_COLORS[visita.status]}>{STATUS_LABELS[visita.status]}</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Dados da visita</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {nome}</div>
            {telefone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {telefone}</div>}
            {visita.cliente?.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {visita.cliente.email}</div>}
            <div className="flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground" /> {visita.empreendimento?.nome}</div>
            {visita.imobiliaria?.nome && (
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {visita.imobiliaria.nome}</div>
            )}
            {visita.corretor?.nome_completo && (
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Corretor: {visita.corretor.nome_completo}</div>
            )}
            {visita.observacoes && (
              <div className="pt-2 border-t mt-2">
                <p className="font-medium mb-1">Observações</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{visita.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ações</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Alterar status</label>
              <Select
                value={visita.status}
                onValueChange={(v) => updateStatus.mutate({ id: visita.id, status: v as NexaVisitaStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as NexaVisitaStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setAcaoOpen(true)}>
              <CalendarClock className="h-4 w-4 mr-2" />
              Registrar interesse
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          <VisitaTimeline eventos={eventos ?? []} />
        </CardContent>
      </Card>

      <UnidadeAcaoDialog
        open={acaoOpen}
        onOpenChange={setAcaoOpen}
        visitaId={visita.id}
        empreendimentoId={visita.empreendimento_id}
      />
    </div>
  );
}
