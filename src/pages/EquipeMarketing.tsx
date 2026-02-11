import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEquipeMarketing } from '@/hooks/useEquipeMarketing';
import { EquipeKPIs } from '@/components/marketing/EquipeKPIs';
import { MembroEquipeCard } from '@/components/marketing/MembroEquipeCard';
import { HistoricoEntregasTable } from '@/components/marketing/HistoricoEntregasTable';
import { cn } from '@/lib/utils';

export default function EquipeMarketing() {
  const [periodoInicio, setPeriodoInicio] = useState<Date>(startOfMonth(new Date()));
  const [periodoFim, setPeriodoFim] = useState<Date>(endOfMonth(new Date()));

  const { data, isLoading } = useEquipeMarketing({
    periodoInicio,
    periodoFim
  });

  const handlePeriodoRapido = (meses: number) => {
    const inicio = startOfMonth(subMonths(new Date(), meses));
    const fim = meses === 0 ? endOfMonth(new Date()) : endOfMonth(subMonths(new Date(), 1));
    setPeriodoInicio(inicio);
    setPeriodoFim(fim);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Equipe de Criação</h1>
              <p className="text-sm text-muted-foreground">
                Gestão de carga de trabalho e produtividade
              </p>
            </div>
          </div>

          {/* Filtros de período */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePeriodoRapido(0)}
            >
              Este mês
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePeriodoRapido(1)}
            >
              Mês anterior
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(periodoInicio, 'dd/MM', { locale: ptBR })} - {format(periodoFim, 'dd/MM/yy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: periodoInicio, to: periodoFim }}
                  onSelect={(range) => {
                    if (range?.from) setPeriodoInicio(range.from);
                    if (range?.to) setPeriodoFim(range.to);
                  }}
                  locale={ptBR}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* KPIs */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : data?.kpis ? (
          <EquipeKPIs kpis={data.kpis} />
        ) : null}

        {/* Grid de Membros */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Membros da Equipe</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : data?.membros && data.membros.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.membros.map((membro) => (
                <MembroEquipeCard key={membro.id} membro={membro} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Nenhum membro com tickets atribuídos encontrado.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Atribua responsáveis aos tickets para visualizar a equipe.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Histórico de Entregas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entregas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <HistoricoEntregasTable tickets={data?.ticketsRecentes || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
