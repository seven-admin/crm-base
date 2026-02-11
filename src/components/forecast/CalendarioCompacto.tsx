import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCalendarioAtividades } from '@/hooks/useForecast';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarioCompactoProps {
  gestorId?: string;
  empreendimentoIds?: string[];
  onDayClick?: (date: Date) => void;
  selectedDate?: Date | null;
}

export function CalendarioCompacto({ gestorId, empreendimentoIds, onDayClick, selectedDate }: CalendarioCompactoProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: diasComAtividades, isLoading } = useCalendarioAtividades(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    gestorId,
    empreendimentoIds
  );

  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calcular dias vazios no início
  const startDay = monthStart.getDay();
  const emptyDays = Array.from({ length: startDay });

  const getQuantidadeByDay = (day: Date): number => {
    if (!diasComAtividades) return 0;
    const found = diasComAtividades.find((d) => d.dia === day.getDate());
    return found?.quantidade || 0;
  };

  const getIntensity = (quantidade: number): string => {
    if (quantidade === 0) return '';
    if (quantidade <= 2) return 'bg-primary/20';
    if (quantidade <= 5) return 'bg-primary/40';
    if (quantidade <= 10) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Calendário de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Calendário
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header - dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-1">
          {/* Dias vazios */}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Dias do mês */}
          {days.map((day) => {
            const quantidade = getQuantidadeByDay(day);
            const intensity = getIntensity(quantidade);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => onDayClick?.(day)}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-md text-xs relative transition-all',
                  'hover:ring-1 hover:ring-primary/50',
                  isToday(day) && 'ring-2 ring-primary font-bold',
                  isSelected && 'bg-primary text-primary-foreground ring-2 ring-primary',
                  !isSelected && intensity,
                  (quantidade > 0 || onDayClick) && 'cursor-pointer'
                )}
                title={quantidade > 0 ? `${quantidade} atividade(s)` : undefined}
              >
                <span className={cn(
                  isToday(day) && !isSelected && 'text-primary'
                )}>
                  {format(day, 'd')}
                </span>
                {quantidade > 0 && !isSelected && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <span>1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/40" />
            <span>3-5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/60" />
            <span>6-10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/80" />
            <span>10+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
