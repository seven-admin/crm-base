import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Atividade } from '@/types/atividades.types';

interface AgendaCalendarioProps {
  atividades: Atividade[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
}

export function AgendaCalendario({
  atividades,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: AgendaCalendarioProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  // Mapeia atividades por dia, considerando intervalo de datas
  const atividadesPorDia = useMemo(() => {
    const map = new Map<string, Atividade[]>();
    atividades.forEach((ativ) => {
      const inicio = parseISO(ativ.data_inicio);
      const fim = parseISO(ativ.data_fim);
      const dias = eachDayOfInterval({ start: inicio, end: fim });
      
      dias.forEach((dia) => {
        const key = format(dia, 'yyyy-MM-dd');
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(ativ);
      });
    });
    return map;
  }, [atividades]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

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

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-card rounded-lg border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

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
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayAtividades = atividadesPorDia.get(key) || [];
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const hasAtividades = dayAtividades.length > 0;
          const hasVencidas = dayAtividades.some(
            (a) => a.status === 'pendente' && new Date(a.data_fim) < new Date()
          );

          return (
            <button
              key={key}
              onClick={() => onDateSelect(day)}
              className={cn(
                'relative aspect-square p-1 rounded-lg transition-colors',
                'flex flex-col items-center justify-center',
                'hover:bg-accent',
                !isCurrentMonth && 'text-muted-foreground/50',
                isToday(day) && 'ring-1 ring-primary',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              <span className="text-sm">{format(day, 'd')}</span>
              
              {/* Indicadores de atividades */}
              {hasAtividades && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayAtividades.slice(0, 3).map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'w-1 h-1 rounded-full',
                        hasVencidas && idx === 0
                          ? 'bg-destructive'
                          : isSelected
                          ? 'bg-primary-foreground'
                          : 'bg-primary'
                      )}
                    />
                  ))}
                  {dayAtividades.length > 3 && (
                    <span className={cn(
                      'text-[8px]',
                      isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}>
                      +{dayAtividades.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
