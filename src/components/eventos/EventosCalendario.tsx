import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface Evento {
  id: string;
  nome: string;
  codigo: string;
  data_evento: string;
  status: string | null;
  local?: string | null;
}

interface EventosCalendarioProps {
  eventos: Evento[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
}

// Helper para converter hex em rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Cores em hex para consistência com TicketsCalendario
const STATUS_COLORS: Record<string, string> = {
  planejamento: '#3b82f6',   // blue-500
  em_andamento: '#22c55e',   // green-500
  concluido: '#9ca3af',      // gray-400
  cancelado: '#ef4444',      // red-500
};

const STATUS_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export function EventosCalendario({
  eventos,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: EventosCalendarioProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, Evento[]>();
    eventos.forEach((evento) => {
      const key = format(new Date(evento.data_evento), 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(evento);
    });
    return map;
  }, [eventos]);

  // Gerar dias do mês (sem semanas extras)
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Calcular o dia da semana do primeiro dia (0 = Domingo)
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth.getFullYear(), newMonth.getMonth() + 1);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth.getFullYear(), newMonth.getMonth() + 1);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
    onMonthChange?.(today.getFullYear(), today.getMonth() + 1);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card>
      <CardHeader className="pb-2">
        {/* Header com navegação - mesmo layout do TicketsCalendario */}
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
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24" />
          ))}

          {/* Dias do mês */}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEventos = eventosPorDia.get(key) || [];
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const hasEventos = dayEventos.length > 0;

            const cellContent = (
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
                  {hasEventos && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {dayEventos.length}
                    </Badge>
                  )}
                </div>

                {/* Preview dos eventos */}
                <div className="mt-1 space-y-0.5 overflow-hidden">
                  {dayEventos.slice(0, 3).map((evento) => (
                    <div
                      key={evento.id}
                      className="text-xs truncate px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: hexToRgba(STATUS_COLORS[evento.status || 'planejamento'] || '#6b7280', 0.2),
                        color: STATUS_COLORS[evento.status || 'planejamento'] || '#374151',
                      }}
                    >
                      {evento.nome}
                    </div>
                  ))}
                  {dayEventos.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayEventos.length - 3} mais
                    </div>
                  )}
                </div>
              </button>
            );

            // Se tem eventos, envolve com HoverCard
            if (hasEventos) {
              return (
                <HoverCard key={key} openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    {cellContent}
                  </HoverCardTrigger>
                  <HoverCardContent 
                    className="w-72 p-0" 
                    side="right" 
                    align="start"
                    sideOffset={5}
                  >
                    <div className="p-3 border-b bg-muted/50">
                      <p className="font-semibold text-sm">
                        {format(day, "d 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dayEventos.length} evento{dayEventos.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="p-2 max-h-[200px] overflow-y-auto">
                      {dayEventos.map((evento) => {
                        const color = STATUS_COLORS[evento.status || 'planejamento'] || STATUS_COLORS.planejamento;
                        return (
                          <div 
                            key={evento.id}
                            className="p-2 rounded-md mb-1.5 last:mb-0"
                            style={{
                              backgroundColor: hexToRgba(color, 0.1),
                              borderLeft: `2px solid ${color}`
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-mono">
                                  {evento.codigo}
                                </p>
                                <p className="text-sm font-medium truncate">
                                  {evento.nome}
                                </p>
                                {evento.local && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {evento.local}
                                  </p>
                                )}
                              </div>
                              <Badge 
                                variant="secondary" 
                                className="text-[10px] shrink-0"
                                style={{
                                  backgroundColor: hexToRgba(color, 0.2),
                                  color: color
                                }}
                              >
                                {STATUS_LABELS[evento.status || 'planejamento']}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            }

            return <div key={key}>{cellContent}</div>;
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t text-xs">
          {(Object.entries(STATUS_LABELS) as [string, string][]).map(([key, label]) => (
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
