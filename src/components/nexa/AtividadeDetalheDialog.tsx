import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarClock, ExternalLink, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatarTelefone } from '@/lib/documentUtils';
import {
  NEXA_SUBTIPO_LABELS, STATUS_LABELS, TIPO_ATIVIDADE_LABELS,
  type NexaAtividadeWithRelations,
} from '@/types/nexa.types';

interface Props {
  atividade: NexaAtividadeWithRelations | null;
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

export function AtividadeDetalheDialog({ atividade, onOpenChange }: Props) {
  const navigate = useNavigate();
  const a = atividade;
  const participantes = (a?.participantes ?? [])
    .map((p) => p.corretor_nome)
    .filter(Boolean)
    .join(', ');

  return (
    <Dialog open={!!a} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        {a && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {a.cliente?.nome || a.visitante_nome || TIPO_ATIVIDADE_LABELS[a.tipo] || 'Atividade'}
                {a.status && <Badge variant="outline">{STATUS_LABELS[a.status]}</Badge>}
              </DialogTitle>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                {format(new Date(a.data_hora), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Categoria" value={TIPO_ATIVIDADE_LABELS[a.tipo]} />
              {a.subtipo && <Field label="Tipo" value={NEXA_SUBTIPO_LABELS[a.subtipo]} />}
              <Field label="Responsável" value={a.criador?.full_name} />
              <Field label="Empreendimento" value={a.empreendimento?.nome} />
              <Field label="Imobiliária" value={a.imobiliaria?.nome} />
              <Field label="Corretor" value={a.corretor?.nome_completo} />
              {a.visitante_telefone && <Field label="Telefone" value={formatarTelefone(a.visitante_telefone)} />}
              {a.qtd_pessoas != null && <Field label="Nº de pessoas" value={a.qtd_pessoas} />}
              {participantes && <div className="col-span-2"><Field label="Participantes" value={participantes} /></div>}
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

            <div className="flex justify-end border-t pt-4">
              <Button onClick={() => navigate(`/nexa/visitas/${a.id}`)}>
                <ExternalLink className="mr-2 h-4 w-4" /> Abrir detalhe completo
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
