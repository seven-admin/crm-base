import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Evento } from '@/types/marketing.types';

const STATUS_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  preparacao: 'Preparação',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  planejamento: 'bg-muted text-muted-foreground',
  preparacao: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  concluido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

interface EventoCardProps {
  evento: Evento;
  tarefasConcluidas?: number;
  totalTarefas?: number;
  onClick?: () => void;
}

export function EventoCard({ evento, tarefasConcluidas = 0, totalTarefas = 0, onClick }: EventoCardProps) {
  const dataEvento = new Date(evento.data_evento);
  const diasRestantes = differenceInDays(dataEvento, new Date());
  const eventoPassou = isPast(dataEvento);
  const progresso = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer border-border/50 hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{evento.codigo}</p>
            <h3 className="font-semibold text-lg leading-tight">{evento.nome}</h3>
          </div>
          <Badge className={STATUS_COLORS[evento.status || 'planejamento']}>
            {STATUS_LABELS[evento.status || 'planejamento']}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Data e Local */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{format(dataEvento, "dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          {evento.local && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate max-w-[120px]">{evento.local}</span>
            </div>
          )}
        </div>

        {/* Dias restantes */}
        <div className="flex items-center justify-between">
          {evento.status !== 'concluido' && evento.status !== 'cancelado' && (
            <span className={`text-sm font-medium ${
              eventoPassou 
                ? 'text-destructive' 
                : diasRestantes <= 7 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-muted-foreground'
            }`}>
              {eventoPassou 
                ? 'Evento já passou' 
                : diasRestantes === 0 
                  ? 'Hoje!' 
                  : `${diasRestantes} dias restantes`
              }
            </span>
          )}
          
          {/* Empreendimento */}
          {evento.empreendimento && (
            <Badge variant="outline" className="text-xs">
              {evento.empreendimento.nome}
            </Badge>
          )}
        </div>

        {/* Progresso de tarefas */}
        {totalTarefas > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{tarefasConcluidas} de {totalTarefas} tarefas</span>
              </div>
              <span className="font-medium">{Math.round(progresso)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}

        {/* Responsável */}
        {evento.responsavel && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <Users className="h-3.5 w-3.5" />
            <span>Responsável: {evento.responsavel.full_name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
