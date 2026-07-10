import { cn } from '@/lib/utils';
import { useFunilArqoReal } from '../useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';

export function FunilArqoCard() {
  const { data: etapas = [], isLoading } = useFunilArqoReal();

  if (isLoading) {
    return <Skeleton className="h-80 rounded-2xl" />;
  }

  const maxQtd = Math.max(1, ...etapas.map((e) => e.quantidade));
  const novo = etapas[0]?.quantidade ?? 0;
  const ganho = etapas.find((e) => e.tipo === 'ganho')?.quantidade ?? 0;
  const conversaoTotal = novo > 0 ? (ganho / novo) * 100 : 0;

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Funil Arqo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Distribuição de leads por etapa</p>
        </div>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Total ativos</span>
      </div>

      {etapas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum lead cadastrado ainda.</p>
      ) : (
        <div className="space-y-3">
          {etapas.map((etapa, idx) => {
            const width = (etapa.quantidade / maxQtd) * 100;
            const prev = idx > 0 ? etapas[idx - 1].quantidade : etapa.quantidade;
            const conversao = idx > 0 && prev > 0 ? (etapa.quantidade / prev) * 100 : null;

            const barColor =
              etapa.tipo === 'ganho'
                ? 'bg-[hsl(142_71%_45%)]'
                : etapa.tipo === 'perdido'
                  ? 'bg-destructive'
                  : 'bg-primary';

            return (
              <div key={etapa.etapa} className="grid grid-cols-[140px_1fr_100px] items-center gap-3">
                <span className="text-sm font-medium text-foreground truncate">{etapa.etapa}</span>
                <div className="relative h-8 bg-secondary rounded-lg overflow-hidden">
                  <div
                    className={cn('h-full rounded-lg transition-all duration-500 flex items-center px-3', barColor)}
                    style={{ width: `${Math.max(width, 6)}%` }}
                  >
                    <span className="text-xs font-semibold text-white">{etapa.quantidade}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground text-right">
                  {conversao !== null ? `${conversao.toFixed(1)}%` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Conversão total (1ª etapa → Ganho)</span>
        <span className="font-semibold text-foreground">{conversaoTotal.toFixed(1)}%</span>
      </div>
    </div>
  );
}
