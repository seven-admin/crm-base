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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

// Item with display metadata for a given day
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

  // Separate single-day vs multi-day items
  const { singleDayItems, multiDayItems } = useMemo(() => {
    const single = new Map<string, PlanejamentoItemWithRelations[]>();
    const multi: PlanejamentoItemWithRelations[] = [];
    if (!itens) return { singleDayItems: single, multiDayItems: multi };

    itens.forEach(item => {
      if (!item.data_inicio && !item.data_fim) return;
      try {
        const inicio = item.data_inicio ? parseISO(item.data_inicio) : null;
        const fim = item.data_fim ? parseISO(item.data_fim) : null;
        
        // Check if it spans multiple days
        if (inicio && fim && differenceInCalendarDays(fim, inicio) > 0) {
          // Check overlap with current month
          if (inicio <= monthEnd && fim >= monthStart) {
            multi.push(item);
          }
        } else {
          // Single day item
          const day = inicio || fim;
          if (day && day >= monthStart && day <= monthEnd) {
            const key = format(day, 'yyyy-MM-dd');
            if (!single.has(key)) single.set(key, []);
            single.get(key)!.push(item);
          }
        }
      } catch { /* ignore */ }
    });

    return { singleDayItems: single, multiDayItems: multi };
  }, [itens, currentMonth]);

  // Compute multi-day bar segments
  const multiDaySegments = useMemo(() => {
    const segments: MultiDaySegment[] = [];
    
    // We need to compute slot assignments to avoid overlapping bars
    // First, collect all items per row with their column ranges
    const rowItems = new Map<number, { item: PlanejamentoItemWithRelations; startCol: number; endCol: number; color: string }[]>();

    multiDayItems.forEach(item => {
      const inicio = parseISO(item.data_inicio!);
      const fim = parseISO(item.data_fim!);
      const clampStart = dateMax([inicio, monthStart]);
      const clampEnd = dateMin([fim, monthEnd]);
      const empColor = empColors.get(item.empreendimento?.id || '')?.color || 'hsl(var(--muted-foreground))';

      // Split into week segments
      let current = clampStart;
      while (current <= clampEnd) {
        const dayOfMonth = current.getDate();
        const dayIndex = dayOfMonth - 1 + startingDayOfWeek;
        const weekRow = Math.floor(dayIndex / 7);
        const startCol = dayIndex % 7;

        // Find end of this week segment
        const daysLeftInWeek = 6 - startCol;
        const daysLeftInRange = differenceInCalendarDays(clampEnd, current);
        const segmentDays = Math.min(daysLeftInWeek, daysLeftInRange);
        const endCol = startCol + segmentDays;

        const isFirst = isSameDay(current, clampStart) && clampStart >= inicio;
        const isLast = differenceInCalendarDays(clampEnd, current) <= daysLeftInWeek && clampEnd <= fim;

        if (!rowItems.has(weekRow)) rowItems.set(weekRow, []);
        rowItems.get(weekRow)!.push({ item, startCol, endCol, color: empColor });

        // Move to next week
        const nextDay = new Date(current);
        nextDay.setDate(nextDay.getDate() + segmentDays + 1);
        current = nextDay;
      }
    });

    // Now assign slot indices per row to avoid overlaps
    rowItems.forEach((items, weekRow) => {
      // Sort by startCol then by span length (wider first)
      items.sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol));
      
      const slots: { endCol: number }[] = [];
      items.forEach(({ item, startCol, endCol, color }) => {
        // Find first available slot
        let slotIndex = 0;
        for (let i = 0; i < slots.length; i++) {
          if (slots[i].endCol < startCol) {
            slotIndex = i;
            break;
          }
          slotIndex = i + 1;
        }
        if (slotIndex >= slots.length) {
          slots.push({ endCol });
        } else {
          slots[slotIndex] = { endCol };
        }

        const inicio = parseISO(item.data_inicio!);
        const fim = parseISO(item.data_fim!);
        const clampStart = dateMax([inicio, monthStart]);
        const clampEnd = dateMin([fim, monthEnd]);
        
        const isFirst = startCol === ((clampStart.getDate() - 1 + startingDayOfWeek) % 7) && clampStart >= inicio;
        const isLast = endCol === ((clampEnd.getDate() - 1 + startingDayOfWeek) % 7);

        segments.push({ item, weekRow, startCol, endCol, isFirst, isLast, color, slotIndex });
      });
    });

    return segments;
  }, [multiDayItems, empColors, monthStart, monthEnd, startingDayOfWeek]);

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
    const key = format(selectedDate, 'yyyy-MM-dd');
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

  // Task count indicator
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

  // Calculate total weeks for grid height
  const totalCells = startingDayOfWeek + days.length;
  const totalWeeks = Math.ceil(totalCells / 7);
  const CELL_HEIGHT = 112; // h-28 = 7rem = 112px
  const CELL_PADDING_TOP = 4; // p-1 = 0.25rem = 4px
  const DAY_HEADER_HEIGHT = 24; // h-6 = 1.5rem = 24px
  const BAR_HEIGHT = 18;
  const BAR_GAP = 2;
  const BAR_TOP_OFFSET = CELL_PADDING_TOP + DAY_HEADER_HEIGHT + 4; // 4px margin below header
  const MAX_MULTI_DAY_VISIBLE = 2;
  const MULTI_DAY_ZONE_HEIGHT = MAX_MULTI_DAY_VISIBLE * (BAR_HEIGHT + BAR_GAP); // always reserved

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

              {/* Calendar grid with multi-day bar overlay */}
              <div className="relative overflow-hidden">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-28" />
                  ))}

                  {days.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const daySingleItems = singleDayItems.get(key) || [];
                    const dayGoogleEvents = googleEventsPorDia.get(key) || [];
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);
                    const isCreateOpen = createPopoverDate && isSameDay(day, createPopoverDate);

                    // Count multi-day items that cover this day to reserve space
                    const dayIndex = day.getDate() - 1 + startingDayOfWeek;
                    const weekRow = Math.floor(dayIndex / 7);
                    const col = dayIndex % 7;
                    const visibleMultiDayCount = multiDaySegments.filter(
                      s => s.slotIndex < MAX_MULTI_DAY_VISIBLE && s.weekRow === weekRow && col >= s.startCol && col <= s.endCol
                    ).length;
                    const hiddenMultiDayCount = multiDaySegments.filter(
                      s => s.slotIndex >= MAX_MULTI_DAY_VISIBLE && s.weekRow === weekRow && col >= s.startCol && col <= s.endCol
                    ).length;

                    const maxSingleVisible = Math.max(0, 2 - visibleMultiDayCount);
                    const totalSingleAndGoogle = daySingleItems.length + dayGoogleEvents.length;

                    const cell = (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'h-28 w-full p-1 text-left rounded-lg border transition-colors relative group',
                          'hover:bg-accent hover:border-primary/50',
                          isSelected && 'border-primary ring-2 ring-primary/20 bg-accent'
                        )}
                      >
                      <div className="flex items-center justify-between relative z-20">
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
                            className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-opacity cursor-pointer"
                          >
                            <Plus className="h-3 w-3 text-primary" />
                          </span>
                        </div>
                        {/* Always reserve fixed space for multi-day bar zone */}
                        <div style={{ height: MULTI_DAY_ZONE_HEIGHT }} />
                        <div className="mt-1 space-y-0.5 overflow-hidden">
                          {daySingleItems.slice(0, maxSingleVisible).map((item) => {
                            const empColor = empColors.get(item.empreendimento?.id || '');
                            const color = empColor?.color || 'hsl(var(--muted-foreground))';
                            return (
                              <div
                                key={item.id}
                                className="text-xs truncate px-1 py-0.5 rounded"
                                style={{ backgroundColor: withAlpha(color, 0.2), color }}
                              >
                                {item.item}
                              </div>
                            );
                          })}
                          {daySingleItems.length < maxSingleVisible && dayGoogleEvents.slice(0, maxSingleVisible - daySingleItems.length).map((evt, idx) => (
                            <div
                              key={`gc-${idx}`}
                              className="text-xs truncate px-1 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1"
                            >
                              <CalendarDays className="h-2.5 w-2.5 shrink-0" />
                              {evt.summary}
                            </div>
                          ))}
                          {(totalSingleAndGoogle + visibleMultiDayCount + hiddenMultiDayCount) > 2 && (
                            <div className="text-xs text-muted-foreground px-1">
                              +{Math.max(0, totalSingleAndGoogle - maxSingleVisible) + hiddenMultiDayCount} mais
                            </div>
                          )}
                        </div>
                      </button>
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

                {/* Multi-day bars overlay */}
                <TooltipProvider delayDuration={200}>
                  <div className="absolute inset-0 pointer-events-none" style={{ margin: '0 0' }}>
                    {multiDaySegments.filter(seg => seg.slotIndex < MAX_MULTI_DAY_VISIBLE).map((seg, idx) => {
                      // Calculate position based on grid
                      // Each cell is 1/7 of width, gap is 4px (gap-1)
                      const gapPx = 4;
                      const leftPercent = (seg.startCol / 7) * 100;
                      const widthPercent = ((seg.endCol - seg.startCol + 1) / 7) * 100;
                      const topPx = seg.weekRow * (CELL_HEIGHT + gapPx) + BAR_TOP_OFFSET + seg.slotIndex * (BAR_HEIGHT + BAR_GAP);

                      // Account for empty cells at the start
                      // The empty cells are included in the grid, so startCol already accounts for them on row 0

                      return (
                        <Tooltip key={idx}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute pointer-events-auto cursor-pointer transition-opacity hover:opacity-90"
                              style={{
                                left: `calc(${leftPercent}% + ${gapPx / 2}px)`,
                                width: `calc(${widthPercent}% - ${gapPx}px)`,
                                top: `${topPx}px`,
                                height: `${BAR_HEIGHT}px`,
                                backgroundColor: withAlpha(seg.color, 0.25),
                                borderLeft: seg.isFirst ? `3px solid ${seg.color}` : undefined,
                                borderRight: seg.isLast ? `3px solid ${seg.color}` : undefined,
                                borderRadius: `${seg.isFirst ? 4 : 0}px ${seg.isLast ? 4 : 0}px ${seg.isLast ? 4 : 0}px ${seg.isFirst ? 4 : 0}px`,
                              }}
                              onClick={() => {
                                const inicio = seg.item.data_inicio ? parseISO(seg.item.data_inicio) : new Date();
                                setSelectedDate(inicio);
                              }}
                            >
                              {seg.isFirst && (
                                <span
                                  className="text-xs font-medium truncate px-1.5 leading-[18px] block"
                                  style={{ color: seg.color }}
                                >
                                  {seg.item.item}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{seg.item.item}</p>
                            <p className="text-xs text-muted-foreground">
                              {seg.item.data_inicio && format(parseISO(seg.item.data_inicio), 'dd/MM')}
                              {' → '}
                              {seg.item.data_fim && format(parseISO(seg.item.data_fim), 'dd/MM')}
                            </p>
                            {seg.item.empreendimento && (
                              <p className="text-xs text-muted-foreground">{seg.item.empreendimento.nome}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
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
