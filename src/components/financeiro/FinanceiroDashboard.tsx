import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  TrendingUp, 
  Wallet,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { KPICardCompact } from '@/components/dashboard-executivo/KPICardCompact';
import type { LancamentoFinanceiro } from '@/types/financeiro.types';
import { CORES_DESPESAS, CORES_DASHBOARD, TOOLTIP_STYLE } from '@/lib/chartColors';

interface FinanceiroDashboardProps {
  lancamentos: LancamentoFinanceiro[];
  stats: {
    totalReceber: number;
    totalPagar: number;
    receberPago: number;
    pagarPago: number;
  } | undefined;
  onOpenPagamento: (id: string) => void;
  formatCurrency: (value: number) => string;
}

export function FinanceiroDashboard({ lancamentos, stats, onOpenPagamento, formatCurrency }: FinanceiroDashboardProps) {
  const saldoInicial = 0;
  const totalEntradas = stats?.receberPago || 0;
  const totalSaidas = stats?.pagarPago || 0;
  const saldoAtual = saldoInicial + totalEntradas - totalSaidas;

  // Dados para sparklines - evolução mensal (últimos 6 meses)
  const dadosSparklines = useMemo(() => {
    const meses: Record<string, { entradas: number; saidas: number }> = {};
    
    lancamentos.forEach((l: any) => {
      const mes = format(new Date(l.data_vencimento), 'yyyy-MM');
      if (!meses[mes]) {
        meses[mes] = { entradas: 0, saidas: 0 };
      }
      if (l.tipo === 'receber' && l.status === 'pago') {
        meses[mes].entradas += l.valor || 0;
      } else if (l.tipo === 'pagar' && l.status === 'pago') {
        meses[mes].saidas += l.valor || 0;
      }
    });

    // Ordenar por mês e pegar os últimos 6
    const mesesOrdenados = Object.entries(meses)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);

    let saldoAcumulado = 0;
    const entradasMensais: number[] = [];
    const saidasMensais: number[] = [];
    const saldosMensais: number[] = [];

    mesesOrdenados.forEach(([_, valores]) => {
      entradasMensais.push(valores.entradas);
      saidasMensais.push(valores.saidas);
      saldoAcumulado += valores.entradas - valores.saidas;
      saldosMensais.push(saldoAcumulado);
    });

    return {
      entradas: entradasMensais,
      saidas: saidasMensais,
      saldos: saldosMensais
    };
  }, [lancamentos]);

  // Dados para gráfico de barras por categoria - apenas lançamentos PAGOS (realizados)
  const dadosPorCategoria = useMemo(() => {
    const categorias: Record<string, { entradas: number; saidas: number }> = {};
    
    // Filtrar apenas lançamentos pagos para mostrar valores realizados
    lancamentos
      .filter((l: any) => l.status === 'pago')
      .forEach((l: any) => {
        const categoria = l.categoria_fluxo || 'Sem Categoria';
        if (!categorias[categoria]) {
          categorias[categoria] = { entradas: 0, saidas: 0 };
        }
        if (l.tipo === 'receber') {
          categorias[categoria].entradas += l.valor || 0;
        } else {
          categorias[categoria].saidas += l.valor || 0;
        }
      });

    return Object.entries(categorias).map(([nome, valores]) => ({
      nome: nome.length > 15 ? nome.substring(0, 15) + '...' : nome,
      Entradas: valores.entradas,
      Saídas: valores.saidas
    })).slice(0, 6);
  }, [lancamentos]);

  // Dados para gráfico de pizza de despesas
  const dadosDespesas = useMemo(() => {
    const categorias: Record<string, number> = {};
    
    lancamentos.filter((l: any) => l.tipo === 'pagar').forEach((l: any) => {
      const categoria = l.categoria_fluxo || 'Sem Categoria';
      categorias[categoria] = (categorias[categoria] || 0) + (l.valor || 0);
    });

    return Object.entries(categorias)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [lancamentos]);

  // Dados para gráfico de evolução (últimos 6 meses simulado)
  const dadosEvolucao = useMemo(() => {
    const meses: Record<string, { entradas: number; saidas: number }> = {};
    
    lancamentos.forEach((l: any) => {
      const mes = format(new Date(l.data_vencimento), 'MMM/yy');
      if (!meses[mes]) {
        meses[mes] = { entradas: 0, saidas: 0 };
      }
      if (l.tipo === 'receber') {
        meses[mes].entradas += l.valor || 0;
      } else {
        meses[mes].saidas += l.valor || 0;
      }
    });

    let saldoAcumulado = 0;
    return Object.entries(meses).slice(-6).map(([mes, valores]) => {
      saldoAcumulado += valores.entradas - valores.saidas;
      return {
        mes,
        Saldo: saldoAcumulado
      };
    });
  }, [lancamentos]);

  // Próximos vencimentos (7 dias)
  const proximosVencimentos = useMemo(() => {
    const hoje = new Date();
    return lancamentos
      .filter((l: any) => {
        if (l.status !== 'pendente') return false;
        const diasAteVenc = differenceInDays(new Date(l.data_vencimento), hoje);
        return diasAteVenc >= 0 && diasAteVenc <= 7;
      })
      .slice(0, 5);
  }, [lancamentos]);

  return (
    <>
      {/* Cards de Resumo - Padronizado com KPICardCompact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICardCompact
          title="Saldo Inicial"
          value={formatCurrency(saldoInicial)}
          subtitle="Mês atual"
          icon={Wallet}
        />
        <KPICardCompact
          title="Entradas"
          value={formatCurrency(totalEntradas)}
          subtitle={`Previsto: ${formatCurrency(stats?.totalReceber || 0)}`}
          icon={ArrowDownCircle}
          iconColor="text-emerald-500"
          sparklineData={dadosSparklines.entradas}
          sparklineColor="hsl(var(--chart-2))"
        />
        <KPICardCompact
          title="Saídas"
          value={formatCurrency(totalSaidas)}
          subtitle={`Previsto: ${formatCurrency(stats?.totalPagar || 0)}`}
          icon={ArrowUpCircle}
          iconColor="text-destructive"
          sparklineData={dadosSparklines.saidas}
          sparklineColor="hsl(var(--destructive))"
        />
        <KPICardCompact
          title="Saldo Atual"
          value={formatCurrency(saldoAtual)}
          subtitle="Inicial + Entradas - Saídas"
          icon={TrendingUp}
          sparklineData={dadosSparklines.saldos}
          sparklineColor={saldoAtual >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Barras - Entradas vs Saídas por Categoria */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entradas vs Saídas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="nome" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Legend />
                <Bar dataKey="Entradas" fill={CORES_DASHBOARD.verde} radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="Saídas" fill={CORES_DASHBOARD.rosa} radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição de Despesas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosDespesas.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dadosDespesas}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="valor"
                    nameKey="nome"
                    label={({ nome, percent }) => `${nome.substring(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {dadosDespesas.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_DESPESAS[index % CORES_DESPESAS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Sem dados de despesas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Evolução do Saldo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolução do Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosEvolucao.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dadosEvolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Saldo" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Sem dados para o gráfico
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Próximos Vencimentos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Vencimentos Próximos (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proximosVencimentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Nenhum vencimento nos próximos 7 dias
                    </TableCell>
                  </TableRow>
                ) : (
                  proximosVencimentos.map((l: any) => {
                    const isEntrada = l.tipo === 'receber';
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">
                          {l.descricao}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {isEntrada ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(l.data_vencimento), 'dd/MM')}</TableCell>
                        <TableCell className={`text-right font-medium ${isEntrada ? 'text-emerald-600' : 'text-destructive'}`}>
                          {formatCurrency(l.valor)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => onOpenPagamento(l.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
