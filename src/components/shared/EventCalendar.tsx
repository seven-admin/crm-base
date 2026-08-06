import { useMemo, useState } from 'react';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay,
  isSameMonth, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  subtitle?: string;
  colorClass?: string;
  onClick?: () => void;
}

interface EventCalendarProps {
  events: CalendarEvent[];
  month: Date;
  onMonthChange: (month: Date) => void;
  loading?: boolean;
  /** Máx. de eventos exibidos por dia antes de "+N". */
  maxPerDay?: number;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function dayKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function EventCalendar({ events, month, onMonthChange, loading, maxPerDay = 3 }: EventCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = dayKey(event.date);
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    // Ordena por horário dentro do dia.
    map.forEach((list) => list.sort((a, b) => a.date.getTime() - b.date.getTime()));
    return map;
  }, [events]);

  const today = new Date();
  const selectedEvents = selectedDay ? eventsByDay.get(dayKey(selectedDay)) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold capitalize tracking-[-0.02em]">
          {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onMonthChange(new Date())}>Hoje</Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onMonthChange(subMonths(month, 1))} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsByDay.get(dayKey(day)) ?? [];
            const outside = !isSameMonth(day, month);
            const isToday = isSameDay(day, today);
            const overflow = dayEvents.length - maxPerDay;
            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'min-h-24 border-b border-r p-1.5 text-left align-top transition-colors last:border-r-0 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30',
                  outside && 'bg-muted/20 text-muted-foreground',
                  selectedDay && isSameDay(day, selectedDay) && 'ring-2 ring-inset ring-primary/40',
                )}
              >
                <span className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  isToday && 'bg-primary text-primary-foreground',
                )}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, maxPerDay).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); event.onClick?.(); }}
                      className={cn(
                        'truncate rounded px-1.5 py-0.5 text-[11px] font-medium',
                        event.colorClass ?? 'bg-primary/10 text-primary',
                        event.onClick && 'cursor-pointer hover:opacity-80',
                      )}
                      title={`${format(event.date, 'HH:mm')} · ${event.title}`}
                    >
                      {format(event.date, 'HH:mm')} {event.title}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="px-1.5 text-[11px] font-medium text-muted-foreground">+{overflow} mais</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDay && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold capitalize">
            {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((event) => (
                <li
                  key={event.id}
                  onClick={event.onClick}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-2.5',
                    event.onClick && 'cursor-pointer hover:bg-muted/50',
                  )}
                >
                  <span className={cn('mt-0.5 rounded px-1.5 py-0.5 text-xs font-semibold', event.colorClass ?? 'bg-primary/10 text-primary')}>
                    {format(event.date, 'HH:mm')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    {event.subtitle && <p className="truncate text-xs text-muted-foreground">{event.subtitle}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
