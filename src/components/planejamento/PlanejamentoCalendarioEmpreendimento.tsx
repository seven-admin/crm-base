import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  addDays,
  getDay,
  lastDayOfMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { usePlanejamentoItens } from '@/hooks/usePlanejamentoItens';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { usePlanejamentoStatus } from '@/hooks/usePlanejamentoStatus';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import { CalendarioDiaCell } from './CalendarioDiaCell';
import { CalendarioDiaDetalhe } from './CalendarioDiaDetalhe';
import { CalendarioCriarTarefaPopover } from './CalendarioCriarTarefaPopover';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

interface Props {
  empreendimentoId: string;
  readOnly?: boolean;
}

export function PlanejamentoCalendarioEmpreendimento({ empreendimentoId, readOnly }: Props) {
  const { itens, isLoading, createItem, updateItem, deleteItem, duplicateItem } =
    usePlanejamentoItens({ empreendimento_id: empreendimentoId });
  const { fases } = usePlanejamentoFases();
  const { statusList } = usePlanejamentoStatus();
  const { data: funcionarios } = useFuncionariosSeven();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createPopoverDate, setCreatePopoverDate] = useState<Date | null>(null);

  const responsaveis = useMemo(
    () => (funcionarios || []).map((f) => ({ id: f.id, full_name: f.full_name })),
    [funcionarios]
  );

  // Group tasks by day
  const itensPorDia = useMemo(() => {
    const map = new Map<string, PlanejamentoItemWithRelations[]>();
    if (!itens) return map;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    days.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const dayItems = itens.filter((item) => {
        if (!item.data_inicio || !item.data_fim) return false;
        try {
          const inicio = parseISO(item.data_inicio);
          const fim = parseISO(item.data_fim);
          return isWithinInterval(day, { start: inicio, end: fim });
        } catch {
          return false;
        }
      });
      if (dayItems.length > 0) {
        map.set(key, dayItems);
      }
    });

    return map;
  }, [itens, currentMonth]);

  // Selected day items
  const itensDoDia = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return itensPorDia.get(key) || [];
  }, [selectedDate, itensPorDia]);

  // Days of month
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Trailing days to fill grid
  const trailingDays = useMemo(() => {
    const lastDay = lastDayOfMonth(currentMonth);
    const lastDayOfWeek = getDay(lastDay);
    if (lastDayOfWeek === 6) return [];
    const count = 6 - lastDayOfWeek;
    return Array.from({ length: count }, (_, i) => addDays(lastDay, i + 1));
  }, [currentMonth]);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleAddClick = useCallback((day: Date) => {
    setSelectedDate(day);
    setCreatePopoverDate(day);
  }, []);

  const handleCreateSubmit = useCallback(
    (data: {
      item: string;
      fase_id: string;
      status_id: string;
      data_inicio: string;
      data_fim: string;
      responsavel_tecnico_id?: string;
      obs?: string;
    }) => {
      createItem.mutate(
        {
          empreendimento_id: empreendimentoId,
          ...data,
          responsavel_tecnico_id: data.responsavel_tecnico_id || null,
          obs: data.obs || null,
        },
        {
          onSuccess: () => setCreatePopoverDate(null),
        }
      );
    },
    [createItem, empreendimentoId]
  );

  const handleUpdate = useCallback(
    (id: string, updates: Record<string, unknown>) => {
      updateItem.mutate({ id, ...updates });
    },
    [updateItem]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteItem.mutate(id);
    },
    [deleteItem]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateItem.mutate(id);
    },
    [duplicateItem]
  );

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (isLoading) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* Calendar Grid */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold capitalize">
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

          <CardContent className="px-0 pb-0">
            {/* Week days header */}
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2 border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="min-h-[100px] border-r border-b bg-muted/20" />
              ))}

              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayItems = itensPorDia.get(key) || [];
                const isSelected = isSameDay(day, selectedDate);
                const isCreateOpen = createPopoverDate && isSameDay(day, createPopoverDate);

                return isCreateOpen && !readOnly ? (
                  <Popover
                    key={key}
                    open
                    onOpenChange={(open) => {
                      if (!open) setCreatePopoverDate(null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <div>
                        <CalendarioDiaCell
                          day={day}
                          items={dayItems}
                          isSelected={isSelected}
                          readOnly={readOnly}
                          onSelect={setSelectedDate}
                          onAddClick={handleAddClick}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start" side="bottom">
                      <CalendarioCriarTarefaPopover
                        date={day}
                        fases={fases || []}
                        statusList={statusList || []}
                        responsaveis={responsaveis}
                        onSubmit={handleCreateSubmit}
                        onCancel={() => setCreatePopoverDate(null)}
                        isSubmitting={createItem.isPending}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <CalendarioDiaCell
                    key={key}
                    day={day}
                    items={dayItems}
                    isSelected={isSelected}
                    readOnly={readOnly}
                    onSelect={setSelectedDate}
                    onAddClick={handleAddClick}
                  />
                );
              })}

              {/* Trailing days */}
              {trailingDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                return (
                  <div
                    key={key}
                    className="h-28 w-full p-1.5 rounded-lg border border-dashed opacity-30"
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Phase legend */}
            {itens && itens.length > 0 &&
              (() => {
                const fasesMap = new Map<string, { cor: string; nome: string }>();
                itens.forEach((i) => {
                  if (i.fase && !fasesMap.has(i.fase.id)) {
                    fasesMap.set(i.fase.id, { cor: i.fase.cor, nome: i.fase.nome });
                  }
                });
                return fasesMap.size > 0 ? (
                  <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t text-xs">
                    <span className="text-muted-foreground font-medium">Fases:</span>
                    {Array.from(fasesMap.entries()).map(([id, { cor, nome }]) => (
                      <div key={id} className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: cor }} />
                        <span className="text-muted-foreground">{nome}</span>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
          </CardContent>
        </Card>
      </div>

      {/* Side panel */}
      <div className="lg:col-span-1">
        <CalendarioDiaDetalhe
          selectedDate={selectedDate}
          items={itensDoDia}
          fases={fases || []}
          statusList={statusList || []}
          responsaveis={responsaveis}
          readOnly={readOnly}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onAddClick={() => handleAddClick(selectedDate)}
        />
      </div>
    </div>
  );
}
