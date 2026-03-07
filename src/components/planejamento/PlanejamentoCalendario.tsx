import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Building2, CalendarDays, Plus, Settings, Info } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  differenceInCalendarDays,
  max as dateMax,
  min as dateMin,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';

import { usePlanejamentoGlobal, type PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { usePlanejamentoItens } from '@/hooks/usePlanejamentoItens';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { usePlanejamentoStatus } from '@/hooks/usePlanejamentoStatus';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { useGoogleCalendarEmbeds } from '@/hooks/useGoogleCalendarEmbeds';
import { useGoogleCalendarEvents, type GoogleCalendarEvent } from '@/hooks/useGoogleCalendarEvents';
import { EMPREENDIMENTO_COLORS, withAlpha } from '@/utils/empreendimentoColors';

import { CalendarioDiaDetalhe } from './CalendarioDiaDetalhe';
import { CalendarioCriarTarefaPopover } from './CalendarioCriarTarefaPopover';
import { ConfigurarGoogleCalendarDialog } from './ConfigurarGoogleCalendarDialog';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
}

interface DayDisplayItem {
  item: PlanejamentoItemWithRelations;
  isMultiDay: boolean;
  color: string;
}

export function PlanejamentoCalendario({ filters, onFiltersChange }: Props) {
  const [localEmpreendimentoId, setLocalEmpreendimentoId] = useState<string | undefined>(undefined);
  const localFilters = { ...filters, empreendimento_id: localEmpreendimentoId };
  const { itens, isLoading } = usePlanejamentoGlobal(localFilters);

  const { data: empreendimentos } = useEmpreendimentosSelect();
  const { fases } = usePlanejamentoFases(localEmpreendimentoId);
  const { statusList } = usePlanejamentoStatus();
  const { data: funcionarios } = useFuncionariosSeven();
  const { createItem, updateItem, deleteItem, duplicateItem } = usePlanejamentoItens();
  const { embeds } = useGoogleCalendarEmbeds();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createPopoverDate, setCreatePopoverDate] = useState<Date | null>(null);
  const [createEmpreendimentoId, setCreateEmpreendimentoId] = useState('');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const gcMonth = currentMonth.getMonth() + 1;
  const gcYear = currentMonth.getFullYear();
  const { data: googleEvents } = useGoogleCalendarEvents(gcMonth, gcYear);

  const responsaveis = useMemo(
    () => (funcionarios || []).map((f) => ({ id: f.id, full_name: f.full_name })),
    [funcionarios]
  );

  const empColors = useMemo(() => {
    const map = new Map<string, { color: string; nome: string }>();
    if (!itens) return map;
    const uniqueEmps = [...new Set(itens.map(i => i.empreendimento?.id).filter(Boolean))];
    uniqueEmps.forEach((id, idx) => {
      if (id) {
        const emp = itens.find(i => i.empreendimento?.id === id)?.empreendimento;
        map.set(id, {
          color: EMPREENDIMENTO_COLORS[idx % EMPREENDIMENTO_COLORS.length],
          nome: emp?.nome || 'Sem nome'
        });
      }
    });
    return map;
  }, [itens]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [currentMonth]);
  const startingDayOfWeek = monthStart.getDay();

  // Compute all items per day (single + multi-day), inline
  const itemsPorDia = useMemo(() => {
    const map = new Map<string, DayDisplayItem[]>();
    if (!itens) return map;

    itens.forEach(item => {
      if (!item.data_inicio && !item.data_fim) return;
      try {
        const inicio = item.data_inicio ? parseISO(item.data_inicio) : null;
        const fim = item.data_fim ? parseISO(item.data_fim) : null;
        const isMultiDay = !!(inicio && fim && differenceInCalendarDays(fim, inicio) > 0);
        const empColor = empColors.get(item.empreendimento?.id || '')?.color || 'hsl(var(--muted-foreground))';

        const rangeStart = inicio ? dateMax([inicio, monthStart]) : (fim && fim >= monthStart && fim <= monthEnd ? fim : null);
        const rangeEnd = fim ? dateMin([fim, monthEnd]) : (inicio && inicio >= monthStart && inicio <= monthEnd ? inicio : null);

        if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) return;

        const coveredDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
        coveredDays.forEach(day => {
          const key = format(day, 'yyyy-MM-dd');
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push({ item, isMultiDay, color: empColor });
        });
      } catch { /* ignore */ }
    });

    return map;
  }, [itens, empColors, currentMonth]);

  // Google events per day
  const googleEventsPorDia = useMemo(() => {
    const map = new Map<string, GoogleCalendarEvent[]>();
    if (!googleEvents) return map;
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayEvents = googleEvents.filter(evt => {
        const end = evt.dtend || evt.dtstart;
        return key >= evt.dtstart && key <= end;
      });
      if (dayEvents.length > 0) map.set(key, dayEvents);
    });
    return map;
  }, [googleEvents, days]);

  const itensDoDia = useMemo(() => {
    if (!itens) return [];
    return itens.filter(item => {
      if (!item.data_inicio && !item.data_fim) return false;
      try {
        const inicio = item.data_inicio ? parseISO(item.data_inicio) : null;
        const fim = item.data_fim ? parseISO(item.data_fim) : null;
        if (inicio && fim) return isWithinInterval(selectedDate, { start: inicio, end: fim });
        if (inicio && !fim) return isSameDay(selectedDate, inicio);
        if (!inicio && fim) return isSameDay(selectedDate, fim);
        return false;
      } catch { return false; }
    });
  }, [selectedDate, itens]);

  const googleEventsDoDia = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return googleEventsPorDia.get(key) || [];
  }, [selectedDate, googleEventsPorDia]);

  const totalTarefas = itens?.length || 0;
  const tarefasNoMes = useMemo(() => {
    if (!itens) return 0;
    return itens.filter(item => {
      if (!item.data_inicio && !item.data_fim) return false;
      try {
        const inicio = item.data_inicio ? parseISO(item.data_inicio) : null;
        const fim = item.data_fim ? parseISO(item.data_fim) : null;
        if (inicio && fim) return inicio <= monthEnd && fim >= monthStart;
        if (inicio) return inicio >= monthStart && inicio <= monthEnd;
        if (fim) return fim >= monthStart && fim <= monthEnd;
        return false;
      } catch { return false; }
    }).length;
  }, [itens, currentMonth]);

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
    setCreateEmpreendimentoId(localEmpreendimentoId || '');
  }, [localEmpreendimentoId]);

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
      const empId = createEmpreendimentoId || localEmpreendimentoId;
      if (!empId) return;
      createItem.mutate(
        {
          empreendimento_id: empId,
          ...data,
          responsavel_tecnico_id: data.responsavel_tecnico_id || null,
          obs: data.obs || null,
        },
        { onSuccess: () => setCreatePopoverDate(null) }
      );
    },
    [createItem, createEmpreendimentoId, localEmpreendimentoId]
  );

  const handleUpdate = useCallback(
    (id: string, updates: Record<string, unknown>) => updateItem.mutate({ id, ...updates }),
    [updateItem]
  );

  const handleDelete = useCallback(
    (id: string) => deleteItem.mutate(id),
    [deleteItem]
  );

  const handleDuplicate = useCallback(
    (id: string) => duplicateItem.mutate(id),
    [duplicateItem]
  );

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MAX_ITEMS_VISIBLE = 3;

  if (isLoading) return <Skeleton className="h-[600px]" />;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg font-semibold capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </CardTitle>
                  {totalTarefas > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {tarefasNoMes} de {totalTarefas} tarefa{totalTarefas !== 1 ? 's' : ''} neste mês
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={localEmpreendimentoId || 'all'}
                    onValueChange={(v) => setLocalEmpreendimentoId(v === 'all' ? undefined : v)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Todos os empreendimentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os empreendimentos</SelectItem>
                      {empreendimentos?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="ghost" size="icon" onClick={() => setConfigDialogOpen(true)} title="Configurar Google Calendar">
                    <Settings className="h-4 w-4" />
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleToday}>Hoje</Button>
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
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid — inline items, no overlay */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-32" />
                ))}

                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayItems = itemsPorDia.get(key) || [];
                  const dayGoogleEvents = googleEventsPorDia.get(key) || [];
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const isCreateOpen = createPopoverDate && isSameDay(day, createPopoverDate);

                  const allDisplayItems: Array<DayDisplayItem | { type: 'google'; evt: GoogleCalendarEvent }> = [
                    ...dayItems,
                    ...dayGoogleEvents.map(evt => ({ type: 'google' as const, evt })),
                  ];
                  const totalCount = allDisplayItems.length;
                  const visibleItems = allDisplayItems.slice(0, MAX_ITEMS_VISIBLE);
                  const hiddenCount = totalCount - visibleItems.length;

                  const cell = (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDate(day)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDate(day); } }}
                      className={cn(
                        'h-32 w-full rounded-lg border transition-colors relative group cursor-pointer flex flex-col',
                        'hover:bg-accent hover:border-primary/50',
                        isSelected && 'border-primary ring-2 ring-primary/20 bg-accent'
                      )}
                    >
                      {/* Fixed header row — day number centered */}
                      <div className="flex items-center justify-center relative h-7 shrink-0">
                        <span className={cn(
                          'text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full',
                          isTodayDate && 'bg-primary text-primary-foreground'
                        )}>
                          {format(day, 'd')}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); handleAddClick(day); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); handleAddClick(day); } }}
                          className="absolute right-1 top-1 h-5 w-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-opacity cursor-pointer"
                        >
                          <Plus className="h-3 w-3 text-primary" />
                        </span>
                      </div>

                      {/* Events zone — inline chips */}
                      <div className="flex-1 overflow-hidden px-1 pb-1 space-y-0.5">
                        {visibleItems.map((displayItem, idx) => {
                          if ('type' in displayItem && displayItem.type === 'google') {
                            return (
                              <div
                                key={`gc-${idx}`}
                                className="text-xs truncate px-1.5 py-0.5 rounded flex items-center gap-1 bg-muted text-muted-foreground"
                              >
                                <CalendarDays className="h-2.5 w-2.5 shrink-0" />
                                {displayItem.evt.summary}
                              </div>
                            );
                          }
                          const di = displayItem as DayDisplayItem;
                          if (di.isMultiDay) {
                            return (
                              <div
                                key={di.item.id}
                                className="text-xs truncate px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: withAlpha(di.color, 0.15),
                                  borderLeft: `3px solid ${di.color}`,
                                  color: di.color,
                                }}
                              >
                                {di.item.item}
                              </div>
                            );
                          }
                          return (
                            <div
                              key={di.item.id}
                              className="text-xs truncate px-1 py-0.5 flex items-center gap-1"
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: di.color }}
                              />
                              <span className="text-foreground truncate">{di.item.item}</span>
                            </div>
                          );
                        })}
                        {hiddenCount > 0 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{hiddenCount} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  if (isCreateOpen) {
                    return (
                      <Popover key={key} open onOpenChange={(open) => { if (!open) setCreatePopoverDate(null); }}>
                        <PopoverTrigger asChild>
                          <div>{cell}</div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="start" side="bottom">
                          {!localEmpreendimentoId && (
                            <div className="mb-3">
                              <label className="text-xs font-medium text-muted-foreground">Empreendimento *</label>
                              <Select value={createEmpreendimentoId} onValueChange={setCreateEmpreendimentoId}>
                                <SelectTrigger className="text-xs h-8 mt-1">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {empreendimentos?.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
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
                    );
                  }

                  return cell;
                })}
              </div>

              {/* Legend */}
              {(empColors.size > 0 || (embeds && embeds.length > 0)) && (
                <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t text-xs">
                  {empColors.size > 0 && (
                    <>
                      <span className="text-muted-foreground font-medium">Empreendimentos:</span>
                      {Array.from(empColors.entries()).map(([id, { color, nome }]) => (
                        <div key={id} className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                          <span className="text-muted-foreground">{nome}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {embeds && embeds.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Google Calendar</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="lg:col-span-1 space-y-4">
          <CalendarioDiaDetalhe
            selectedDate={selectedDate}
            items={itensDoDia}
            fases={fases || []}
            statusList={statusList || []}
            responsaveis={responsaveis}
            readOnly={false}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onAddClick={() => handleAddClick(selectedDate)}
          />

          {/* Google Calendar events for selected day */}
          {googleEventsDoDia.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Google Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {googleEventsDoDia.map((evt, idx) => (
                    <div key={idx} className="p-2 rounded-lg border bg-muted/30 text-sm">
                      <p className="font-medium">{evt.summary}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {evt.calendarName}
                        {evt.allDay && ' · Dia inteiro'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfigurarGoogleCalendarDialog open={configDialogOpen} onOpenChange={setConfigDialogOpen} />
    </>
  );
}
