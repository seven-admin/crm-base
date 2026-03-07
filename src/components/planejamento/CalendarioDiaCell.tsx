import { format, isToday, isSameDay } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

interface Props {
  day: Date;
  items: PlanejamentoItemWithRelations[];
  isSelected: boolean;
  readOnly?: boolean;
  onSelect: (day: Date) => void;
  onAddClick: (day: Date) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CalendarioDiaCell({
  day,
  items,
  isSelected,
  readOnly,
  onSelect,
  onAddClick,
}: Props) {
  const isTodayDate = isToday(day);

  return (
    <button
      onClick={() => onSelect(day)}
      className={cn(
        'h-28 w-full p-1.5 text-left rounded-lg border transition-all relative group',
        'hover:bg-accent hover:border-primary/50',
        isSelected && 'border-primary ring-2 ring-primary/20 bg-accent'
      )}
    >
      <div className="flex items-center justify-between relative z-20">
        <span
          className={cn(
            'text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full',
            isTodayDate && 'bg-primary text-primary-foreground'
          )}
        >
          {format(day, 'd')}
        </span>

        {!readOnly && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(day);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onAddClick(day); } }}
            className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-primary/20"
          >
            <Plus className="h-3 w-3" />
          </span>
        )}
      </div>

      <div className="mt-1 space-y-0.5 overflow-hidden">
        {items.slice(0, 2).map((item) => {
          const color = item.fase?.cor || '#6b7280';
          return (
            <div
              key={item.id}
              className="text-xs truncate px-1 py-0.5 rounded"
              style={{
                backgroundColor: hexToRgba(color, 0.2),
                color: color,
              }}
            >
              {item.item}
            </div>
          );
        })}
        {items.length > 2 && (
          <div className="text-xs text-muted-foreground px-1">
            +{items.length - 2} mais
          </div>
        )}
      </div>
    </button>
  );
}
