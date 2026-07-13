import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Circle } from 'lucide-react';
import type { NexaEvento } from '@/types/nexa.types';

const EVENTO_LABELS: Record<string, string> = {
  criada: 'Visita criada',
  confirmada: 'Visita confirmada',
  realizada: 'Visita realizada',
  no_show: 'No-show registrado',
  cancelada: 'Visita cancelada',
  reservar_sucesso: 'Reserva realizada',
  reservar_conflito: 'Conflito na reserva',
  vender_sucesso: 'Venda realizada',
  vender_conflito: 'Conflito na venda',
  bloquear_sucesso: 'Bloqueio realizado',
  bloquear_conflito: 'Conflito no bloqueio',
};

export function VisitaTimeline({ eventos }: { eventos: NexaEvento[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>;
  }
  return (
    <div className="space-y-3">
      {eventos.map((e) => {
        const isConflito = e.tipo_evento.includes('conflito');
        return (
          <div key={e.id} className="flex gap-3 items-start">
            <Circle className={`h-3 w-3 mt-1.5 flex-shrink-0 ${isConflito ? 'text-destructive fill-destructive' : 'text-primary fill-primary'}`} />
            <div className="flex-1">
              <div className="text-sm font-medium">{EVENTO_LABELS[e.tipo_evento] || e.tipo_evento}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(e.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
