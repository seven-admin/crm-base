import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, MapPin, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventosCalendario as CalendarioComponent } from '@/components/eventos/EventosCalendario';
import { useEventos } from '@/hooks/useEventos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  planejamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  em_andamento: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  concluido: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function EventosCalendarioPage() {
  const navigate = useNavigate();
  const { eventos, isLoading } = useEventos();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Eventos do dia selecionado
  const eventosDoDia = useMemo(() => {
    if (!eventos) return [];
    return eventos.filter((evento) =>
      isSameDay(new Date(evento.data_evento), selectedDate)
    );
  }, [eventos, selectedDate]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!eventos) return { total: 0, planejamento: 0, emAndamento: 0, esteMes: 0 };
    
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    return {
      total: eventos.length,
      planejamento: eventos.filter((e) => e.status === 'planejamento').length,
      emAndamento: eventos.filter((e) => e.status === 'em_andamento').length,
      esteMes: eventos.filter((e) => 
        isWithinInterval(new Date(e.data_evento), { start: inicioMes, end: fimMes })
      ).length,
    };
  }, [eventos]);

  const handleEventoClick = (eventoId: string) => {
    navigate(`/eventos/${eventoId}`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Calendário de Eventos" subtitle="Visualize todos os eventos no formato de calendário">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => navigate('/eventos')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Planejamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.planejamento}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.emAndamento}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{stats.esteMes}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-2">
            <CalendarioComponent
              eventos={eventos || []}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Eventos do dia */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventosDoDia.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Nenhum evento neste dia
                  </p>
                ) : (
                  <div className="space-y-3">
                    {eventosDoDia.map((evento) => (
                      <button
                        key={evento.id}
                        onClick={() => handleEventoClick(evento.id)}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border transition-colors',
                          'hover:bg-accent hover:border-primary/50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-mono">
                              {evento.codigo}
                            </p>
                            <p className="font-medium truncate">{evento.nome}</p>
                            {evento.local && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{evento.local}</span>
                              </div>
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs shrink-0',
                              STATUS_COLORS[evento.status || 'planejamento']
                            )}
                          >
                            {STATUS_LABELS[evento.status || 'planejamento']}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
