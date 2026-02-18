import { useMemo, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, CalendarDays, AlertTriangle } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, differenceInDays, isWithinInterval, isBefore, isAfter, addDays, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePlanejamentoItens } from '@/hooks/usePlanejamentoItens';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';
import { Skeleton } from '@/components/ui/skeleton';
import { TarefaDetalheDialog } from './TarefaDetalheDialog';

interface Props {
  empreendimentoId: string;
  readOnly?: boolean;
}

type ZoomLevel = 'day' | 'week' | 'month';

const CELL_WIDTHS: Record<ZoomLevel, number> = {
  day: 32,
  week: 80,
  month: 120
};

const DAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 60;
const FASE_ROW_HEIGHT = 32;

export function PlanejamentoTimeline({ empreendimentoId, readOnly = false }: Props) {
  const { itens, isLoading } = usePlanejamentoItens({ empreendimento_id: empreendimentoId });
  const { fases, isLoading: loadingFases } = usePlanejamentoFases();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<PlanejamentoItemWithRelations | null>(null);
  const [detalheOpen, setDetalheOpen] = useState(false);

  const handleItemClick = (item: PlanejamentoItemWithRelations) => {
    setSelectedItem(item);
    setDetalheOpen(true);
  };

  // Calcular range de datas baseado nos itens
  const dateRange = useMemo(() => {
    if (!itens || itens.length === 0) {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(addMonths(currentDate, 2));
      return { start, end };
    }

    const datesWithData = itens.filter(i => i.data_inicio || i.data_fim);
    if (datesWithData.length === 0) {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(addMonths(currentDate, 2));
      return { start, end };
    }

    let minDate = new Date();
    let maxDate = new Date();

    datesWithData.forEach(item => {
      if (item.data_inicio) {
        const d = parseISO(item.data_inicio);
        if (isBefore(d, minDate)) minDate = d;
      }
      if (item.data_fim) {
        const d = parseISO(item.data_fim);
        if (isAfter(d, maxDate)) maxDate = d;
      }
    });

    // Adicionar buffer
    return {
      start: startOfMonth(subMonths(minDate, 1)),
      end: endOfMonth(addMonths(maxDate, 1))
    };
  }, [itens, currentDate]);

  // Gerar colunas baseado no zoom
  const columns = useMemo(() => {
    if (zoom === 'day') {
      return eachDayOfInterval({ start: dateRange.start, end: dateRange.end }).map(date => ({
        date,
        label: format(date, 'd', { locale: ptBR }),
        sublabel: DAY_INITIALS[date.getDay()],
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      }));
    }
    
    if (zoom === 'week') {
      return eachWeekOfInterval({ start: dateRange.start, end: dateRange.end }, { weekStartsOn: 1 }).map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        return {
          date: weekStart,
          label: `${format(weekStart, 'd', { locale: ptBR })}-${format(weekEnd, 'd', { locale: ptBR })}`,
          sublabel: format(weekStart, 'MMM', { locale: ptBR }),
          isWeekend: false,
          isToday: isWithinInterval(new Date(), { start: weekStart, end: weekEnd })
        };
      });
    }

    // Month
    const months: { date: Date; label: string; sublabel: string; isWeekend: boolean; isToday: boolean }[] = [];
    let current = startOfMonth(dateRange.start);
    while (isBefore(current, dateRange.end)) {
      months.push({
        date: current,
        label: format(current, 'MMMM', { locale: ptBR }),
        sublabel: format(current, 'yyyy'),
        isWeekend: false,
        isToday: format(current, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
      });
      current = addMonths(current, 1);
    }
    return months;
  }, [zoom, dateRange]);

  // Agrupar itens por fase
  const itensByFase = useMemo(() => {
    if (!itens || !fases) return new Map<string, PlanejamentoItemWithRelations[]>();
    
    const grouped = new Map<string, PlanejamentoItemWithRelations[]>();
    fases.forEach(fase => {
      const faseItens = itens
        .filter(item => item.fase_id === fase.id && (item.data_inicio || item.data_fim))
        .sort((a, b) => {
          const dateA = a.data_inicio ? parseISO(a.data_inicio) : new Date();
          const dateB = b.data_inicio ? parseISO(b.data_inicio) : new Date();
          return dateA.getTime() - dateB.getTime();
        });
      if (faseItens.length > 0) {
        grouped.set(fase.id, faseItens);
      }
    });
    return grouped;
  }, [itens, fases]);

  // Calcular posição de um item na timeline
  const getItemPosition = (item: PlanejamentoItemWithRelations) => {
    if (!item.data_inicio && !item.data_fim) return null;

    const cellWidth = CELL_WIDTHS[zoom];
    const start = item.data_inicio ? parseISO(item.data_inicio) : parseISO(item.data_fim!);
    const end = item.data_fim ? parseISO(item.data_fim) : parseISO(item.data_inicio!);

    let startCol = 0;
    let endCol = 0;

    if (zoom === 'day') {
      startCol = differenceInDays(start, dateRange.start);
      endCol = differenceInDays(end, dateRange.start);
    } else if (zoom === 'week') {
      const weeks = eachWeekOfInterval({ start: dateRange.start, end: dateRange.end }, { weekStartsOn: 1 });
      startCol = weeks.findIndex(w => isWithinInterval(start, { start: w, end: addDays(w, 6) }));
      endCol = weeks.findIndex(w => isWithinInterval(end, { start: w, end: addDays(w, 6) }));
      if (startCol === -1) startCol = 0;
      if (endCol === -1) endCol = weeks.length - 1;
    } else {
      let idx = 0;
      let current = startOfMonth(dateRange.start);
      while (isBefore(current, start)) {
        current = addMonths(current, 1);
        idx++;
      }
      startCol = Math.max(0, idx - 1);
      
      idx = 0;
      current = startOfMonth(dateRange.start);
      while (isBefore(current, end)) {
        current = addMonths(current, 1);
        idx++;
      }
      endCol = idx;
    }

    const left = startCol * cellWidth;
    const width = Math.max((endCol - startCol + 1) * cellWidth - 4, cellWidth - 4);
    const isOverdue = item.data_fim && isBefore(parseISO(item.data_fim), new Date()) && !item.status?.is_final;

    return { left, width, isOverdue };
  };

  const handlePrev = () => {
    if (zoom === 'month') {
      setCurrentDate(subMonths(currentDate, 6));
    } else if (zoom === 'week') {
      setCurrentDate(subMonths(currentDate, 2));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (zoom === 'month') {
      setCurrentDate(addMonths(currentDate, 6));
    } else if (zoom === 'week') {
      setCurrentDate(addMonths(currentDate, 2));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleZoomIn = () => {
    if (zoom === 'month') setZoom('week');
    else if (zoom === 'week') setZoom('day');
  };

  const handleZoomOut = () => {
    if (zoom === 'day') setZoom('week');
    else if (zoom === 'week') setZoom('month');
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    // Scroll to today
    if (scrollRef.current) {
      const todayIdx = columns.findIndex(c => c.isToday);
      if (todayIdx > -1) {
        const cellWidth = CELL_WIDTHS[zoom];
        scrollRef.current.scrollLeft = todayIdx * cellWidth - 200;
      }
    }
  };

  // Itens sem data
  const itensSemData = useMemo(() => {
    return itens?.filter(item => !item.data_inicio && !item.data_fim) || [];
  }, [itens]);

  if (isLoading || loadingFases) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const cellWidth = CELL_WIDTHS[zoom];
  const totalWidth = columns.length * cellWidth;

  // Calcular altura total
  let totalRows = 0;
  fases?.forEach(fase => {
    if (itensByFase.has(fase.id)) {
      totalRows += 1 + (itensByFase.get(fase.id)?.length || 0);
    }
  });

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {format(dateRange.start, 'MMM yyyy', { locale: ptBR })} - {format(dateRange.end, 'MMM yyyy', { locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Zoom:</span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleZoomOut}
            disabled={zoom === 'month'}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Badge variant="secondary" className="min-w-[60px] justify-center">
            {zoom === 'day' ? 'Dia' : zoom === 'week' ? 'Semana' : 'Mês'}
          </Badge>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleZoomIn}
            disabled={zoom === 'day'}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <Card className="overflow-hidden">
        {/* Container com scroll vertical + horizontal integrados */}
        <div className="overflow-auto max-h-[600px]" ref={scrollRef}>
          <div className="flex" style={{ minWidth: `${200 + totalWidth}px` }}>
            {/* Coluna fixa de fases/itens - sticky left */}
            <div className="min-w-[200px] w-[200px] flex-shrink-0 border-r bg-card sticky left-0 z-20">
              {/* Header */}
              <div 
                className="border-b bg-muted/50 flex items-center px-3 font-medium text-sm sticky top-0 z-30"
                style={{ height: HEADER_HEIGHT }}
              >
                Tarefas
              </div>
              
              {/* Fases e itens */}
              {fases?.map(fase => {
                const faseItens = itensByFase.get(fase.id);
                if (!faseItens || faseItens.length === 0) return null;

                return (
                  <div key={fase.id}>
                    {/* Fase */}
                    <div 
                      className="border-b bg-muted/30 flex items-center gap-2 px-3 font-medium text-sm"
                      style={{ height: FASE_ROW_HEIGHT }}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fase.cor }} />
                      <span className="truncate">{fase.nome}</span>
                    </div>

                    {/* Itens */}
                    {faseItens.map(item => (
                      <div 
                        key={item.id}
                        className="border-b flex items-center px-3 text-sm hover:bg-muted/20 cursor-pointer"
                        style={{ height: ROW_HEIGHT }}
                        title={item.item}
                        onClick={() => handleItemClick(item)}
                      >
                        <span className="truncate">{item.item}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Área de datas (sem scroll próprio - usa o container pai) */}
            <div style={{ width: totalWidth, flexShrink: 0 }}>
              {/* Header de datas - sticky top */}
              <div 
                className="flex border-b bg-muted/50 sticky top-0 z-10"
                style={{ height: HEADER_HEIGHT }}
              >
                {columns.map((col, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col items-center justify-center border-r text-xs",
                      col.isWeekend && "bg-muted/30",
                      col.isToday && "bg-primary/10"
                    )}
                    style={{ width: cellWidth }}
                  >
                    <span className="font-medium">{col.label}</span>
                    <span className="text-muted-foreground text-[10px]">{col.sublabel}</span>
                  </div>
                ))}
              </div>

              {/* Grid + Barras */}
              {fases?.map(fase => {
                const faseItens = itensByFase.get(fase.id);
                if (!faseItens || faseItens.length === 0) return null;

                return (
                  <div key={fase.id}>
                    {/* Linha da fase */}
                    <div 
                      className="flex border-b bg-muted/30"
                      style={{ height: FASE_ROW_HEIGHT }}
                    >
                      {columns.map((col, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "border-r",
                            col.isWeekend && "bg-muted/20",
                            col.isToday && "bg-primary/5"
                          )}
                          style={{ width: cellWidth }}
                        />
                      ))}
                    </div>

                    {/* Linhas dos itens */}
                    {faseItens.map(item => {
                      const pos = getItemPosition(item);

                      return (
                        <div 
                          key={item.id}
                          className="flex border-b relative"
                          style={{ height: ROW_HEIGHT }}
                        >
                          {/* Grid columns */}
                          {columns.map((col, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "border-r",
                                col.isWeekend && "bg-muted/10",
                                col.isToday && "bg-primary/5"
                              )}
                              style={{ width: cellWidth }}
                            />
                          ))}

                          {/* Barra do item */}
                          {pos && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      "absolute top-1 h-[calc(100%-8px)] rounded-md cursor-pointer transition-all hover:brightness-110",
                                      pos.isOverdue ? "bg-destructive/80" : ""
                                    )}
                                    style={{
                                      left: pos.left + 2,
                                      width: pos.width,
                                      backgroundColor: pos.isOverdue ? undefined : (item.status?.cor || fase.cor),
                                    }}
                                    onClick={() => handleItemClick(item)}
                                  >
                                    <div className="flex items-center gap-1 px-2 h-full text-xs text-white font-medium truncate">
                                      {pos.isOverdue && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                                      <span className="truncate">{item.item}</span>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm">
                                    <p className="font-medium">{item.item}</p>
                                    <p className="text-muted-foreground">
                                      {item.data_inicio && format(parseISO(item.data_inicio), 'dd/MM/yyyy')}
                                      {item.data_inicio && item.data_fim && ' - '}
                                      {item.data_fim && format(parseISO(item.data_fim), 'dd/MM/yyyy')}
                                    </p>
                                    <p className="text-muted-foreground">{item.status?.nome}</p>
                                    {item.responsavel && (
                                      <p className="text-muted-foreground">Resp: {item.responsavel.full_name}</p>
                                    )}
                                    {pos.isOverdue && (
                                      <p className="text-destructive font-medium">⚠ Atrasado</p>
                                    )}
                                    <p className="text-xs text-primary mt-1">Clique para detalhes</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Itens sem data */}
      {itensSemData.length > 0 && (
        <Card className="border-dashed border-warning/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-warning mb-3">
              <CalendarDays className="h-4 w-4" />
              <span className="font-medium text-sm">
                {itensSemData.length} {itensSemData.length === 1 ? 'tarefa' : 'tarefas'} sem datas definidas
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {itensSemData.slice(0, 10).map(item => (
                <Badge key={item.id} variant="outline" className="text-xs">
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: item.fase?.cor }}
                  />
                  {item.item}
                </Badge>
              ))}
              {itensSemData.length > 10 && (
                <Badge variant="secondary" className="text-xs">
                  +{itensSemData.length - 10} mais
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalhes */}
      <TarefaDetalheDialog
        open={detalheOpen}
        onOpenChange={setDetalheOpen}
        item={selectedItem}
      />
    </div>
  );
}
