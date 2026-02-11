import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Plus, Tag } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TicketsCalendario } from '@/components/marketing/TicketsCalendario';
import { useTickets } from '@/hooks/useTickets';
import { useTicketEtapas } from '@/hooks/useTicketEtapas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS, CATEGORIA_LABELS, PRIORIDADE_LABELS, PRIORIDADE_COLORS } from '@/types/marketing.types';

// Helper to get background color from hex
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function MarketingCalendario() {
  const navigate = useNavigate();
  const { tickets, isLoading } = useTickets();
  const { data: etapas } = useTicketEtapas();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Set de etapas finais
  const etapasFinaisIds = useMemo(() => 
    new Set((etapas || []).filter(e => e.is_final).map(e => e.id)),
    [etapas]
  );

  // Tickets do dia selecionado (por data_previsao)
  const ticketsDoDia = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) =>
      ticket.data_previsao && isSameDay(new Date(ticket.data_previsao), selectedDate)
    );
  }, [tickets, selectedDate]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!tickets) return { total: 0, emProducao: 0, revisao: 0, esteMes: 0 };
    
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    return {
      total: tickets.length,
      emProducao: tickets.filter((t) => t.status === 'em_producao').length,
      revisao: tickets.filter((t) => t.status === 'revisao' || t.status === 'aprovacao_cliente').length,
      esteMes: tickets.filter((t) => 
        t.data_previsao && isWithinInterval(new Date(t.data_previsao), { start: inicioMes, end: fimMes })
      ).length,
    };
  }, [tickets]);

  const handleTicketClick = (ticketId: string) => {
    navigate(`/marketing/${ticketId}`);
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
    <MainLayout title="Calendário de Tickets" subtitle="Visualize todos os tickets por data de previsão">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => navigate('/marketing')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.emProducao}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Revisão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{stats.revisao}</p>
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
            <TicketsCalendario
              tickets={tickets || []}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              etapasFinaisIds={etapasFinaisIds}
            />
          </div>

          {/* Tickets do dia */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticketsDoDia.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Nenhum ticket previsto para este dia
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ticketsDoDia.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleTicketClick(ticket.id)}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border transition-colors',
                          'hover:bg-accent hover:border-primary/50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-mono">
                              {ticket.codigo}
                            </p>
                            <p className="font-medium truncate">{ticket.titulo}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Tag className="h-3 w-3" />
                              <span className="truncate">{CATEGORIA_LABELS[ticket.categoria]}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              className="text-xs shrink-0"
                              style={{
                                backgroundColor: hexToRgba(STATUS_COLORS[ticket.status] || '#6b7280', 0.2),
                                color: STATUS_COLORS[ticket.status] || '#374151',
                              }}
                            >
                              {STATUS_LABELS[ticket.status]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                              style={{
                                borderColor: PRIORIDADE_COLORS[ticket.prioridade] || '#6b7280',
                                color: PRIORIDADE_COLORS[ticket.prioridade] || '#374151',
                              }}
                            >
                              {PRIORIDADE_LABELS[ticket.prioridade]}
                            </Badge>
                          </div>
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
