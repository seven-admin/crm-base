import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Home, User, Phone, Mail, Building2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MainLayout } from '@/components/layout/MainLayout';
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
    return <MainLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></MainLayout>;
  }
  if (!visita) {
    return <MainLayout><div>Visita não encontrada.</div></MainLayout>;
  }

  const nome = visita.cliente?.nome || visita.visitante_nome || 'Visitante';
  const telefone = visita.cliente?.telefone || visita.visitante_telefone;

  return (
    <MainLayout
      title={nome}
      subtitle={format(new Date(visita.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
      badge={<Badge className={STATUS_COLORS[visita.status]}>{STATUS_LABELS[visita.status]}</Badge>}
      actions={<Button variant="outline" asChild><Link to="/nexa/agenda"><ArrowLeft className="h-4 w-4" /> Voltar para agenda</Link></Button>}
    >
      <div className="mx-auto max-w-5xl space-y-5">

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-0 bg-[#201a17] text-white md:col-span-2">
          <CardHeader><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff8a39]">Visita agendada</p><CardTitle className="text-2xl">Dados da visita</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/[.07] p-3"><User className="h-4 w-4 text-[#ff8a39]" /> {nome}</div>
            {telefone && <div className="flex items-center gap-2 rounded-xl bg-white/[.07] p-3"><Phone className="h-4 w-4 text-[#ff8a39]" /> {telefone}</div>}
            {visita.cliente?.email && <div className="flex items-center gap-2 rounded-xl bg-white/[.07] p-3"><Mail className="h-4 w-4 text-[#ff8a39]" /> {visita.cliente.email}</div>}
            <div className="flex items-center gap-2 rounded-xl bg-white/[.07] p-3"><Home className="h-4 w-4 text-[#ff8a39]" /> {visita.empreendimento?.nome}</div>
            {visita.imobiliaria?.nome && (
              <div className="flex items-center gap-2 rounded-xl bg-white/[.07] p-3"><Building2 className="h-4 w-4 text-[#ff8a39]" /> {visita.imobiliaria.nome}</div>
            )}
            {visita.corretor?.nome_completo && (
              <div className="flex items-center gap-2 rounded-xl bg-white/[.07] p-3"><User className="h-4 w-4 text-[#ff8a39]" /> Corretor: {visita.corretor.nome_completo}</div>
            )}
            {visita.observacoes && (
              <div className="col-span-full mt-2 border-t border-white/10 pt-4">
                <p className="font-medium mb-1">Observações</p>
                <p className="text-white/50 whitespace-pre-wrap">{visita.observacoes}</p>
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
    </MainLayout>
  );
}
