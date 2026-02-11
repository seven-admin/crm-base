import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Headphones, RefreshCw } from 'lucide-react';
import { useResumoAtendimentos } from '@/hooks/useForecast';

interface AtendimentosResumoProps {
  gestorId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  empreendimentoIds?: string[];
}

function calcTaxa(concluidos: number, total: number) {
  if (!total) return 0;
  return Math.round((concluidos / total) * 100);
}

export function AtendimentosResumo({ gestorId, dataInicio, dataFim, empreendimentoIds }: AtendimentosResumoProps) {
  const { data, isLoading } = useResumoAtendimentos(gestorId, dataInicio, dataFim, empreendimentoIds);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const novos = data?.novos ?? { total: 0, pendentes: 0, concluidos: 0 };
  const retornos = data?.retornos ?? { total: 0, pendentes: 0, concluidos: 0 };

  const taxaNovos = calcTaxa(novos.concluidos, novos.total);
  const taxaRetornos = calcTaxa(retornos.concluidos, retornos.total);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Headphones className="h-4 w-4" />
              </span>
              Novos Atendimentos
            </span>
            <Badge variant="secondary" className="text-xs">
              primeiro atendimento
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">{novos.total}</p>
              <p className="text-xs text-muted-foreground">Total no período</p>
            </div>
            <p className="text-sm text-muted-foreground">{taxaNovos}% concluído</p>
          </div>

          <Progress value={taxaNovos} />

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-muted-foreground">
              Pendentes: <span className="font-medium text-foreground">{novos.pendentes}</span>
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-muted-foreground">
              Concluídos: <span className="font-medium text-foreground">{novos.concluidos}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <span className="h-8 w-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
                <RefreshCw className="h-4 w-4" />
              </span>
              Retornos
            </span>
            <Badge variant="secondary" className="text-xs">
              retorno
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">{retornos.total}</p>
              <p className="text-xs text-muted-foreground">Total no período</p>
            </div>
            <p className="text-sm text-muted-foreground">{taxaRetornos}% concluído</p>
          </div>

          <Progress value={taxaRetornos} />

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-muted-foreground">
              Pendentes: <span className="font-medium text-foreground">{retornos.pendentes}</span>
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-muted-foreground">
              Concluídos: <span className="font-medium text-foreground">{retornos.concluidos}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
