import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Building2, CalendarDays } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { usePlanejamentoGlobal, type PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
}

// Paleta de cores distintas para empreendimentos
const EMPREENDIMENTO_COLORS = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#14b8a6', // teal-500
  '#6366f1', // indigo-500
];

// Helper para converter hex em rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function PlanejamentoCalendario({ filters, onFiltersChange }: Props) {
  const [localEmpreendimentoId, setLocalEmpreendimentoId] = useState<string | undefined>(undefined);

  // empreendimento_id é controlado localmente — não interfere nas outras abas
  const localFilters = { ...filters, empreendimento_id: localEmpreendimentoId };
  const { itens, isLoading } = usePlanejamentoGlobal(localFilters);
  const { data: empreendimentos } = useEmpreendimentosSelect();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mapear empreendimentos para cores
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

  // Agrupar tarefas por dia (tarefas ativas naquele dia)
  const itensPorDia = useMemo(() => {
    const map = new Map<string, PlanejamentoItemWithRelations[]>();
    if (!itens) return map;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayItems = itens.filter(item => {
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

  // Tarefas do dia selecionado
  const itensDoDia = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return itensPorDia.get(key) || [];
  }, [selectedDate, itensPorDia]);

  // Gerar dias do mês
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Calcular o dia da semana do primeiro dia (0 = Domingo)
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (isLoading) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
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
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          <CardContent>
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
              {/* Espaços vazios antes do primeiro dia */}
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="h-24" />
              ))}

              {/* Dias do mês */}
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayItems = itensPorDia.get(key) || [];
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const hasItems = dayItems.length > 0;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'h-24 w-full p-1 text-left rounded-lg border transition-colors relative',
                      'hover:bg-accent hover:border-primary/50',
                      isSelected && 'border-primary ring-2 ring-primary/20 bg-accent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full',
                          isTodayDate && 'bg-primary text-primary-foreground'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {hasItems && (
                        <Badge variant="secondary" className="text-xs h-5 px-1.5">
                          {dayItems.length}
                        </Badge>
                      )}
                    </div>

                    {/* Preview das tarefas */}
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {dayItems.slice(0, 2).map((item) => {
                        const empColor = empColors.get(item.empreendimento?.id || '');
                        const color = empColor?.color || '#6b7280';
                        return (
                          <div
                            key={item.id}
                            className="text-xs truncate px-1 py-0.5 rounded"
                            style={{
                              backgroundColor: hexToRgba(color, 0.2),
                              color: color,
                            }}
                          >
                            {item.item}
                          </div>
                        );
                      })}
                      {dayItems.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayItems.length - 2} mais
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legenda de empreendimentos */}
            {empColors.size > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t text-xs">
                <span className="text-muted-foreground font-medium">Empreendimentos:</span>
                {Array.from(empColors.entries()).map(([id, { color, nome }]) => (
                  <div key={id} className="flex items-center gap-1.5">
                    <div 
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-muted-foreground">{nome}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Painel de detalhes do dia */}
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {itensDoDia.length} tarefa{itensDoDia.length !== 1 ? 's' : ''} ativa{itensDoDia.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          <CardContent className="pt-0 flex-1 overflow-hidden">
            {itensDoDia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Nenhuma tarefa neste dia
                </p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Selecione outro dia no calendário
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2">
                <div className="space-y-3">
                  {itensDoDia.map((item) => {
                    const empColor = empColors.get(item.empreendimento?.id || '');
                    const color = empColor?.color || '#6b7280';
                    const isAtrasada = !item.status?.is_final && 
                      item.data_fim && parseISO(item.data_fim) < new Date();
                    
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border bg-card transition-colors hover:bg-muted/30"
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: color
                        }}
                      >
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Building2 className="h-3 w-3" />
                          {item.empreendimento?.nome}
                        </p>
                        <p className="font-medium text-sm">{item.item}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>
                            {item.data_inicio && format(parseISO(item.data_inicio), 'dd/MM')} 
                            {' - '}
                            {item.data_fim && format(parseISO(item.data_fim), 'dd/MM')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {item.status && (
                            <Badge variant="secondary" className="text-xs">
                              {item.status.nome}
                            </Badge>
                          )}
                          {isAtrasada && (
                            <Badge variant="destructive" className="text-xs">
                              Atrasada
                            </Badge>
                          )}
                          {item.fase && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: item.fase.cor, color: item.fase.cor }}
                            >
                              {item.fase.nome}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
