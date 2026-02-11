import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAtividadesPorCorretor } from '@/hooks/useForecast';
import { Activity, Trophy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankingCorretoresAtivosProps {
  gestorId?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export function RankingCorretoresAtivos({ gestorId, dataInicio, dataFim }: RankingCorretoresAtivosProps) {
  const { data: corretores, isLoading } = useAtividadesPorCorretor(gestorId, dataInicio, dataFim);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Corretores Mais Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2 w-full" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const maxAtividades = Math.max(...(corretores?.map((c) => c.quantidade) || [1]));

  // Cores para ranking usando variáveis do tema
  const getRankingStyle = (index: number) => {
    if (index === 0) return 'bg-chart-3/20 text-chart-3'; // 1º lugar (ouro/amarelo)
    if (index === 1) return 'bg-muted text-muted-foreground'; // 2º lugar (prata)
    if (index === 2) return 'bg-chart-5/20 text-chart-5'; // 3º lugar (bronze/roxo)
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-primary" />
          Corretores Mais Ativos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!corretores || corretores.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma atividade registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {corretores.slice(0, 5).map((corretor, index) => {
              const widthPercent = (corretor.quantidade / maxAtividades) * 100;

              return (
                <div key={corretor.corretor_id} className="group">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      getRankingStyle(index)
                    )}>
                      {index === 0 ? <Trophy className="h-4 w-4" /> : index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {corretor.nome || 'Corretor'}
                        </span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {corretor.concluidas}
                          </span>
                          <span className="font-bold">{corretor.quantidade}</span>
                        </div>
                      </div>
                      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
