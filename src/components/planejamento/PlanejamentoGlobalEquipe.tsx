import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { AlertTriangle, Users, ChevronRight, Info } from 'lucide-react';
import { format, parseISO, addDays, eachWeekOfInterval, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePlanejamentoGlobal, type PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
  limiteSobrecarga?: number;
}

export function PlanejamentoGlobalEquipe({ filters, limiteSobrecarga = 5 }: Props) {
  const { itens, cargaPorResponsavel, isLoading } = usePlanejamentoGlobal(filters, limiteSobrecarga);
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null);

  // Gerar semanas para o header
  const semanas = useMemo(() => {
    const hoje = new Date();
    const inicio = addDays(hoje, -14);
    const fim = addDays(hoje, 56);
    return eachWeekOfInterval({ start: inicio, end: fim }, { weekStartsOn: 1 });
  }, []);

  // Buscar tarefas do responsável selecionado
  const tarefasDoResponsavel = useMemo(() => {
    if (!selectedResponsavel || !itens) return [];
    
    return itens.filter(item => {
      if (item.responsavel?.id === selectedResponsavel) return true;
      if (item.responsaveis?.some(r => r.user?.id === selectedResponsavel)) return true;
      return false;
    });
  }, [selectedResponsavel, itens]);

  const responsavelSelecionadoNome = cargaPorResponsavel.find(r => r.id === selectedResponsavel)?.nome;

  if (isLoading) {
    return <Skeleton className="h-[500px]" />;
  }

  // Função para determinar a cor do calor (dinâmica baseada no limite)
  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-muted/20';
    const ratio = count / limiteSobrecarga;
    if (ratio <= 0.4) return 'bg-green-500/30';      // 0-40% do limite
    if (ratio <= 0.8) return 'bg-yellow-500/40';     // 40-80% do limite
    if (ratio <= 1.2) return 'bg-orange-500/50';     // 80-120% do limite
    return 'bg-red-500/60';                          // >120% do limite
  };

  // Gerar legenda dinâmica
  const legendItems = [
    { color: 'bg-green-500/30', label: `1-${Math.floor(limiteSobrecarga * 0.4)}` },
    { color: 'bg-yellow-500/40', label: `${Math.floor(limiteSobrecarga * 0.4) + 1}-${Math.floor(limiteSobrecarga * 0.8)}` },
    { color: 'bg-orange-500/50', label: `${Math.floor(limiteSobrecarga * 0.8) + 1}-${limiteSobrecarga}` },
    { color: 'bg-red-500/60', label: `${limiteSobrecarga + 1}+` },
  ];

  return (
    <div className="space-y-6">
      {/* Resumo de alertas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cargaPorResponsavel.length}</p>
                <p className="text-xs text-muted-foreground">Responsáveis Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {cargaPorResponsavel.filter(r => r.sobrecarga).length}
                </p>
                <p className="text-xs text-muted-foreground">Com Sobrecarga</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {cargaPorResponsavel.reduce((acc, r) => acc + r.tarefasAtrasadas, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Tarefas Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapa de calor */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Carga de Trabalho por Semana</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {legendItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className={`w-4 h-4 ${item.color} rounded`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 bg-background z-10">
                    Responsável
                  </TableHead>
                  <TableHead className="w-[80px] text-center">Total</TableHead>
                  <TableHead className="w-[80px] text-center">Atrasadas</TableHead>
                  {semanas.map((semana, idx) => (
                    <TableHead 
                      key={idx} 
                      className="w-[60px] text-center text-xs"
                    >
                      {format(semana, 'dd/MM', { locale: ptBR })}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargaPorResponsavel.map(responsavel => (
                  <TableRow 
                    key={responsavel.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      responsavel.sobrecarga && "bg-red-500/5"
                    )}
                    onClick={() => setSelectedResponsavel(responsavel.id)}
                  >
                    <TableCell className="sticky left-0 bg-background z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[150px]" title={responsavel.nome}>
                          {responsavel.nome}
                        </span>
                        {responsavel.sobrecarga && (
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{responsavel.totalTarefas}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {responsavel.tarefasAtrasadas > 0 ? (
                        <Badge variant="destructive">{responsavel.tarefasAtrasadas}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {semanas.map((semana, idx) => {
                      const key = format(semana, 'yyyy-ww');
                      const count = responsavel.tarefasPorSemana[key] || 0;
                      
                      return (
                        <TableCell 
                          key={idx} 
                          className={cn(
                            "text-center",
                            getHeatColor(count)
                          )}
                        >
                          {count > 0 ? count : ''}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {cargaPorResponsavel.length === 0 && (
                  <TableRow>
                    <TableCell 
                      colSpan={3 + semanas.length} 
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhum responsável com tarefas atribuídas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog com detalhes do responsável */}
      <Dialog open={!!selectedResponsavel} onOpenChange={() => setSelectedResponsavel(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tarefas de {responsavelSelecionadoNome}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {tarefasDoResponsavel.map(item => {
              const isAtrasada = !item.status?.is_final && 
                item.data_fim && 
                parseISO(item.data_fim) < new Date();
              
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "p-3 border rounded-lg",
                    isAtrasada && "border-red-500 bg-red-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{item.item}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.empreendimento?.nome} • {item.fase?.nome}
                      </p>
                    </div>
                    <Badge 
                      style={{ backgroundColor: item.status?.cor }}
                      className="text-white"
                    >
                      {item.status?.nome}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {item.data_inicio && (
                      <span>Início: {format(parseISO(item.data_inicio), 'dd/MM/yyyy')}</span>
                    )}
                    {item.data_fim && (
                      <span className={cn(isAtrasada && "text-red-500 font-medium")}>
                        Fim: {format(parseISO(item.data_fim), 'dd/MM/yyyy')}
                        {isAtrasada && ' (Atrasada)'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {tarefasDoResponsavel.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma tarefa encontrada
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
