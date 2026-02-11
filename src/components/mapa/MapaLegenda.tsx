import { STATUS_LEGEND } from '@/types/mapa.types';
import type { UnidadeStatus } from '@/types/empreendimentos.types';

interface MapaLegendaProps {
  statusVisiveis?: UnidadeStatus[];
}

export function MapaLegenda({ statusVisiveis }: MapaLegendaProps) {
  const legendItems = statusVisiveis?.length
    ? STATUS_LEGEND.filter(item => statusVisiveis.includes(item.status))
    : STATUS_LEGEND;

  return (
    <div className="flex flex-wrap gap-4 p-3 bg-card border border-border rounded-lg">
      {legendItems.map(({ status, label, color }) => (
        <div key={status} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-light text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
