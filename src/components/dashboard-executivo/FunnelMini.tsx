import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FunnelStage {
  etapa: string;
  quantidade: number;
  valor: number;
}

interface FunnelMiniProps {
  title: string;
  stages: FunnelStage[];
  formatValue?: (value: number) => string;
}

const stageColors = [
  'bg-primary',
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-5',
];

export function FunnelMini({ 
  title, 
  stages,
  formatValue = (v) => `R$ ${(v/1000).toFixed(0)}K`
}: FunnelMiniProps) {
  const maxQuantidade = Math.max(...stages.map(s => s.quantidade), 1);
  const totalValor = stages.reduce((acc, s) => acc + s.valor, 0);
  const totalQuantidade = stages.reduce((acc, s) => acc + s.quantidade, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {title}
          <span className="text-xs text-muted-foreground font-normal">
            {totalQuantidade} negociações | {formatValue(totalValor)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma etapa configurada
          </p>
        ) : (
          stages.map((stage, index) => {
            const widthPercent = (stage.quantidade / maxQuantidade) * 100;
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate max-w-[120px]">{stage.etapa}</span>
                  <span className="text-muted-foreground">
                    {stage.quantidade} ({formatValue(stage.valor)})
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all", stageColors[index % stageColors.length])}
                    style={{ width: `${Math.max(widthPercent, 5)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
