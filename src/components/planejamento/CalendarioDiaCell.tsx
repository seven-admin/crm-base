import { format, isToday } from 'date-fns';
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
  const MAX_VISIBLE = 3;
  const visibleItems = items.slice(0, MAX_VISIBLE);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(day)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(day); } }}
      className={cn(
        'h-32 w-full rounded-lg border transition-colors relative group cursor-pointer flex flex-col',
        'hover:bg-accent hover:border-primary/50',
        isSelected && 'border-primary ring-2 ring-primary/20 bg-accent'
      )}
    >
      {/* Fixed header — day number centered */}
      <div className="flex items-center justify-center relative h-7 shrink-0">
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
            className="absolute right-1 top-1 h-5 w-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-opacity cursor-pointer"
          >
            <Plus className="h-3 w-3 text-primary" />
          </span>
        )}
      </div>

      {/* Events zone — inline chips */}
      <div className="flex-1 overflow-hidden px-1 pb-1 space-y-0.5">
        {visibleItems.map((item) => {
          const color = item.fase?.cor || '#6b7280';
          return (
            <div
              key={item.id}
              className="text-xs truncate px-1.5 py-0.5 rounded flex items-center gap-1"
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="truncate" style={{ color }}>
                {item.item}
              </span>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <div className="text-xs text-muted-foreground px-1">
            +{hiddenCount} mais
          </div>
        )}
      </div>
    </div>
  );
}
