import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ClienteTemperatura } from '@/types/clientes.types';

const TEMPERATURAS: { value: ClienteTemperatura; label: string; emoji: string; activeClass: string; inactiveClass: string }[] = [
  { value: 'frio', label: 'Frio', emoji: '❄️', activeClass: 'bg-blue-500 text-white border-blue-500', inactiveClass: 'border-blue-300 text-blue-600 hover:bg-blue-50' },
  { value: 'morno', label: 'Morno', emoji: '🌤️', activeClass: 'bg-amber-500 text-white border-amber-500', inactiveClass: 'border-amber-300 text-amber-600 hover:bg-amber-50' },
  { value: 'quente', label: 'Quente', emoji: '🔥', activeClass: 'bg-red-500 text-white border-red-500', inactiveClass: 'border-red-300 text-red-600 hover:bg-red-50' },
];

interface TemperaturaSelectorProps {
  value?: ClienteTemperatura | null;
  onValueChange: (temp: ClienteTemperatura | null) => void;
  compact?: boolean;
  disabled?: boolean;
  /** When true, shows only the selected badge (or "-") with a popover to change */
  displayMode?: boolean;
}

export function TemperaturaSelector({ value, onValueChange, compact = false, disabled = false, displayMode = false }: TemperaturaSelectorProps) {
  const [open, setOpen] = useState(false);

  // Display mode: show only selected badge or "-"
  if (displayMode) {
    const selected = TEMPERATURAS.find((t) => t.value === value);

    if (!selected) {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-1">
              {TEMPERATURAS.map((temp) => (
                <button
                  key={temp.value}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onValueChange(temp.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex flex-col items-center h-auto py-0.5 px-1.5 leading-tight border rounded-full font-medium transition-colors text-[10px]',
                    temp.inactiveClass,
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span>{temp.emoji}</span>
                  <span>{temp.label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'flex flex-col items-center h-auto py-0.5 px-1.5 leading-tight border rounded-full font-medium transition-colors text-[10px] cursor-pointer',
              selected.activeClass,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span>{selected.emoji}</span>
            <span>{selected.label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            {TEMPERATURAS.map((temp) => {
              const isActive = value === temp.value;
              return (
                <button
                  key={temp.value}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onValueChange(isActive ? null : temp.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex flex-col items-center h-auto py-0.5 px-1.5 leading-tight border rounded-full font-medium transition-colors text-[10px]',
                    isActive ? temp.activeClass : temp.inactiveClass,
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span>{temp.emoji}</span>
                  <span>{temp.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Default inline mode
  return (
    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
      {TEMPERATURAS.map((temp) => {
        const isActive = value === temp.value;
        return (
          <button
            key={temp.value}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onValueChange(isActive ? null : temp.value);
            }}
            className={cn(
              'border rounded-full font-medium transition-colors',
              compact ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
              isActive ? temp.activeClass : temp.inactiveClass,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {compact ? temp.label : `${temp.emoji} ${temp.label}`}
          </button>
        );
      })}
    </div>
  );
}
