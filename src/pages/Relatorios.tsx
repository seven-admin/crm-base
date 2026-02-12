import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Users, Building2, DollarSign, CalendarIcon, Download, TrendingUp, Wallet, ChevronDown, ChevronRight, Layers, Palette } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  useVendasPorPeriodo,
  usePerformanceCorretores,
  useUnidadesStats,
  useVendasPorEmpreendimento,
  useVendasPorMes,
  useComissoesPorGestor,
  useRelatorioValores,
} from '@/hooks/useRelatorios';
import { useTicketStats } from '@/hooks/useRelatoriosMarketing';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useGestoresProduto } from '@/hooks/useGestores';

import { CORES_ARRAY, CORES_DASHBOARD, TOOLTIP_STYLE } from '@/lib/chartColors';

const CORES = CORES_ARRAY;

export default function Relatorios() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date()),
  });
  const [empreendimentoFilter, setEmpreendimentoFilter] = useState<string>('');
  const [gestorFilter, setGestorFilter] = useState<string>('');
  const [expandedGestores, setExpandedGestores] = useState<Set<string>>(new Set());
  const { data: vendasPeriodo, isLoading: loadingVendas } = useVendasPorPeriodo(
    dateRange.from,
    dateRange.to
  );
  const { data: corretores, isLoading: loadingCorretores } = usePerformanceCorretores();
  const { data: unidadesStats, isLoading: loadingUnidades } = useUnidadesStats(empreendimentoFilter || undefined);
  const { data: vendasEmpreendimento, isLoading: loadingEmpreendimentos } = useVendasPorEmpreendimento();
  const { data: vendasMes, isLoading: loadingMes } = useVendasPorMes();
  const { data: empreendimentos } = useEmpreendimentos();
  const { data: comissoesGestor, isLoading: loadingComissoes } = useComissoesPorGestor(dateRange.from, dateRange.to);
  const { data: gestoresProduto } = useGestoresProduto();
  const { data: relatorioValores, isLoading: loadingValores } = useRelatorioValores(empreendimentoFilter || undefined);
  const { data: ticketStats, isLoading: loadingTickets } = useTicketStats(dateRange.from, dateRange.to);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatCurrencyCompact = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  const totalVendasPeriodo = vendasPeriodo?.reduce((acc, v) => acc + v.valor, 0) || 0;
  const quantidadeVendas = vendasPeriodo?.length || 0;
  const ticketMedioPeriodo = quantidadeVendas > 0 ? totalVendasPeriodo / quantidadeVendas : 0;

  // Totais de comissões
  const comissoesData = gestorFilter 
    ? comissoesGestor?.filter(g => g.id === gestorFilter) 
    : comissoesGestor;
  const totalVendasComissoes = comissoesData?.reduce((acc, g) => acc + g.totalVendas, 0) || 0;
  const totalComissoes = comissoesData?.reduce((acc, g) => acc + g.totalComissao, 0) || 0;
  const totalComissoesPago = comissoesData?.reduce((acc, g) => acc + g.totalPago, 0) || 0;
  const totalComissoesPendente = comissoesData?.reduce((acc, g) => acc + g.totalPendente, 0) || 0;

  const toggleGestorExpand = (gestorId: string) => {
    const newExpanded = new Set(expandedGestores);
    if (newExpanded.has(gestorId)) {
      newExpanded.delete(gestorId);
    } else {
      newExpanded.add(gestorId);
    }
    setExpandedGestores(newExpanded);
  };

  const unidadesChartData = unidadesStats ? [
    { name: 'Disponíveis', value: unidadesStats.disponivel, cor: CORES_DASHBOARD.verde },
    { name: 'Reservadas', value: unidadesStats.reservada, cor: CORES_DASHBOARD.amarelo },
    { name: 'Vendidas', value: unidadesStats.vendida, cor: CORES_DASHBOARD.azul },
    { name: 'Bloqueadas', value: unidadesStats.bloqueada, cor: CORES_DASHBOARD.vermelho },
  ] : [];

  return (
    <MainLayout title="Relatórios" subtitle="Análise de vendas e performance">
      {/* Filtros Globais */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                    {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    locale={ptBR}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Empreendimento</label>
              <Select value={empreendimentoFilter || '__all__'} onValueChange={(v) => setEmpreendimentoFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os empreendimentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {empreendimentos?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Gestor do Produto</label>
              <Select value={gestorFilter || '__all__'} onValueChange={(v) => setGestorFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os gestores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {gestoresProduto?.map((gestor) => (
                    <SelectItem key={gestor.id} value={gestor.id}>{gestor.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-7 max-w-4xl">
          <TabsTrigger value="vendas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="corretores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Corretores
          </TabsTrigger>
          <TabsTrigger value="unidades" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Unidades
          </TabsTrigger>
          <TabsTrigger value="valores" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Valores
          </TabsTrigger>
          <TabsTrigger value="ticket" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Ticket Médio
          </TabsTrigger>
          <TabsTrigger value="comissoes" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Comissões
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Marketing
          </TabsTrigger>
        </TabsList>

        {/* Vendas por Período */}
        <TabsContent value="vendas" className="space-y-6">
          {/* KPIs do período */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total no Período</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalVendasPeriodo)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade de Vendas</p>
                    <p className="text-2xl font-bold">{quantidadeVendas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold">{formatCurrency(ticketMedioPeriodo)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de vendas por mês */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMes ? (
                  <Skeleton className="h-72 w-full" />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendasMes} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis tickFormatter={formatCurrencyCompact} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <Bar dataKey="vendas" fill={CORES_DASHBOARD.laranja} radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendas por empreendimento */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Empreendimento</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEmpreendimentos ? (
                  <Skeleton className="h-72 w-full" />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vendasEmpreendimento?.slice(0, 5)}
                          dataKey="vendas"
                          nameKey="nome"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ nome, percent }) => `${nome.slice(0, 10)}... (${(percent * 100).toFixed(0)}%)`}
                        >
                          {vendasEmpreendimento?.slice(0, 5).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de vendas */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVendas ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead>Corretor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendasPeriodo?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhuma venda encontrada no período
                        </TableCell>
                      </TableRow>
                    )}
                    {vendasPeriodo?.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell className="font-medium">{venda.numero}</TableCell>
                        <TableCell>{venda.cliente}</TableCell>
                        <TableCell>{venda.empreendimento}</TableCell>
                        <TableCell>{venda.corretor}</TableCell>
                        <TableCell>
                          {venda.dataAssinatura && format(new Date(venda.dataAssinatura), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(venda.valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance por Corretor */}
        <TabsContent value="corretores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Corretores</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCorretores ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <>
                  <div className="h-72 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={corretores?.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tickFormatter={formatCurrencyCompact} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis type="category" dataKey="nome" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)} 
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <Bar dataKey="vendas" fill={CORES_DASHBOARD.laranja} radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Corretor</TableHead>
                        <TableHead className="text-center">Unidades Vendidas</TableHead>
                        <TableHead className="text-right">Total em Vendas</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {corretores?.map((corretor, index) => (
                        <TableRow key={corretor.id}>
                          <TableCell>
                            <Badge variant={index < 3 ? 'default' : 'secondary'}>
                              {index + 1}º
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{corretor.nome}</TableCell>
                          <TableCell className="text-center">{corretor.unidades}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(corretor.vendas)}</TableCell>
                          <TableCell className="text-right">
                            {corretor.unidades > 0 ? formatCurrency(corretor.vendas / corretor.unidades) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unidades */}
        <TabsContent value="unidades" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-500">{unidadesStats?.disponivel || 0}</p>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-yellow-500">{unidadesStats?.reservada || 0}</p>
                <p className="text-sm text-muted-foreground">Reservadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-500">{unidadesStats?.vendida || 0}</p>
                <p className="text-sm text-muted-foreground">Vendidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-500">{unidadesStats?.bloqueada || 0}</p>
                <p className="text-sm text-muted-foreground">Bloqueadas</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Unidades</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUnidades ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={unidadesChartData.filter(d => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {unidadesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticket Médio */}
        <TabsContent value="ticket" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Médio por Empreendimento</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEmpreendimentos ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="text-center">Vendas</TableHead>
                      <TableHead className="text-right">Total Vendido</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendasEmpreendimento?.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.nome}</TableCell>
                        <TableCell className="text-center">{emp.quantidade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(emp.vendas)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {emp.quantidade > 0 ? formatCurrency(emp.vendas / emp.quantidade) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!vendasEmpreendimento || vendasEmpreendimento.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhuma venda encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comissões por Gestor */}
        <TabsContent value="comissoes" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total em Vendas</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalVendasComissoes)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Wallet className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Comissões</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalComissoes)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pago</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalComissoesPago)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <BarChart3 className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalComissoesPendente)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico Top 5 Gestores */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Gestores por Comissão</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingComissoes ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comissoesData?.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tickFormatter={formatCurrencyCompact} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis type="category" dataKey="nome" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="totalComissao" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Comissão" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabela por Gestor */}
          <Card>
            <CardHeader>
              <CardTitle>Comissões por Gestor do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingComissoes ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Gestor</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Total Vendas</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                      <TableHead className="text-right">Pago</TableHead>
                      <TableHead className="text-right">Pendente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comissoesData?.map((gestor) => (
                      <>
                        <TableRow key={gestor.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleGestorExpand(gestor.id)}>
                          <TableCell>
                            {expandedGestores.has(gestor.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{gestor.nome}</TableCell>
                          <TableCell className="text-muted-foreground">{gestor.cargo || '-'}</TableCell>
                          <TableCell className="text-center">{gestor.quantidade}</TableCell>
                          <TableCell className="text-right">{formatCurrency(gestor.totalVendas)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(gestor.totalComissao)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(gestor.totalPago)}</TableCell>
                          <TableCell className="text-right text-amber-600">{formatCurrency(gestor.totalPendente)}</TableCell>
                        </TableRow>
                        {expandedGestores.has(gestor.id) && gestor.empreendimentos.map((emp) => (
                          <TableRow key={`${gestor.id}-${emp.id}`} className="bg-muted/30">
                            <TableCell></TableCell>
                            <TableCell colSpan={2} className="pl-8 text-muted-foreground">{emp.nome}</TableCell>
                            <TableCell className="text-center text-muted-foreground">{emp.quantidade}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(emp.totalVendas)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(emp.totalComissao)}</TableCell>
                            <TableCell colSpan={2}></TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                    {(!comissoesData || comissoesData.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nenhuma comissão encontrada no período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Valores por Bloco */}
        <TabsContent value="valores" className="space-y-6">
          {!empreendimentoFilter ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  Selecione um empreendimento no filtro acima para visualizar o relatório de valores por bloco/quadra.
                </div>
              </CardContent>
            </Card>
          ) : loadingValores ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-60 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Valores por Bloco/Quadra</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bloco/Quadra</TableHead>
                      <TableHead className="text-center">Qtd Unidades</TableHead>
                      <TableHead className="text-right">Área Total (m²)</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">Valor Médio</TableHead>
                      <TableHead className="text-right">Valor/m² Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioValores?.porBloco.map((bloco) => (
                      <TableRow key={bloco.blocoId}>
                        <TableCell className="font-medium">{bloco.blocoNome}</TableCell>
                        <TableCell className="text-center">{bloco.qtdUnidades}</TableCell>
                        <TableCell className="text-right">{bloco.areaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">{formatCurrency(bloco.valorTotal)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(bloco.valorMedio)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(bloco.valorM2Medio)}</TableCell>
                      </TableRow>
                    ))}
                    {relatorioValores?.porBloco.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhuma unidade encontrada
                        </TableCell>
                      </TableRow>
                    )}
                    {relatorioValores && relatorioValores.porBloco.length > 0 && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>{relatorioValores.totais.blocoNome}</TableCell>
                        <TableCell className="text-center">{relatorioValores.totais.qtdUnidades}</TableCell>
                        <TableCell className="text-right">{relatorioValores.totais.areaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">{formatCurrency(relatorioValores.totais.valorTotal)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(relatorioValores.totais.valorMedio)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(relatorioValores.totais.valorM2Medio)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Marketing - Atividades de Produção */}
        <TabsContent value="marketing" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Palette className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Atividades</p>
                    {loadingTickets ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold">{ticketStats?.total || 0}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Building2 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Atividades Internas</p>
                    {loadingTickets ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{ticketStats?.internos || 0}</p>
                        <span className="text-sm text-muted-foreground">
                          ({ticketStats?.total ? Math.round((ticketStats.internos / ticketStats.total) * 100) : 0}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Atividades Externas</p>
                    {loadingTickets ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{ticketStats?.externos || 0}</p>
                        <span className="text-sm text-muted-foreground">
                          ({ticketStats?.total ? Math.round((ticketStats.externos / ticketStats.total) * 100) : 0}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-500/10">
                    <TrendingUp className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                    {loadingTickets ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold">{ticketStats?.taxaConclusao.geral || 0}%</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico - Tickets por Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets por Mês (Interno vs Externo)</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTickets ? (
                  <Skeleton className="h-72 w-full" />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketStats?.porMes || []} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend />
                        <Bar dataKey="interno" name="Interno" fill={CORES_DASHBOARD.laranja} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="externo" name="Externo" fill={CORES_DASHBOARD.verde} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico - Distribuição Interno/Externo */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição: Interno vs Externo</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTickets ? (
                  <Skeleton className="h-72 w-full" />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Internos', value: ticketStats?.internos || 0 },
                            { name: 'Externos', value: ticketStats?.externos || 0 }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          <Cell fill={CORES_DASHBOARD.laranja} />
                          <Cell fill={CORES_DASHBOARD.verde} />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela Comparativa */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Comparativas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Métrica</TableHead>
                      <TableHead className="text-center">Internos</TableHead>
                      <TableHead className="text-center">Externos</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Quantidade de Tickets</TableCell>
                      <TableCell className="text-center">{ticketStats?.internos || 0}</TableCell>
                      <TableCell className="text-center">{ticketStats?.externos || 0}</TableCell>
                      <TableCell className="text-center font-semibold">{ticketStats?.total || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Taxa de Conclusão</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={ticketStats?.taxaConclusao.interno && ticketStats.taxaConclusao.interno >= 70 ? 'default' : 'secondary'}>
                          {ticketStats?.taxaConclusao.interno || 0}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={ticketStats?.taxaConclusao.externo && ticketStats.taxaConclusao.externo >= 70 ? 'default' : 'secondary'}>
                          {ticketStats?.taxaConclusao.externo || 0}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={ticketStats?.taxaConclusao.geral && ticketStats.taxaConclusao.geral >= 70 ? 'default' : 'secondary'}>
                          {ticketStats?.taxaConclusao.geral || 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tempo Médio de Produção</TableCell>
                      <TableCell className="text-center">
                        {ticketStats?.tempoMedioProducao.interno !== null 
                          ? `${ticketStats.tempoMedioProducao.interno} dias` 
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {ticketStats?.tempoMedioProducao.externo !== null 
                          ? `${ticketStats.tempoMedioProducao.externo} dias` 
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {ticketStats?.tempoMedioProducao.geral !== null 
                          ? `${ticketStats.tempoMedioProducao.geral} dias` 
                          : '-'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tickets por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Internos</TableHead>
                      <TableHead className="text-center">Externos</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketStats?.porCategoria.map((cat) => (
                      <TableRow key={cat.categoria}>
                        <TableCell className="font-medium">{cat.categoria}</TableCell>
                        <TableCell className="text-center">{cat.interno}</TableCell>
                        <TableCell className="text-center">{cat.externo}</TableCell>
                        <TableCell className="text-center font-semibold">{cat.count}</TableCell>
                      </TableRow>
                    ))}
                    {ticketStats?.porCategoria.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum ticket encontrado no período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
