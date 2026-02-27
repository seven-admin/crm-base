import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Clock } from 'lucide-react';
import { useUpdateAtividade } from '@/hooks/useAtividades';
import { cn } from '@/lib/utils';

interface AtividadeCronometroProps {
  atividadeId: string;
  cronometroInicio: string | null;
  cronometroFim: string | null;
  duracaoMinutos: number | null;
  disabled?: boolean;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function AtividadeCronometro({
  atividadeId,
  cronometroInicio,
  cronometroFim,
  duracaoMinutos,
  disabled = false,
}: AtividadeCronometroProps) {
  const updateAtividade = useUpdateAtividade();
  const [elapsed, setElapsed] = useState(0);

  const isRunning = !!cronometroInicio && !cronometroFim;
  const isFinished = !!cronometroInicio && !!cronometroFim;
  const isIdle = !cronometroInicio;

  // Calculate elapsed time when running
  useEffect(() => {
    if (!isRunning || !cronometroInicio) return;

    const calcElapsed = () => {
      const start = new Date(cronometroInicio).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((now - start) / 1000));
    };

    setElapsed(calcElapsed());
    const interval = setInterval(() => setElapsed(calcElapsed()), 1000);
    return () => clearInterval(interval);
  }, [isRunning, cronometroInicio]);

  const handleStart = useCallback(() => {
    updateAtividade.mutate({
      id: atividadeId,
      data: { cronometro_inicio: new Date().toISOString() } as any,
    });
  }, [atividadeId, updateAtividade]);

  const handleStop = useCallback(() => {
    if (!cronometroInicio) return;
    const inicio = new Date(cronometroInicio).getTime();
    const fim = Date.now();
    const duracao = Math.max(1, Math.round((fim - inicio) / 60000));

    updateAtividade.mutate({
      id: atividadeId,
      data: {
        cronometro_fim: new Date(fim).toISOString(),
        duracao_minutos: duracao,
      } as any,
    });
  }, [atividadeId, cronometroInicio, updateAtividade]);

  // Estado parado (sem início)
  if (isIdle) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground flex-1">Cronômetro</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStart}
          disabled={disabled || updateAtividade.isPending}
          className="gap-1.5"
        >
          <Play className="h-3.5 w-3.5" />
          Iniciar
        </Button>
      </div>
    );
  }

  // Estado rodando
  if (isRunning) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </div>
        <span className="font-mono text-lg font-semibold text-foreground flex-1 tabular-nums">
          {formatElapsed(elapsed)}
        </span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleStop}
          disabled={updateAtividade.isPending}
          className="gap-1.5"
        >
          <Square className="h-3.5 w-3.5" />
          Parar
        </Button>
      </div>
    );
  }

  // Estado finalizado
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Duração:</span>
      <span className="text-sm font-medium text-foreground">
        {duracaoMinutos ? formatDuration(duracaoMinutos) : '-'}
      </span>
    </div>
  );
}
