import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInDays,
  addMonths,
  subMonths,
  isWithinInterval,
  isSameMonth,
  endOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePlanejamentoGlobal, type PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

// Constantes de altura
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 44;
const MONTH_HEADER_HEIGHT = 24;
const FASE_ROW_HEIGHT = 28;
const EMP_ROW_HEIGHT = 36;
const SIDEBAR_WIDTH = 280;

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
}

type ZoomLevel = 'dia' | 'semana' | 'mes';

interface ColumnInfo {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
  label: string;
}

export function PlanejamentoGlobalTimeline({ filters, onFiltersChange }: Props) {
  const { itens, isLoading } = usePlanejamentoGlobal(filters);
  const { fases } = usePlanejamentoFases();
  const { data: empreendimentos } = useEmpreendimentosSelect();
  
  const [zoom, setZoom] = useState<ZoomLevel>('semana');
  const [collapsedEmpreendimentos, setCollapsedEmpreendimentos] = useState<Set<string>>(new Set());
  
  // Refs para sincronizar scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Agrupar itens por empreendimento
  const itensPorEmpreendimento = useMemo(() => {
    if (!itens) return new Map<string, { nome: string; itens: PlanejamentoItemWithRelations[] }>();
    
    const map = new Map<string, { nome: string; itens: PlanejamentoItemWithRelations[] }>();
    
    itens.forEach(item => {
      if (!item.empreendimento) return;
      const key = item.empreendimento.id;
      
      if (!map.has(key)) {
        map.set(key, { nome: item.empreendimento.nome, itens: [] });
      }
      map.get(key)!.itens.push(item);
    });
    
    return map;
  }, [itens]);

  // Calcular range de datas
  const dateRange = useMemo(() => {
    if (!itens || itens.length === 0) {
      const hoje = new Date();
      return {
        start: subMonths(startOfMonth(hoje), 1),
        end: addMonths(endOfMonth(hoje), 3)
      };
    }

    let minDate = new Date();
    let maxDate = new Date();
    let hasValidDates = false;

    itens.forEach(item => {
      if (item.data_inicio) {
        const inicio = parseISO(item.data_inicio);
        if (!hasValidDates || inicio < minDate) minDate = inicio;
        hasValidDates = true;
      }
      if (item.data_fim) {
        const fim = parseISO(item.data_fim);
        if (!hasValidDates || fim > maxDate) maxDate = fim;
        hasValidDates = true;
      }
    });

    if (!hasValidDates) {
      const hoje = new Date();
      return {
        start: subMonths(startOfMonth(hoje), 1),
        end: addMonths(endOfMonth(hoje), 3)
      };
    }

    return {
      start: subMonths(startOfMonth(minDate), 1),
      end: addMonths(endOfMonth(maxDate), 1)
    };
  }, [itens]);

  // Gerar unidades de tempo baseado no zoom
  const timeUnits = useMemo(() => {
    if (zoom === 'dia') {
      return eachDayOfInterval(dateRange);
    } else if (zoom === 'semana') {
      return eachWeekOfInterval(dateRange, { weekStartsOn: 1 });
    } else {
      return eachMonthOfInterval(dateRange);
    }
  }, [dateRange, zoom]);

  // Calcular informações das colunas (hoje, fim de semana, labels)
  const columns = useMemo<ColumnInfo[]>(() => {
    const today = new Date();
    return timeUnits.map((unit) => {
      const isToday = zoom === 'dia' 
        ? format(unit, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        : zoom === 'semana'
          ? isWithinInterval(today, { start: unit, end: endOfWeek(unit, { weekStartsOn: 1 }) })
          : isSameMonth(unit, today);
      const isWeekend = zoom === 'dia' && (unit.getDay() === 0 || unit.getDay() === 6);
      const label = zoom === 'dia' 
        ? format(unit, 'dd', { locale: ptBR }) 
        : zoom === 'semana' 
          ? format(unit, 'dd/MM', { locale: ptBR }) 
          : format(unit, 'MMM yy', { locale: ptBR });
      
      return { date: unit, isToday, isWeekend, label };
    });
  }, [timeUnits, zoom]);

  const unitWidth = zoom === 'dia' ? 30 : zoom === 'semana' ? 80 : 120;
  const totalWidth = columns.length * unitWidth;

  // Calcular grupos de meses para header (apenas no zoom dia)
  const monthGroups = useMemo(() => {
    if (zoom !== 'dia') return [];
    
    const groups: { month: string; width: number; label: string }[] = [];
    let currentMonth = '';
    let currentWidth = 0;
    
    columns.forEach((col) => {
      const monthKey = format(col.date, 'yyyy-MM');
      if (monthKey !== currentMonth) {
        if (currentMonth) {
          groups.push({ 
            month: currentMonth, 
            width: currentWidth,
            label: format(parseISO(currentMonth + '-01'), 'MMMM yyyy', { locale: ptBR })
          });
        }
        currentMonth = monthKey;
        currentWidth = unitWidth;
      } else {
        currentWidth += unitWidth;
      }
    });
    
    // Adiciona último grupo
    if (currentMonth) {
      groups.push({ 
        month: currentMonth, 
        width: currentWidth,
        label: format(parseISO(currentMonth + '-01'), 'MMMM yyyy', { locale: ptBR })
      });
    }
    
    return groups;
  }, [columns, zoom, unitWidth]);

  const toggleEmpreendimento = (id: string) => {
    setCollapsedEmpreendimentos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calcular posição e largura da barra de tarefa
  const getBarStyle = (item: PlanejamentoItemWithRelations) => {
    if (!item.data_inicio || !item.data_fim) return null;

    try {
      const inicio = parseISO(item.data_inicio);
      const fim = parseISO(item.data_fim);
      
      const startOffset = differenceInDays(inicio, dateRange.start);
      const duration = differenceInDays(fim, inicio) + 1;

      let left: number, width: number;

      if (zoom === 'dia') {
        left = startOffset * unitWidth;
        width = duration * unitWidth;
      } else if (zoom === 'semana') {
        left = (startOffset / 7) * unitWidth;
        width = (duration / 7) * unitWidth;
      } else {
        left = (startOffset / 30) * unitWidth;
        width = (duration / 30) * unitWidth;
      }

      return {
        left: Math.max(0, left),
        width: Math.max(unitWidth / 2, width)
      };
    } catch {
      return null;
    }
  };

  // Renderiza células de grid para uma linha
  const renderGridCells = (height: number = ROW_HEIGHT) => (
    <>
      {columns.map((col, idx) => (
        <div
          key={idx}
          className={cn(
            "shrink-0 border-r border-b border-border/50",
            col.isWeekend && "bg-muted/20",
            col.isToday && "bg-primary/10"
          )}
          style={{ width: unitWidth, height }}
        />
      ))}
    </>
  );

  // Renderiza barra de tarefa com tooltip
  const renderTaskBar = (item: PlanejamentoItemWithRelations, fase?: { cor?: string }) => {
    const style = getBarStyle(item);
    if (!style) return null;

    const isAtrasada = !item.status?.is_final && 
      item.data_fim && 
      parseISO(item.data_fim) < new Date();

    return (
      <TooltipProvider key={item.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "absolute h-5 top-[6px] rounded cursor-pointer transition-opacity hover:opacity-80",
                isAtrasada && "ring-2 ring-destructive"
              )}
              style={{
                left: style.left,
                width: style.width,
                backgroundColor: fase?.cor || 'hsl(var(--primary))'
              }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium">{item.item}</p>
            <p className="text-muted-foreground text-xs mt-1">
              {item.data_inicio && format(parseISO(item.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
              {' - '}
              {item.data_fim && format(parseISO(item.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            {item.status && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {item.status.nome}
              </Badge>
            )}
            {isAtrasada && (
              <p className="text-destructive text-xs mt-1 font-medium">Atrasada</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Gerar linhas de dados (para manter sincronizado entre sidebar e timeline)
  const rows = useMemo(() => {
    const result: Array<{
      type: 'empreendimento' | 'fase' | 'tarefa';
      height: number;
      empId: string;
      faseId?: string;
      item?: PlanejamentoItemWithRelations;
      nome: string;
      count?: number;
      fase?: { cor?: string; nome?: string };
      isCollapsed?: boolean;
    }> = [];

    Array.from(itensPorEmpreendimento.entries()).forEach(([empId, { nome, itens: empItens }]) => {
      const isCollapsed = collapsedEmpreendimentos.has(empId);
      
      // Linha do empreendimento
      result.push({
        type: 'empreendimento',
        height: EMP_ROW_HEIGHT,
        empId,
        nome,
        count: empItens.length,
        isCollapsed
      });

      if (!isCollapsed) {
        // Agrupar por fase
        const itensPorFase = new Map<string, PlanejamentoItemWithRelations[]>();
        empItens.forEach(item => {
          const faseId = item.fase_id;
          if (!itensPorFase.has(faseId)) {
            itensPorFase.set(faseId, []);
          }
          itensPorFase.get(faseId)!.push(item);
        });

        Array.from(itensPorFase.entries()).forEach(([faseId, faseItens]) => {
          const fase = fases?.find(f => f.id === faseId);
          
          // Linha da fase
          result.push({
            type: 'fase',
            height: FASE_ROW_HEIGHT,
            empId,
            faseId,
            nome: fase?.nome || 'Sem fase',
            count: faseItens.length,
            fase: { cor: fase?.cor, nome: fase?.nome }
          });

          // Linhas das tarefas
          faseItens.forEach(item => {
            result.push({
              type: 'tarefa',
              height: ROW_HEIGHT,
              empId,
              faseId,
              item,
              nome: item.item,
              fase: { cor: fase?.cor }
            });
          });
        });
      }
    });

    return result;
  }, [itensPorEmpreendimento, collapsedEmpreendimentos, fases]);

  // Obter itens para empreendimento colapsado (para barras resumidas)
  const getCollapsedItems = (empId: string) => {
    return itensPorEmpreendimento.get(empId)?.itens || [];
  };

  if (isLoading) {
    return <Skeleton className="h-[500px]" />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Timeline Global de Projetos</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={filters.empreendimento_id || 'all'}
              onValueChange={(v) =>
                onFiltersChange({ ...filters, empreendimento_id: v === 'all' ? undefined : v })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os empreendimentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os empreendimentos</SelectItem>
                {empreendimentos?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(zoom === 'dia' ? 'semana' : zoom === 'semana' ? 'mes' : 'mes')}
              disabled={zoom === 'mes'}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Select value={zoom} onValueChange={(v) => setZoom(v as ZoomLevel)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Dia</SelectItem>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mês</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(zoom === 'mes' ? 'semana' : zoom === 'semana' ? 'dia' : 'dia')}
              disabled={zoom === 'dia'}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Container principal com scroll vertical unificado */}
        <div 
          ref={containerRef}
          className="border-t overflow-auto"
          style={{ height: 'calc(100vh - 320px)', minHeight: 400 }}
        >
          <div className="flex min-w-max">
            {/* Coluna fixa de títulos - sticky left */}
            <div 
              ref={sidebarRef}
              className="shrink-0 sticky left-0 bg-card z-20 border-r"
              style={{ width: SIDEBAR_WIDTH }}
            >
              {/* Header da coluna de títulos - sticky top */}
              <div 
                className="sticky top-0 z-30 border-b bg-muted/50 px-3 font-medium text-sm flex items-end pb-2"
                style={{ height: zoom === 'dia' ? HEADER_HEIGHT + MONTH_HEADER_HEIGHT : HEADER_HEIGHT }}
              >
                Empreendimento / Tarefa
              </div>
              
              {/* Linhas de títulos */}
              {rows.map((row, idx) => {
                if (row.type === 'empreendimento') {
                  return (
                    <div 
                      key={`sidebar-emp-${row.empId}`}
                      className="flex items-center gap-2 px-2 border-b hover:bg-muted/20 cursor-pointer"
                      style={{ height: row.height }}
                      onClick={() => toggleEmpreendimento(row.empId)}
                    >
                      {row.isCollapsed ? (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate flex-1" title={row.nome}>
                        {row.nome}
                      </span>
                      <Badge variant="secondary" className="shrink-0">
                        {row.count}
                      </Badge>
                    </div>
                  );
                }
                
                if (row.type === 'fase') {
                  return (
                    <div 
                      key={`sidebar-fase-${row.empId}-${row.faseId}`}
                      className="flex items-center gap-2 pl-6 pr-2 border-b bg-muted/5"
                      style={{ height: row.height }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: row.fase?.cor }}
                      />
                      <span className="text-sm font-medium truncate flex-1">
                        {row.nome}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({row.count})
                      </span>
                    </div>
                  );
                }
                
                // Tarefa
                return (
                  <div 
                    key={`sidebar-task-${row.item?.id}`}
                    className="flex items-center pl-10 pr-2 border-b hover:bg-muted/10"
                    style={{ height: row.height }}
                  >
                    <span className="text-xs truncate" title={row.nome}>
                      {row.nome}
                    </span>
                  </div>
                );
              })}

              {rows.length === 0 && (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  Nenhum item encontrado
                </div>
              )}
            </div>

            {/* Área da timeline */}
            <div 
              ref={timelineRef}
              className="flex-1"
              style={{ width: totalWidth }}
            >
              {/* Header de datas - sticky top */}
              <div className="sticky top-0 bg-muted/50 z-10">
                {/* Linha de meses (apenas no zoom dia) */}
                {zoom === 'dia' && monthGroups.length > 0 && (
                  <div className="flex border-b" style={{ height: MONTH_HEADER_HEIGHT }}>
                    {monthGroups.map((group) => (
                      <div
                        key={group.month}
                        className="shrink-0 border-r text-center text-xs font-medium flex items-center justify-center capitalize bg-muted/80"
                        style={{ width: group.width }}
                      >
                        {group.label}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Linha de dias/semanas/meses */}
                <div className="flex border-b" style={{ height: HEADER_HEIGHT }}>
                  {columns.map((col, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "shrink-0 border-r text-center text-xs flex items-center justify-center",
                        col.isToday && "bg-primary/20 font-semibold",
                        col.isWeekend && !col.isToday && "bg-muted/30"
                      )}
                      style={{ width: unitWidth }}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Linhas do grid com barras */}
              {rows.map((row, idx) => {
                if (row.type === 'empreendimento') {
                  const collapsedItems = row.isCollapsed ? getCollapsedItems(row.empId) : [];
                  return (
                    <div 
                      key={`timeline-emp-${row.empId}`}
                      className="flex relative"
                      style={{ height: row.height }}
                    >
                      {renderGridCells(row.height)}
                      {/* Barras resumidas quando colapsado */}
                      {row.isCollapsed && collapsedItems.map(item => {
                        const fase = fases?.find(f => f.id === item.fase_id);
                        const style = getBarStyle(item);
                        if (!style) return null;
                        return (
                          <div
                            key={item.id}
                            className="absolute h-2 top-[14px] rounded-full opacity-60"
                            style={{
                              left: style.left,
                              width: style.width,
                              backgroundColor: fase?.cor || 'hsl(var(--primary))'
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                }
                
                if (row.type === 'fase') {
                  return (
                    <div 
                      key={`timeline-fase-${row.empId}-${row.faseId}`}
                      className="flex relative"
                      style={{ height: row.height }}
                    >
                      {renderGridCells(row.height)}
                    </div>
                  );
                }
                
                // Tarefa
                return (
                  <div 
                    key={`timeline-task-${row.item?.id}`}
                    className="flex relative"
                    style={{ height: row.height }}
                  >
                    {renderGridCells(row.height)}
                    {row.item && renderTaskBar(row.item, row.fase)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
