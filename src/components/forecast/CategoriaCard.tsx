import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ATIVIDADE_TIPO_LABELS, type AtividadeTipo } from '@/types/atividades.types';
import type { CategoriaResumo } from '@/hooks/useResumoAtividadesPorCategoria';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoriaCardProps {
  nome: string;
  icon: LucideIcon;
  dados?: CategoriaResumo;
  iconColor?: string;
  bgColor?: string;
}

export function CategoriaCard({ nome, icon: Icon, dados, iconColor = 'text-primary', bgColor = 'bg-primary/10' }: CategoriaCardProps) {
  const total = dados?.total || 0;

  const tipos = dados
    ? (Object.entries(dados) as [string, number][])
        .filter(([key]) => !['total', 'abertas', 'fechadas', 'futuras', 'atrasadas'].includes(key))
        .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg shrink-0', bgColor)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
          <span className="text-sm font-semibold text-foreground uppercase tracking-wide truncate">{nome}</span>
        </div>

        {/* Lista de tipos */}
        {tipos.length > 0 ? (
          <div className="space-y-1">
            {tipos.map(([tipo, qtd]) => (
              <div key={tipo} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate">
                  {ATIVIDADE_TIPO_LABELS[tipo as AtividadeTipo] || tipo}
                </span>
                <span className="font-medium text-foreground tabular-nums ml-2">{qtd}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Nenhuma atividade</p>
        )}

        {/* Status badges */}
        {total > 0 && (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <Badge variant="info" className="justify-between text-xs px-2 py-0.5">
              <span>Abertas</span>
              <span className="font-bold ml-1">{dados?.abertas || 0}</span>
            </Badge>
            <Badge variant="success" className="justify-between text-xs px-2 py-0.5">
              <span>Fechadas</span>
              <span className="font-bold ml-1">{dados?.fechadas || 0}</span>
            </Badge>
            <Badge variant="secondary" className="justify-between text-xs px-2 py-0.5">
              <span>Futuras</span>
              <span className="font-bold ml-1">{dados?.futuras || 0}</span>
            </Badge>
            <Badge variant="destructive" className="justify-between text-xs px-2 py-0.5">
              <span>Atrasadas</span>
              <span className="font-bold ml-1">{dados?.atrasadas || 0}</span>
            </Badge>
          </div>
        )}

        {/* Footer total */}
        <div className="pt-2 border-t flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Total</span>
          <span className="text-sm font-bold text-foreground">{total}</span>
        </div>
      </CardContent>
    </Card>
  );
}
