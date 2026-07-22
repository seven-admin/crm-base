import { cn } from '@/lib/utils';
import { useFunilArqoReal } from '../useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="overflow-hidden rounded-[1.75rem] border border-black/[.06] bg-[#fffdfa]">
      <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6 md:px-7 md:pt-7">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#f47418]">Pipeline</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#181613]">Funil comercial</h2>
          <p className="mt-1 text-sm text-black/45">Leads distribuídos por etapa</p>
        </div>
        <div className="rounded-2xl bg-[#f3eee8] px-4 py-3 text-right">
          <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-black/35">Conversão</span>
          <span className="mt-1 block text-xl font-semibold tracking-[-0.04em] text-[#181613] tabular-nums">{conversaoTotal.toFixed(1)}%</span>
        </div>
      </div>

      <div className="px-6 pb-6 md:px-7 md:pb-7">
      {etapas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum lead cadastrado ainda.</p>
      ) : (
        <div className="space-y-1.5 border-t border-black/[.06] pt-4">
          {etapas.map((etapa, idx) => {
            const width = (etapa.quantidade / maxQtd) * 100;
            const prev = idx > 0 ? etapas[idx - 1].quantidade : etapa.quantidade;
            const conversao = idx > 0 && prev > 0 ? (etapa.quantidade / prev) * 100 : null;

            const barColor =
              etapa.tipo === 'ganho'
                ? 'bg-success'
                : etapa.tipo === 'perdido'
                  ? 'bg-destructive'
                  : 'bg-[#ff7417]';

            return (
              <div key={etapa.etapa} className="grid grid-cols-[minmax(82px,126px)_1fr_42px] items-center gap-3 rounded-xl px-1 py-1.5 transition-colors hover:bg-black/[.025]">
                <span className="truncate text-xs font-medium text-[#332e29]">{etapa.etapa}</span>
                <div className="relative h-5 overflow-hidden rounded-full bg-[#eee9e3]">
                  <div
                    className={cn('flex h-full min-w-7 items-center rounded-full px-2 transition-all duration-500', barColor)}
                    style={{ width: `${Math.max(width, 6)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white">{etapa.quantidade}</span>
                  </div>
                </div>
                <span className="text-right text-[10px] text-black/35">
                  {conversao !== null ? `${conversao.toFixed(1)}%` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}

        <Link to="/arqo/leads" className="mt-5 flex items-center justify-between border-t border-black/[.06] pt-4 text-xs font-semibold text-black/55 transition-colors hover:text-black">
          Abrir kanban de leads <ArrowUpRight className="h-4 w-4 text-[#f47418]" />
        </Link>
      </div>
    </div>
  );
}
