import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, addDays, isWithinInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EventoTarefa } from '@/types/marketing.types';

interface EventoCronogramaProps {
  tarefas: EventoTarefa[];
  dataEvento: string;
}

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-muted',
  em_andamento: 'bg-blue-500',
  concluida: 'bg-green-500',
};

export function EventoCronograma({ tarefas, dataEvento }: EventoCronogramaProps) {
  const hoje = new Date();
  const dataEventoDate = new Date(dataEvento);

  // Calcular range de datas
  const { startDate, endDate, totalDays, columns } = useMemo(() => {
    if (!tarefas || tarefas.length === 0) {
      const start = addDays(hoje, -7);
      const end = addDays(dataEventoDate, 1);
      const days = differenceInDays(end, start) + 1;
      return {
        startDate: start,
        endDate: end,
        totalDays: days,
        columns: Array.from({ length: days }, (_, i) => addDays(start, i)),
      };
    }

    // Encontrar a menor data de início e maior data de fim
    const datas = tarefas.flatMap(t => [
      t.data_inicio ? new Date(t.data_inicio) : null,
      t.data_fim ? new Date(t.data_fim) : null,
    ]).filter(Boolean) as Date[];

    datas.push(hoje, dataEventoDate);

    const minDate = new Date(Math.min(...datas.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...datas.map(d => d.getTime())));

    // Adicionar margem
    const start = addDays(minDate, -2);
    const end = addDays(maxDate, 2);
    const days = differenceInDays(end, start) + 1;

    return {
      startDate: start,
      endDate: end,
      totalDays: Math.min(days, 60), // Limitar a 60 dias
      columns: Array.from({ length: Math.min(days, 60) }, (_, i) => addDays(start, i)),
    };
  }, [tarefas, hoje, dataEventoDate]);

  // Calcular posição de uma tarefa
  const getTaskPosition = (tarefa: EventoTarefa) => {
    const inicio = tarefa.data_inicio ? new Date(tarefa.data_inicio) : hoje;
    const fim = tarefa.data_fim ? new Date(tarefa.data_fim) : inicio;

    const startOffset = Math.max(0, differenceInDays(inicio, startDate));
    const duration = Math.max(1, differenceInDays(fim, inicio) + 1);

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  // Posição da linha de "hoje"
  const todayPosition = useMemo(() => {
    const offset = differenceInDays(hoje, startDate);
    if (offset < 0 || offset > totalDays) return null;
    return `${(offset / totalDays) * 100}%`;
  }, [hoje, startDate, totalDays]);

  // Posição do evento
  const eventPosition = useMemo(() => {
    const offset = differenceInDays(dataEventoDate, startDate);
    if (offset < 0 || offset > totalDays) return null;
    return `${(offset / totalDays) * 100}%`;
  }, [dataEventoDate, startDate, totalDays]);

  if (!tarefas || tarefas.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Adicione tarefas com datas para visualizar o cronograma.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cronograma</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted" />
            <span className="text-muted-foreground">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-muted-foreground">Em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-muted-foreground">Concluída</span>
          </div>
        </div>
      </div>

      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header com datas */}
          <div className="flex border-b border-border pb-2 mb-4 relative">
            {columns.map((date, i) => {
              const isToday = isSameDay(date, hoje);
              const isEventDay = isSameDay(date, dataEventoDate);
              const showLabel = i % Math.ceil(totalDays / 10) === 0 || isToday || isEventDay;

              return (
                <div
                  key={i}
                  className="flex-1 text-center text-xs"
                  style={{ minWidth: '20px' }}
                >
                  {showLabel && (
                    <span className={`
                      ${isToday ? 'text-primary font-bold' : ''}
                      ${isEventDay ? 'text-destructive font-bold' : ''}
                      ${!isToday && !isEventDay ? 'text-muted-foreground' : ''}
                    `}>
                      {format(date, 'dd/MM', { locale: ptBR })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline com tarefas */}
          <div className="relative" style={{ minHeight: `${tarefas.length * 44 + 20}px` }}>
            {/* Linha de hoje */}
            {todayPosition && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                style={{ left: todayPosition }}
              >
                <div className="absolute -top-5 -translate-x-1/2 text-xs text-primary font-medium whitespace-nowrap">
                  Hoje
                </div>
              </div>
            )}

            {/* Linha do evento */}
            {eventPosition && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
                style={{ left: eventPosition }}
              >
                <div className="absolute -top-5 -translate-x-1/2 text-xs text-destructive font-medium whitespace-nowrap">
                  Evento
                </div>
              </div>
            )}

            {/* Barras de tarefas */}
            {tarefas.map((tarefa, index) => {
              const position = getTaskPosition(tarefa);
              
              return (
                <div
                  key={tarefa.id}
                  className="absolute h-8 flex items-center"
                  style={{
                    top: `${index * 44 + 20}px`,
                    left: position.left,
                    width: position.width,
                    minWidth: '60px',
                  }}
                >
                  <div
                    className={`
                      h-full w-full rounded-md flex items-center px-2 text-xs font-medium text-white
                      ${STATUS_COLORS[tarefa.status || 'pendente']}
                      ${tarefa.status === 'pendente' ? 'text-foreground' : ''}
                    `}
                    title={tarefa.titulo}
                  >
                    <span className="truncate">{tarefa.titulo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
