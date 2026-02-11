import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ClienteFase } from '@/types/clientes.types';
import { CLIENTE_FASE_LABELS } from '@/types/clientes.types';

type Props = {
  selectedFase: ClienteFase | 'todos';
  onSelectFase: (fase: ClienteFase | 'todos') => void;
  stats?: {
    total: number;
    prospecto: number;
    qualificado: number;
    negociando: number;
    comprador: number;
    perdido: number;
  } | null;
};

export function ClientesStats({ selectedFase, onSelectFase, stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
      <Card
        className={cn(
          'p-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20',
          selectedFase === 'todos' && 'ring-2 ring-primary'
        )}
        onClick={() => onSelectFase('todos')}
      >
        <p className="text-xs text-muted-foreground">Todos</p>
        <p className="text-2xl font-bold">{stats?.total || 0}</p>
      </Card>

      {(['prospecto', 'qualificado', 'negociando', 'comprador', 'perdido'] as ClienteFase[]).map((fase) => (
        <Card
          key={fase}
          className={cn(
            'p-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20',
            selectedFase === fase && 'ring-2 ring-primary'
          )}
          onClick={() => onSelectFase(fase)}
        >
          <p className="text-xs text-muted-foreground">{CLIENTE_FASE_LABELS[fase]}</p>
          <p className="text-2xl font-bold">{(stats as any)?.[fase] || 0}</p>
        </Card>
      ))}
    </div>
  );
}
