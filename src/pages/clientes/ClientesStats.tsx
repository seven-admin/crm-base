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
  const cards: { fase: ClienteFase | 'todos'; label: string; value: number }[] = [
    { fase: 'todos', label: 'Todos os clientes', value: stats?.total || 0 },
    ...(['prospecto', 'qualificado', 'negociando', 'comprador', 'perdido'] as ClienteFase[]).map((fase) => ({
      fase,
      label: CLIENTE_FASE_LABELS[fase],
      value: stats?.[fase] || 0,
    })),
  ];

  return (
    <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-card md:grid-cols-3 xl:grid-cols-6" aria-label="Filtrar clientes por fase">
      {cards.map(({ fase, label, value }) => (
        <button
          type="button"
          aria-pressed={selectedFase === fase}
          key={fase}
          className={cn(
            'group relative min-h-28 border-b border-r border-border/70 p-4 text-left transition-colors hover:bg-muted/50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 md:p-5',
            selectedFase === fase && 'bg-primary-soft/75'
          )}
          onClick={() => onSelectFase(fase)}
        >
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] tabular-nums">{value}</p>
          <span className={cn('absolute inset-x-4 bottom-0 h-0.5 origin-left bg-primary transition-transform', selectedFase === fase ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100')} />
        </button>
      ))}
    </div>
  );
}
