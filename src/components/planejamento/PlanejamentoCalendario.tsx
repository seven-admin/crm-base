import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Building2, CalendarDays, Plus, Settings } from 'lucide-react';
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

import { CalendarioDiaDetalhe } from './CalendarioDiaDetalhe';
import { CalendarioCriarTarefaPopover } from './CalendarioCriarTarefaPopover';
import { ConfigurarGoogleCalendarDialog } from './ConfigurarGoogleCalendarDialog';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
}

const EMPREENDIMENTO_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#14b8a6', '#6366f1',
];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  // Fetch Google Calendar events for current month
  const gcMonth = currentMonth.getMonth() + 1;
  const gcYear = currentMonth.getFullYear();
  const { data: googleEvents } = useGoogleCalendarEvents(gcMonth, gcYear);

  const responsaveis = useMemo(
    () => (funcionarios || []).map((f) => ({ id: f.id, full_name: f.full_name })),
    [funcionarios]
  );

  // Map empreendimentos to colors
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

  // Group tasks by day
  const itensPorDia = useMemo(() => {
    const map = new Map<string, PlanejamentoItemWithRelations[]>();
    if (!itens) return map;
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayItems = itens.filter(item => {
        if (!item.data_inicio && !item.data_fim) return false;
        try {
          const inicio = item.data_inicio ? parseISO(item.data_inicio) : null;
          const fim = item.data_fim ? parseISO(item.data_fim) : null;
          if (inicio && fim) return isWithinInterval(day, { start: inicio, end: fim });
          if (inicio && !fim) return isSameDay(day, inicio);
          if (!inicio && fim) return isSameDay(day, fim);
          return false;
        } catch { return false; }
      });
      if (dayItems.length > 0) map.set(key, dayItems);
    });
    return map;
  }, [itens, currentMonth]);

  // Group Google events by day
  const googleEventsPorDia = useMemo(() => {
    const map = new Map<string, GoogleCalendarEvent[]>();
    if (!googleEvents) return map;
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayEvents = googleEvents.filter(evt => {
        const start = evt.dtstart;
        const end = evt.dtend || evt.dtstart;
        return key >= start && key <= end;
      });
      if (dayEvents.length > 0) map.set(key, dayEvents);
    });
    return map;
  }, [googleEvents, currentMonth]);

  const itensDoDia = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return itensPorDia.get(key) || [];
  }, [selectedDate, itensPorDia]);

  const googleEventsDoDia = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return googleEventsPorDia.get(key) || [];
  }, [selectedDate, googleEventsPorDia]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
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

  if (isLoading) return <Skeleton className="h-[600px]" />;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg font-semibold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
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

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-24" />
                ))}

                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayItems = itensPorDia.get(key) || [];
                  const dayGoogleEvents = googleEventsPorDia.get(key) || [];
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const isCreateOpen = createPopoverDate && isSameDay(day, createPopoverDate);
                  const totalItems = dayItems.length + dayGoogleEvents.length;
                  const maxVisible = 2;

                  const cell = (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'h-24 w-full p-1 text-left rounded-lg border transition-colors relative group',
                        'hover:bg-accent hover:border-primary/50',
                        isSelected && 'border-primary ring-2 ring-primary/20 bg-accent'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full',
                          isTodayDate && 'bg-primary text-primary-foreground'
                        )}>
                          {format(day, 'd')}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddClick(day); }}
                          className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-opacity"
                        >
                          <Plus className="h-3 w-3 text-primary" />
                        </button>
                      </div>
                      <div className="mt-1 space-y-0.5 overflow-hidden">
                        {/* Internal items first */}
                        {dayItems.slice(0, maxVisible).map((item) => {
                          const empColor = empColors.get(item.empreendimento?.id || '');
                          const color = empColor?.color || '#6b7280';
                          return (
                            <div
                              key={item.id}
                              className="text-xs truncate px-1 py-0.5 rounded"
                              style={{ backgroundColor: hexToRgba(color, 0.2), color }}
                            >
                              {item.item}
                            </div>
                          );
                        })}
                        {/* Google events */}
                        {dayItems.length < maxVisible && dayGoogleEvents.slice(0, maxVisible - dayItems.length).map((evt, idx) => (
                          <div
                            key={`gc-${idx}`}
                            className="text-xs truncate px-1 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1"
                          >
                            <CalendarDays className="h-2.5 w-2.5 shrink-0" />
                            {evt.summary}
                          </div>
                        ))}
                        {totalItems > maxVisible && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{totalItems - maxVisible} mais
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
