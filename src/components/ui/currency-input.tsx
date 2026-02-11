import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | undefined | null;
  onChange: (value: number) => void;
  showSymbol?: boolean;
  allowNegative?: boolean;
}

/**
 * Componente de input para valores monetários em Real Brasileiro (R$)
 * Formata automaticamente com separador de milhares e vírgula decimal
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, showSymbol = true, allowNegative = false, disabled, placeholder = '0,00', ...props }, ref) => {
    
    // Formata número para exibição (1234.56 -> "1.234,56")
    const formatDisplayValue = (val: number | undefined | null): string => {
      if (val === undefined || val === null || val === 0) return '';
      return val.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    };

    // Parse do input para número (remove não-dígitos, divide por 100)
    const parseInputValue = (inputValue: string): number => {
      // Remove tudo exceto dígitos (e opcionalmente sinal negativo)
      let numericValue = allowNegative 
        ? inputValue.replace(/[^\d-]/g, '')
        : inputValue.replace(/\D/g, '');
      
      if (!numericValue || numericValue === '-') return 0;
      
      return Number(numericValue) / 100;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInputValue(e.target.value);
      onChange(newValue);
    };

    return (
      <div className="relative">
        {showSymbol && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            R$
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          className={cn(
            showSymbol && 'pl-10',
            className
          )}
          value={formatDisplayValue(value)}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
