import { CalendarDays, Clock, Building2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import type { TicketResumo } from '@/hooks/useDashboardMarketing';
import { CATEGORIA_LABELS } from '@/types/marketing.types';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProximasEntregasListProps {
  tickets: TicketResumo[];
  maxHeight?: string;
}

function getDiasLabel(dias: number): string {
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  return `${dias} dias`;
}

function getProgressColor(dias: number): string {
  if (dias === 0) return 'bg-destructive';
  if (dias <= 2) return 'bg-amber-500';
  return 'bg-primary';
}

export function ProximasEntregasList({ tickets, maxHeight = '300px' }: ProximasEntregasListProps) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Próximas Entregas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma entrega nos próximos 7 dias</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Próximas Entregas ({tickets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="divide-y">
            {tickets.map((ticket) => {
              const diasRestantes = ticket.dias_restantes || 0;
              const progressValue = Math.max(0, ((7 - diasRestantes) / 7) * 100);
              
              return (
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
                    <div className="text-right shrink-0">
                      <Badge 
                        variant={diasRestantes === 0 ? 'destructive' : diasRestantes <= 2 ? 'secondary' : 'outline'}
                        className="mb-1"
                      >
                        {getDiasLabel(diasRestantes)}
                      </Badge>
                      {ticket.data_previsao && (
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(ticket.data_previsao), "dd/MM", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${getProgressColor(diasRestantes)}`}
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
