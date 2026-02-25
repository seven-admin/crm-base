import { cn } from '@/lib/utils';
import type { ClienteTemperatura } from '@/types/clientes.types';

const TEMPERATURAS: { value: ClienteTemperatura; label: string; activeClass: string; inactiveClass: string }[] = [
  { value: 'frio', label: '❄️ Frio', activeClass: 'bg-blue-500 text-white border-blue-500', inactiveClass: 'border-blue-300 text-blue-600 hover:bg-blue-50' },
  { value: 'morno', label: '🌤️ Morno', activeClass: 'bg-amber-500 text-white border-amber-500', inactiveClass: 'border-amber-300 text-amber-600 hover:bg-amber-50' },
  { value: 'quente', label: '🔥 Quente', activeClass: 'bg-red-500 text-white border-red-500', inactiveClass: 'border-red-300 text-red-600 hover:bg-red-50' },
];

interface TemperaturaSelectorProps {
  value?: ClienteTemperatura | null;
  onValueChange: (temp: ClienteTemperatura) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function TemperaturaSelector({ value, onValueChange, compact = false, disabled = false }: TemperaturaSelectorProps) {
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
              if (!isActive) onValueChange(temp.value);
            }}
            className={cn(
              'border rounded-full font-medium transition-colors',
              compact ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
              isActive ? temp.activeClass : temp.inactiveClass,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {compact ? temp.label.split(' ')[1] : temp.label}
          </button>
        );
      })}
    </div>
  );
}
