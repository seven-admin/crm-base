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

  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MAX_MULTIDAY_SLOTS = 2;
  const SLOT_HEIGHT = 20;
  const DAY_HEADER_HEIGHT = 24;

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    const firstWeek: (Date | null)[] = Array.from({ length: startingDayOfWeek }, () => null);
    let currentWeek = firstWeek;
    days.forEach((day) => {
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    while (currentWeek.length < 7) currentWeek.push(null);
    result.push(currentWeek);
    return result;
  }, [days, startingDayOfWeek]);

  // Multi-day bar slots per week
  const weekMultiDaySlots = useMemo(() => {
    if (!itens) return new Map<number, { item: PlanejamentoItemWithRelations; color: string; colStart: number; colSpan: number; slot: number }[]>();
    const map = new Map<number, { item: PlanejamentoItemWithRelations; color: string; colStart: number; colSpan: number; slot: number }[]>();

    weeks.forEach((week, weekIdx) => {
      const bars: { item: PlanejamentoItemWithRelations; color: string; colStart: number; colSpan: number; slot: number }[] = [];
      const weekDates = week.map(d => d ? format(d, 'yyyy-MM-dd') : null);
      const firstDay = week.find(d => d !== null);
      const lastDay = [...week].reverse().find(d => d !== null);
      if (!firstDay || !lastDay) { map.set(weekIdx, bars); return; }

      itens.forEach(item => {
        if (!item.data_inicio || !item.data_fim) return;
        try {
          const inicio = parseISO(item.data_inicio);
          const fim = parseISO(item.data_fim);
          if (differenceInCalendarDays(fim, inicio) < 1) return;
          if (fim < firstDay || inicio > lastDay) return;

          const clampedStart = dateMax([inicio, firstDay]);
          const clampedEnd = dateMin([fim, lastDay]);
          const startKey = format(clampedStart, 'yyyy-MM-dd');
          const endKey = format(clampedEnd, 'yyyy-MM-dd');
          const colStart = weekDates.indexOf(startKey);
          const colEnd = weekDates.indexOf(endKey);
          if (colStart === -1 || colEnd === -1) return;

          const empColor = empColors.get(item.empreendimento?.id || '')?.color || 'hsl(var(--muted-foreground))';
          bars.push({ item, color: empColor, colStart, colSpan: colEnd - colStart + 1, slot: 0 });
        } catch { /* ignore */ }
      });

      bars.sort((a, b) => a.colStart - b.colStart || b.colSpan - a.colSpan);
      const slotEnds: number[] = [];
      bars.forEach(bar => {
        let assigned = -1;
        for (let s = 0; s < slotEnds.length; s++) {
          if (slotEnds[s] <= bar.colStart) { assigned = s; break; }
        }
        if (assigned === -1) { assigned = slotEnds.length; slotEnds.push(0); }
        bar.slot = assigned;
        slotEnds[assigned] = bar.colStart + bar.colSpan;
      });

      map.set(weekIdx, bars);
    });
    return map;
  }, [weeks, itens, empColors]);

  // Single-day items per day
  const singleDayItemsPorDia = useMemo(() => {
    const map = new Map<string, DayDisplayItem[]>();
    if (!itens) return map;
    itens.forEach(item => {
      if (!item.data_inicio && !item.data_fim) return;
      try {
        const inicio = item.data_inicio ? parseISO(item.data_inicio) : null;
        const fim = item.data_fim ? parseISO(item.data_fim) : null;
        const isMultiDay = !!(inicio && fim && differenceInCalendarDays(fim, inicio) > 0);
        if (isMultiDay) return;
        const empColor = empColors.get(item.empreendimento?.id || '')?.color || 'hsl(var(--muted-foreground))';
        const day = inicio || fim;
        if (!day || day < monthStart || day > monthEnd) return;
        const key = format(day, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ item, isMultiDay: false, color: empColor });
      } catch { /* ignore */ }
    });
    return map;
  }, [itens, empColors, currentMonth]);

  if (isLoading) return <Skeleton className="h-[600px]" />;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
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

            <CardContent className="px-0 pb-0">
              {/* Week days header */}
              <div className="grid grid-cols-7 border-b">
                {weekDayLabels.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2 border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar weeks */}
              {weeks.map((week, weekIdx) => {
                const bars = weekMultiDaySlots.get(weekIdx) || [];
                const visibleBars = bars.filter(b => b.slot < MAX_MULTIDAY_SLOTS);
                const hiddenBars = bars.filter(b => b.slot >= MAX_MULTIDAY_SLOTS);
                const numVisibleSlots = visibleBars.length > 0 ? Math.max(...visibleBars.map(b => b.slot)) + 1 : 0;
                const barsZoneHeight = numVisibleSlots * SLOT_HEIGHT;

                return (
                  <div key={weekIdx} className="relative">
                    {/* Multi-day bars (absolute) */}
                    {visibleBars.map((bar) => (
                      <div
                        key={`bar-${bar.item.id}-${weekIdx}`}
                        className="absolute z-10 text-[10px] font-medium text-white truncate px-1.5 flex items-center rounded-sm"
                        style={{
                          top: DAY_HEADER_HEIGHT + bar.slot * SLOT_HEIGHT + 1,
                          left: `calc(${(bar.colStart / 7) * 100}% + 2px)`,
                          width: `calc(${(bar.colSpan / 7) * 100}% - 4px)`,
                          height: SLOT_HEIGHT - 2,
                          backgroundColor: bar.color,
                        }}
                      >
                        {bar.item.item}
                      </div>
                    ))}

                    {/* Day cells grid */}
                    <div className="grid grid-cols-7">
                      {week.map((day, dayIdx) => {
                        if (!day) {
                          return <div key={`empty-${weekIdx}-${dayIdx}`} className="min-h-[100px] border-r border-b bg-muted/20" style={{ paddingTop: DAY_HEADER_HEIGHT + barsZoneHeight }} />;
                        }

                        const key = format(day, 'yyyy-MM-dd');
                        const daySingleItems = singleDayItemsPorDia.get(key) || [];
                        const dayGoogleEvents = googleEventsPorDia.get(key) || [];
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);
                        const isCreateOpen = createPopoverDate && isSameDay(day, createPopoverDate);

                        const hiddenForDay = hiddenBars.filter(b => dayIdx >= b.colStart && dayIdx < b.colStart + b.colSpan);

                        const cell = (
                          <div
                            key={key}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedDate(day)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDate(day); } }}
                            className={cn(
                              'min-h-[100px] border-r border-b transition-colors relative group cursor-pointer flex flex-col',
                              'hover:bg-accent/50',
                              isSelected && 'bg-accent',
                              dayIdx === 6 && 'border-r-0'
                            )}
                          >
                            {/* Day number header */}
                            <div className="flex items-center justify-between px-1.5 shrink-0" style={{ height: DAY_HEADER_HEIGHT }}>
                              <span className={cn(
                                'text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full',
                                isTodayDate && 'bg-primary text-primary-foreground'
                              )}>
                                {format(day, 'd')}
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); handleAddClick(day); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); handleAddClick(day); } }}
                                className="h-5 w-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-opacity cursor-pointer"
                              >
                                <Plus className="h-3 w-3 text-primary" />
                              </span>
                            </div>

                            {/* Reserved space for multi-day bars */}
                            {barsZoneHeight > 0 && <div style={{ height: barsZoneHeight }} className="shrink-0" />}

                            {/* Single-day events + Google events */}
                            <div className="flex-1 overflow-hidden px-1 pb-1 space-y-0.5">
                              {daySingleItems.slice(0, 3).map((di) => (
                                <div key={di.item.id} className="text-[10px] truncate px-0.5 flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: di.color }} />
                                  <span className="text-foreground truncate">{di.item.item}</span>
                                </div>
                              ))}
                              {dayGoogleEvents.slice(0, 2).map((evt, idx) => (
                                <div key={`gc-${idx}`} className="text-[10px] truncate px-0.5 flex items-center gap-1 text-muted-foreground">
                                  <CalendarDays className="h-2.5 w-2.5 shrink-0" />
                                  {evt.summary}
                                </div>
                              ))}
                              {(hiddenForDay.length > 0 || daySingleItems.length > 3 || dayGoogleEvents.length > 2) && (
                                <div className="text-[10px] text-muted-foreground px-0.5">
                                  +{hiddenForDay.length + Math.max(0, daySingleItems.length - 3) + Math.max(0, dayGoogleEvents.length - 2)} mais
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
                  </div>
                );
              })}

              {/* Legend */}
              {(empColors.size > 0 || (embeds && embeds.length > 0)) && (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t text-xs">
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
