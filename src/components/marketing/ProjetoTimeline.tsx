import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useHistoricoProjeto } from '@/hooks/useProjetosMarketing';
import { STATUS_LABELS, STATUS_COLORS } from '@/types/marketing.types';

interface ProjetoTimelineProps {
  projetoId: string;
}

export function ProjetoTimeline({ projetoId }: ProjetoTimelineProps) {
  const { historico, isLoading } = useHistoricoProjeto(projetoId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Movimentações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historico?.map((item, index) => (
            <div key={item.id} className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[item.status_novo] }}
                />
                {index < (historico?.length || 0) - 1 && (
                  <div className="w-0.5 h-full bg-border mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  {item.status_anterior && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {STATUS_LABELS[item.status_anterior]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                    </>
                  )}
                  <Badge 
                    className="text-xs text-white"
                    style={{ backgroundColor: STATUS_COLORS[item.status_novo] }}
                  >
                    {STATUS_LABELS[item.status_novo]}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {item.user?.full_name || 'Sistema'} • {' '}
                  {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>

                {item.observacao && (
                  <p className="text-sm mt-1">{item.observacao}</p>
                )}
              </div>
            </div>
          ))}

          {(!historico || historico.length === 0) && (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma movimentação registrada
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
