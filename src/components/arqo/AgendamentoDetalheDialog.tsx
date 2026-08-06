import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarClock, ExternalLink, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatarTelefone } from '@/lib/documentUtils';
import { AGENDAMENTO_STATUS_LABELS, type ArqoAgendamentoWithRelations } from '@/types/arqo.types';

interface Props {
  agendamento: ArqoAgendamentoWithRelations | null;
  tipoLabels: Record<string, string>;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, value }: { label: string; value: unknown }) {
  const v = value == null ? '' : String(value).trim();
  if (!v) return null;
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{v}</p>
    </div>
  );
}

export function AgendamentoDetalheDialog({ agendamento, tipoLabels, onOpenChange }: Props) {
  const navigate = useNavigate();
  const a = agendamento;
  const cliente = a?.lead?.cliente;

  return (
    <Dialog open={!!a} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        {a && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {cliente?.nome || tipoLabels[a.tipo] || 'Agendamento'}
                <Badge variant="outline">{AGENDAMENTO_STATUS_LABELS[a.status]}</Badge>
              </DialogTitle>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                {format(new Date(a.data_hora), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {a.duracao_min ? ` · ${a.duracao_min} min` : ''}
              </p>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo" value={tipoLabels[a.tipo] ?? a.tipo} />
              <Field label="Responsável" value={a.responsavel?.full_name} />
              <Field label="Closer" value={a.closer?.full_name} />
              <Field label="Empreendimento" value={a.lead?.empreendimento?.nome} />
              {cliente?.telefone && <Field label="Telefone" value={formatarTelefone(cliente.telefone)} />}
              {cliente?.whatsapp && <Field label="WhatsApp" value={formatarTelefone(cliente.whatsapp)} />}
              {cliente?.email && <Field label="E-mail" value={cliente.email} />}
              {a.local && (
                <div className="col-span-2 flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <Field label="Local" value={a.local} />
                </div>
              )}
            </div>

            {a.observacoes && (
              <div className="rounded-2xl border border-black/[.07] p-4">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Observações</p>
                <p className="whitespace-pre-wrap text-sm">{a.observacoes}</p>
              </div>
            )}

            {a.lead_id && (
              <div className="flex justify-end border-t pt-4">
                <Button onClick={() => navigate(`/arqo/leads/${a.lead_id}`)}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Abrir lead
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
