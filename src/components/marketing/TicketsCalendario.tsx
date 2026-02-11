import { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { Ticket, StatusTicket, PrioridadeTicket, STATUS_LABELS, STATUS_COLORS, CATEGORIA_LABELS, PRIORIDADE_LABELS, PRIORIDADE_COLORS } from '@/types/marketing.types';

// Helper to get background color from hex
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper to check if ticket is overdue
function isTicketOverdue(ticket: Ticket, etapasFinaisIds?: Set<string>): boolean {
  if (!ticket.data_previsao) return false;
  if (['concluido', 'arquivado'].includes(ticket.status)) return false;
  // Verificar se está numa etapa final dinâmica
  if (etapasFinaisIds && ticket.ticket_etapa_id && etapasFinaisIds.has(ticket.ticket_etapa_id)) return false;
  return isBefore(new Date(ticket.data_previsao), startOfDay(new Date()));
}

interface TicketsCalendarioProps {
  tickets: Ticket[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  etapasFinaisIds?: Set<string>;
}

export function TicketsCalendario({
  tickets,
  selectedDate,
  onDateSelect,
  onMonthChange,
  etapasFinaisIds,
}: TicketsCalendarioProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  // Organizar tickets por dia usando data_previsao
  const ticketsPorDia = useMemo(() => {
    const map = new Map<string, Ticket[]>();
    tickets.forEach((ticket) => {
      if (ticket.data_previsao) {
        const dateKey = format(new Date(ticket.data_previsao), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, ticket]);
      }
    });
    return map;
  }, [tickets]);

  // Gerar dias do mês
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    onDateSelect(today);
    onMonthChange?.(startOfMonth(today));
  };

  // Calcular o dia da semana do primeiro dia (0 = Domingo)
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Semanas
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card>
      <CardHeader className="pb-2">
        {/* Header com navegação */}
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24" />
          ))}

          {/* Dias do mês */}
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTickets = ticketsPorDia.get(dateKey) || [];
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const hasTickets = dayTickets.length > 0;

            const dayContent = (
              <button
                onClick={() => onDateSelect(day)}
                className={cn(
                  'h-24 w-full p-1 text-left rounded-lg border transition-colors relative',
                  'hover:bg-accent hover:border-primary/50',
                  isSelected && 'border-primary bg-accent',
                  !isSameMonth(day, currentMonth) && 'opacity-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full',
                      isTodayDate && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasTickets && (
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        {dayTickets.length}
                      </Badge>
                      {dayTickets.some(t => isTicketOverdue(t, etapasFinaisIds)) && (
                      <Badge variant="destructive" className="text-xs h-5 px-1.5">
                        {dayTickets.filter(t => isTicketOverdue(t, etapasFinaisIds)).length} <AlertTriangle className="h-3 w-3 ml-0.5" />
                      </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Preview dos tickets */}
                <div className="mt-1 space-y-0.5 overflow-hidden">
                  {dayTickets.slice(0, 3).map((ticket) => {
                    const overdue = isTicketOverdue(ticket, etapasFinaisIds);
                    return (
                      <div
                        key={ticket.id}
                        className={cn(
                          "text-xs truncate px-1 py-0.5 rounded flex items-center gap-1",
                          overdue && "ring-1 ring-destructive"
                        )}
                        style={{
                          backgroundColor: overdue 
                            ? 'rgba(239, 68, 68, 0.15)' 
                            : hexToRgba(STATUS_COLORS[ticket.status] || '#6b7280', 0.2),
                          color: overdue 
                            ? '#dc2626' 
                            : STATUS_COLORS[ticket.status] || '#374151',
                        }}
                      >
                        {overdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{ticket.titulo}</span>
                      </div>
                    );
                  })}
                  {dayTickets.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayTickets.length - 3} mais
                    </div>
                  )}
                </div>
              </button>
            );

            if (hasTickets) {
              return (
                <HoverCard key={day.toISOString()} openDelay={200}>
                  <HoverCardTrigger asChild>{dayContent}</HoverCardTrigger>
                  <HoverCardContent className="w-80 p-3" side="right" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {format(day, "d 'de' MMMM", { locale: ptBR })}
                        </span>
                        <Badge variant="secondary" className="ml-auto">
                          {dayTickets.length} {dayTickets.length === 1 ? 'ticket' : 'tickets'}
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {dayTickets.map((ticket) => {
                          const overdue = isTicketOverdue(ticket, etapasFinaisIds);
                          return (
                            <div
                              key={ticket.id}
                              className={cn(
                                "p-2 rounded-lg border bg-card",
                                overdue && "border-destructive"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {ticket.codigo}
                                  </p>
                                  <p className="font-medium text-sm truncate">
                                    {ticket.titulo}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                      {CATEGORIA_LABELS[ticket.categoria]}
                                    </Badge>
                                    {overdue && (
                                      <Badge variant="destructive" className="text-xs">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Atrasado
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge
                                    className="text-xs"
                                    style={{
                                      backgroundColor: hexToRgba(STATUS_COLORS[ticket.status] || '#6b7280', 0.2),
                                      color: STATUS_COLORS[ticket.status] || '#374151',
                                    }}
                                  >
                                    {STATUS_LABELS[ticket.status]}
                                  </Badge>
                                  <Badge
                                    className="text-xs"
                                    style={{
                                      backgroundColor: hexToRgba(PRIORIDADE_COLORS[ticket.prioridade] || '#6b7280', 0.2),
                                      color: PRIORIDADE_COLORS[ticket.prioridade] || '#374151',
                                    }}
                                  >
                                    {PRIORIDADE_LABELS[ticket.prioridade]}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            }

            return <div key={day.toISOString()}>{dayContent}</div>;
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-destructive" />
            <span className="text-muted-foreground">Atrasado</span>
          </div>
          {(Object.entries(STATUS_LABELS) as [StatusTicket, string][]).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: STATUS_COLORS[key] || '#e5e7eb' }}
              />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
