import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AtividadeCard } from '@/components/atividades/AtividadeCard';
import type { Atividade } from '@/types/atividades.types';

interface AgendaDiaProps {
  data: Date;
  atividades: Atividade[];
  onAtividadeClick?: (atividade: Atividade) => void;
  onNovaAtividade?: () => void;
  className?: string;
}

export function AgendaDia({
  data,
  atividades,
  onAtividadeClick,
  onNovaAtividade,
  className,
}: AgendaDiaProps) {
  // Filtrar atividades que se sobrepõem ao dia selecionado
  const dataStr = format(data, 'yyyy-MM-dd');
  const atividadesDoDia = atividades.filter((ativ) => {
    const inicio = ativ.data_inicio;
    const fim = ativ.data_fim;
    return inicio <= dataStr && fim >= dataStr;
  });

  // Ordenar por título (sem hora, não há agrupamento por hora)
  const atividadesOrdenadas = [...atividadesDoDia].sort((a, b) => 
    a.titulo.localeCompare(b.titulo)
  );

  return (
    <div
      className={cn(
        'bg-card rounded-lg border h-full flex flex-col min-h-0 overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-medium capitalize text-sm">
              {format(data, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-xs text-muted-foreground">
              {atividadesOrdenadas.length} {atividadesOrdenadas.length === 1 ? 'atividade' : 'atividades'}
            </p>
          </div>
        </div>
        {onNovaAtividade && (
          <Button size="sm" onClick={onNovaAtividade}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        )}
      </div>

      {/* Lista de atividades */}
      <ScrollArea className="flex-1 min-h-0">
        {atividadesOrdenadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma atividade para este dia</p>
            {onNovaAtividade && (
              <Button variant="link" onClick={onNovaAtividade} className="mt-2">
                Agendar atividade
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {atividadesOrdenadas.map((atividade) => (
              <AtividadeCard
                key={atividade.id}
                atividade={atividade}
                compact
                onClick={() => onAtividadeClick?.(atividade)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
