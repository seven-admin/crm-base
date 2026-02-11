import { AlertTriangle, Clock, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TicketResumo } from '@/hooks/useDashboardMarketing';
import { CATEGORIA_LABELS } from '@/types/marketing.types';
import { Link } from 'react-router-dom';

interface TicketsAtrasadosListProps {
  tickets: TicketResumo[];
  maxHeight?: string;
}

export function TicketsAtrasadosList({ tickets, maxHeight = '300px' }: TicketsAtrasadosListProps) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Tickets Atrasados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum ticket atrasado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Tickets Atrasados ({tickets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="divide-y">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/marketing/${ticket.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {ticket.codigo}
                      </span>
                      {ticket.is_interno && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          <Building2 className="h-3 w-3 mr-1" />
                          Interno
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{ticket.titulo}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{CATEGORIA_LABELS[ticket.categoria]}</span>
                      {ticket.cliente_nome && (
                        <>
                          <span>•</span>
                          <span>{ticket.cliente_nome}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="destructive" className="shrink-0">
                    {ticket.dias_atraso} {ticket.dias_atraso === 1 ? 'dia' : 'dias'}
                  </Badge>
                </div>
                {ticket.supervisor_nome && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Responsável: {ticket.supervisor_nome}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
