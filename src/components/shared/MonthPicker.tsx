import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface MonthPickerProps {
  value: Date;
  onChange: (month: Date) => void;
  className?: string;
  /** Oculta o botão "Hoje". */
  hideToday?: boolean;
}

/** Seletor de mês de referência: setas + mês + ano, todos emitindo o dia 1 do mês. */
export function MonthPicker({ value, onChange, className, hideToday }: MonthPickerProps) {
  const mes = value.getMonth();
  const ano = value.getFullYear();

  // Faixa de anos ao redor do ano atual, garantindo que o valor selecionado apareça.
  const baseAno = new Date().getFullYear();
  const anos = [...new Set([...Array.from({ length: 8 }, (_, i) => baseAno - 5 + i), ano])].sort((a, b) => a - b);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Mês anterior"
        onClick={() => onChange(new Date(ano, mes - 1, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select value={String(mes)} onValueChange={(v) => onChange(new Date(ano, Number(v), 1))}>
        <SelectTrigger className="w-[132px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {MESES.map((nome, i) => <SelectItem key={nome} value={String(i)}>{nome}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={String(ano)} onValueChange={(v) => onChange(new Date(Number(v), mes, 1))}>
        <SelectTrigger className="w-[92px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Próximo mês"
        onClick={() => onChange(new Date(ano, mes + 1, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!hideToday && (
        <Button variant="ghost" size="sm" onClick={() => onChange(new Date())}>Hoje</Button>
      )}
    </div>
  );
}
