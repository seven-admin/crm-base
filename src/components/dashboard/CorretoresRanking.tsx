import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Users } from 'lucide-react';
import { usePerformanceCorretores } from '@/hooks/useRelatorios';

export function CorretoresRanking() {
  const { data: corretores, isLoading } = usePerformanceCorretores();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking de Corretores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const maxVendas = corretores && corretores.length > 0 
    ? Math.max(...corretores.map(c => c.vendas || 0))
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Ranking de Corretores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!corretores || corretores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma venda registrada</p>
          </div>
        ) : (
          corretores.slice(0, 5).map((corretor, index) => (
            <div key={corretor.id || index} className="flex items-center gap-4">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                ${index === 0 ? 'bg-amber-500 text-white' : ''}
                ${index === 1 ? 'bg-slate-400 text-white' : ''}
                ${index === 2 ? 'bg-amber-700 text-white' : ''}
                ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
              `}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {corretor.nome || 'Corretor'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: maxVendas > 0 
                          ? `${((corretor.vendas || 0) / maxVendas) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {corretor.unidades || 0} un.
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">
                  {formatCurrency(corretor.vendas || 0)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
