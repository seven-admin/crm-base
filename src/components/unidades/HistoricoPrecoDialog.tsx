import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnidadeHistoricoPrecos } from '@/hooks/useUnidadeHistoricoPrecos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, TrendingUp, TrendingDown, Minus, User } from 'lucide-react';

interface HistoricoPrecoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeId: string;
  unidadeNumero: string;
}

export function HistoricoPrecoDialog({
  open,
  onOpenChange,
  unidadeId,
  unidadeNumero,
}: HistoricoPrecoDialogProps) {
  const { data: historico, isLoading } = useUnidadeHistoricoPrecos(unidadeId);

  const formatCurrency = (value: number | null) =>
    value !== null
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
      : '-';

  const formatArea = (value: number | null) =>
    value !== null ? `${value.toLocaleString('pt-BR')} m²` : '-';

  const calcVariacao = (anterior: number | null, novo: number | null) => {
    if (!anterior || !novo || anterior === 0) return null;
    return ((novo - anterior) / anterior) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Histórico de Preços - {unidadeNumero}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : historico && historico.length > 0 ? (
            <div className="space-y-4 pr-4">
              {historico.map((item) => {
                const variacaoValor = calcVariacao(item.valor_anterior, item.valor_novo);
                const valorMudou = item.valor_anterior !== item.valor_novo;
                const areaMudou = item.area_anterior !== item.area_nova;

                return (
                  <div
                    key={item.id}
                    className="relative pl-6 pb-4 border-l-2 border-muted last:border-l-0"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />

                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      {/* Data e usuário */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        {item.alterado_por_nome && (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <User className="h-3 w-3" />
                            {item.alterado_por_nome}
                          </div>
                        )}
                      </div>

                      {/* Alteração de valor */}
                      {valorMudou && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Valor:</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(item.valor_anterior)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(item.valor_novo)}
                          </span>
                          {variacaoValor !== null && (
                            <Badge
                              variant="secondary"
                              className={
                                variacaoValor > 0
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : variacaoValor < 0
                                  ? 'bg-red-500/10 text-red-600'
                                  : ''
                              }
                            >
                              {variacaoValor > 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : variacaoValor < 0 ? (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              ) : (
                                <Minus className="h-3 w-3 mr-1" />
                              )}
                              {variacaoValor > 0 ? '+' : ''}
                              {variacaoValor.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Alteração de área */}
                      {areaMudou && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Área:</span>
                          <span className="text-sm text-muted-foreground">
                            {formatArea(item.area_anterior)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm font-semibold">
                            {formatArea(item.area_nova)}
                          </span>
                        </div>
                      )}

                      {/* Motivo */}
                      {item.motivo && (
                        <p className="text-xs text-muted-foreground italic">
                          "{item.motivo}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma alteração registrada para esta unidade.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
