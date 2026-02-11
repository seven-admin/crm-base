import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, UserX, Calendar } from 'lucide-react';
import { usePlanejamentoItens } from '@/hooks/usePlanejamentoItens';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { usePlanejamentoStatus } from '@/hooks/usePlanejamentoStatus';
import { format, isBefore, addDays, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  empreendimentoId: string;
}

export function PlanejamentoDashboard({ empreendimentoId }: Props) {
  const { itens, isLoading } = usePlanejamentoItens({ empreendimento_id: empreendimentoId });
  const { fases } = usePlanejamentoFases();
  const { statusList } = usePlanejamentoStatus();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const metrics = useMemo(() => {
    if (!itens || !statusList) return null;

    const statusFinal = statusList.find(s => s.is_final);
    const total = itens.length;
    const finalizados = itens.filter(i => i.status?.is_final).length;
    const emDesenvolvimento = itens.filter(i => !i.status?.is_final && i.status_id).length;
    
    const atrasados = itens.filter(i => {
      if (i.status?.is_final) return false;
      if (!i.data_fim) return false;
      return isBefore(parseISO(i.data_fim), hoje);
    }).length;

    const semResponsavel = itens.filter(i => !i.responsavel_tecnico_id).length;
    const semData = itens.filter(i => !i.data_inicio && !i.data_fim).length;

    // Próximos 7 dias
    const proximosSete = itens.filter(i => {
      if (i.status?.is_final) return false;
      if (!i.data_fim) return false;
      const dataFim = parseISO(i.data_fim);
      return isAfter(dataFim, hoje) && isBefore(dataFim, addDays(hoje, 7));
    });

    return {
      total,
      finalizados,
      emDesenvolvimento,
      atrasados,
      semResponsavel,
      semData,
      proximosSete,
      percentualConcluido: total > 0 ? Math.round((finalizados / total) * 100) : 0
    };
  }, [itens, statusList, hoje]);

  const progressoPorFase = useMemo(() => {
    if (!itens || !fases) return [];

    return fases.map(fase => {
      const itensFase = itens.filter(i => i.fase_id === fase.id);
      const finalizados = itensFase.filter(i => i.status?.is_final).length;
      const total = itensFase.length;
      const percentual = total > 0 ? Math.round((finalizados / total) * 100) : 0;

      return {
        ...fase,
        total,
        finalizados,
        percentual
      };
    });
  }, [itens, fases]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.percentualConcluido}% concluídas
            </p>
            <Progress value={metrics.percentualConcluido} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Desenvolvimento</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.emDesenvolvimento}</div>
            <p className="text-xs text-muted-foreground">
              tarefas em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.finalizados}</div>
            <p className="text-xs text-muted-foreground">
              de {metrics.total} tarefas
            </p>
          </CardContent>
        </Card>

        <Card className={metrics.atrasados > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.atrasados > 0 ? 'text-destructive' : ''}`}>
              {metrics.atrasados}
            </div>
            <p className="text-xs text-muted-foreground">
              requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(metrics.semResponsavel > 0 || metrics.semData > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.semResponsavel > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="py-4 flex items-center gap-3">
                <UserX className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm">{metrics.semResponsavel} tarefa(s) sem responsável</p>
                  <p className="text-xs text-muted-foreground">Atribua um responsável técnico</p>
                </div>
              </CardContent>
            </Card>
          )}
          {metrics.semData > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="py-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm">{metrics.semData} tarefa(s) sem data</p>
                  <p className="text-xs text-muted-foreground">Defina datas de início e fim</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progresso por fase */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progresso por Fase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progressoPorFase.map(fase => (
              <div key={fase.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: fase.cor }}
                    />
                    <span>{fase.nome}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {fase.finalizados}/{fase.total} ({fase.percentual}%)
                  </span>
                </div>
                <Progress value={fase.percentual} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Próximas tarefas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.proximosSete.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma tarefa com prazo nos próximos 7 dias
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.proximosSete.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <Badge 
                      variant="outline"
                      style={{ 
                        backgroundColor: item.status?.cor + '20',
                        color: item.status?.cor,
                        borderColor: item.status?.cor
                      }}
                    >
                      {item.data_fim && format(parseISO(item.data_fim), 'dd/MM', { locale: ptBR })}
                    </Badge>
                    <span className="flex-1 truncate">{item.item}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.responsavel?.full_name?.split(' ')[0] || 'Sem resp.'}
                    </span>
                  </div>
                ))}
                {metrics.proximosSete.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    + {metrics.proximosSete.length - 5} tarefa(s)
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
