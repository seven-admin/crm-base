import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CalendarX, 
  ListTodo,
  Building2,
  TrendingUp
} from 'lucide-react';
import { usePlanejamentoGlobal, type PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
  limiteSobrecarga?: number;
}

export function PlanejamentoGlobalResumo({ filters, limiteSobrecarga = 5 }: Props) {
  const { 
    metricas, 
    progressoPorEmpreendimento, 
    conflitos, 
    isLoading 
  } = usePlanejamentoGlobal(filters, limiteSobrecarga);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const chartData = progressoPorEmpreendimento.slice(0, 10).map(emp => ({
    nome: emp.nome.length > 15 ? emp.nome.substring(0, 15) + '...' : emp.nome,
    nomeCompleto: emp.nome,
    concluidas: emp.concluidas,
    emAndamento: emp.emAndamento,
    atrasadas: emp.atrasadas,
    pendentes: emp.totalTarefas - emp.concluidas - emp.emAndamento - emp.atrasadas
  }));

  const conflitosAltos = conflitos.filter(c => c.severidade === 'alta');
  const conflitosMedios = conflitos.filter(c => c.severidade === 'media');

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ListTodo className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricas?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total de Tarefas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricas?.concluidas || 0}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricas?.emAndamento || 0}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricas?.atrasadas || 0}</p>
                <p className="text-xs text-muted-foreground">Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <CalendarX className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricas?.semData || 0}</p>
                <p className="text-xs text-muted-foreground">Sem Data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Conflitos */}
      {(conflitosAltos.length > 0 || conflitosMedios.length > 0) && (
        <div className="space-y-2">
          {conflitosAltos.map((conflito, idx) => (
            <Alert key={idx} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Alerta Crítico</AlertTitle>
              <AlertDescription>{conflito.descricao}</AlertDescription>
            </Alert>
          ))}
          {conflitosMedios.slice(0, 3).map((conflito, idx) => (
            <Alert key={idx}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>{conflito.descricao}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de barras empilhadas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Progresso por Empreendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="nome" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.nomeCompleto || label;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="concluidas" stackId="a" fill="hsl(var(--chart-2))" name="Concluídas" />
                  <Bar dataKey="emAndamento" stackId="a" fill="hsl(var(--chart-1))" name="Em Andamento" />
                  <Bar dataKey="atrasadas" stackId="a" fill="hsl(var(--destructive))" name="Atrasadas" />
                  <Bar dataKey="pendentes" stackId="a" fill="hsl(var(--muted))" name="Pendentes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum empreendimento encontrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de progresso */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Detalhamento por Empreendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {progressoPorEmpreendimento.map(emp => (
                <div key={emp.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate max-w-[200px]" title={emp.nome}>
                      {emp.nome}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {emp.concluidas}/{emp.totalTarefas}
                      </span>
                      <Badge 
                        variant={emp.percentualConcluido >= 80 ? 'default' : emp.percentualConcluido >= 50 ? 'secondary' : 'outline'}
                      >
                        {emp.percentualConcluido}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={emp.percentualConcluido} className="h-2" />
                  <div className="flex gap-2 text-xs">
                    {emp.atrasadas > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {emp.atrasadas} atrasada(s)
                      </Badge>
                    )}
                    {emp.emAndamento > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {emp.emAndamento} em andamento
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {progressoPorEmpreendimento.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum empreendimento com planejamento
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
