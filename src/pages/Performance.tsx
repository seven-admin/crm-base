import { useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  Banknote,
  BarChart3,
  Building2,
  CalendarCheck2,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  FileClock,
  FileText,
  Handshake,
  Landmark,
  LineChart,
  ListChecks,
  Radar,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { useIncorporadoras } from '@/hooks/useIncorporadoras';
import { usePerformanceData, type PerformanceContract } from '@/hooks/usePerformanceData';
import { cn } from '@/lib/utils';
import { CONTRATO_STATUS_LABELS, type ContratoStatus } from '@/types/contratos.types';

type ChartVariant = 'columns' | 'pipeline' | 'blank';

const contractColumns = [
  'Unidade',
  'Comprador(es)',
  'Corretor / Imobiliária',
  'Valor',
  'Recursos próprios',
  'Financiamento',
  'Desconto',
  'Assinatura',
  'Status',
];

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat('pt-BR');

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function variableValue(contract: PerformanceContract, key: string) {
  const value = contract.variaveis_valores?.[key];
  return value == null ? '' : String(value).trim();
}

function contractStatusVariant(status: string): BadgeProps['variant'] {
  if (status === 'assinado' || status === 'aprovado') return 'success';
  if (status === 'cancelado' || status === 'reprovado') return 'destructive';
  if (status === 'enviado_assinatura' || status === 'enviado_incorporador') return 'warning';
  return 'neutral';
}

function EmptyChart({ variant, height = 'h-52' }: { variant: ChartVariant; height?: string }) {
  const verticalBars = [42, 68, 51, 81, 57, 73, 46, 64];
  const horizontalBars = [82, 67, 54, 41, 28];

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/25', height)}
      role="img"
      aria-label="Gráfico sem dados disponíveis"
    >
      <div className="pointer-events-none absolute inset-4 flex flex-col justify-between opacity-60" aria-hidden="true">
        {[0, 1, 2, 3].map((line) => <span key={line} className="block border-t border-border/70" />)}
      </div>

      {variant === 'columns' && (
        <div className="absolute inset-x-6 bottom-5 top-6 flex items-end justify-around gap-2 opacity-20" aria-hidden="true">
          {verticalBars.map((bar, index) => (
            <span
              key={`${bar}-${index}`}
              className={cn('w-full max-w-10 rounded-t-md', index % 3 === 0 ? 'bg-primary' : 'bg-muted-foreground')}
              style={{ height: `${bar}%` }}
            />
          ))}
        </div>
      )}

      {variant === 'pipeline' && (
        <div className="absolute inset-6 flex flex-col justify-around gap-3 opacity-20" aria-hidden="true">
          {horizontalBars.map((bar, index) => (
            <span
              key={`${bar}-${index}`}
              className={cn('h-3 rounded-r-full', index === 0 ? 'bg-primary' : 'bg-muted-foreground')}
              style={{ width: `${bar}%` }}
            />
          ))}
        </div>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/55 text-center backdrop-blur-[1px]">
        <CircleDashed className="h-7 w-7 text-muted-foreground/65" />
        <span className="text-lg font-semibold tracking-[-0.03em] text-foreground">N/D</span>
        <span className="max-w-64 text-xs text-muted-foreground">Aguardando uma fonte de dados confiável</span>
      </div>
    </div>
  );
}

function NoRecords({ label }: { label: string }) {
  return (
    <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 px-5 text-center">
      <CircleDashed className="h-7 w-7 text-muted-foreground/55" />
      <p className="mt-3 text-sm font-medium text-foreground">Sem registros</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  children,
  className,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="gap-3 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            {icon}
          </span>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PerformanceLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-80 max-w-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-36" />)}
      </div>
      <Skeleton className="h-80" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

function PerformanceDashboard({
  incorporadora,
  empreendimento,
  empreendimentoId,
}: {
  incorporadora: string;
  empreendimento: string;
  empreendimentoId: string;
}) {
  const { data, isLoading, isError } = usePerformanceData(empreendimentoId);

  if (isLoading) return <PerformanceLoading />;

  if (isError || !data) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h2 className="mt-4 text-base font-semibold">Não foi possível carregar os indicadores</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tente novamente em instantes. Nenhum valor estimado foi exibido.</p>
        </CardContent>
      </Card>
    );
  }

  const kpis = [
    {
      label: 'VGV contratado',
      value: data.vgvCompleto ? formatCurrency(data.vgvContratado) : 'R$ N/D',
      helper: data.vgvCompleto
        ? `${data.contratosAssinados} contrato${data.contratosAssinados === 1 ? '' : 's'} assinado${data.contratosAssinados === 1 ? '' : 's'}`
        : 'Há contrato assinado sem valor registrado',
      icon: Banknote,
      accent: 'bg-primary',
    },
    { label: 'Meta comercial', value: 'R$ N/D', helper: 'Regra por empreendimento ainda não definida', icon: Target, accent: 'bg-warning' },
    {
      label: 'Financiamento',
      value: data.composicaoCobertura === 0 && data.contratosAssinados > 0
        ? 'R$ N/D'
        : `${formatCurrency(data.financiamentoConhecido)}${data.financiamentoCompleto ? '' : '+'}`,
      helper: data.financiamentoCompleto
        ? 'Total dos contratos assinados'
        : data.composicaoCobertura > 0
          ? `Mínimo conhecido · ${data.composicaoCobertura} de ${data.contratosAssinados} contratos`
          : 'Nenhum plano de pagamento disponível',
      icon: Landmark,
      accent: 'bg-info',
    },
    { label: 'Visitas', value: String(data.visitas), helper: 'Atendimentos vinculados ao empreendimento', icon: CalendarCheck2, accent: 'bg-success' },
    { label: 'Aprovados sem venda', value: 'N/D', helper: 'Status de crédito ainda não disponível', icon: BadgeCheck, accent: 'bg-[hsl(var(--chart-5))]' },
    { label: 'Fila de documentação', value: 'N/D', helper: 'Checklist documental ainda não disponível', icon: FileClock, accent: 'bg-destructive' },
  ];

  const hasVisitOutcomes = data.desfechosVisitas.some((item) => item.quantidade > 0);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <Badge variant="outline" className="bg-card">{incorporadora}</Badge>
        <span className="text-xs text-muted-foreground">/</span>
        <Badge variant="default">{empreendimento}</Badge>
        <Badge variant="success" className="ml-auto">Dados operacionais</Badge>
        {data.contratosAssinados > 0 && (
          <Badge variant={data.financiamentoCompleto ? 'success' : 'warning'}>
            Composição {data.composicaoCobertura}/{data.contratosAssinados}
          </Badge>
        )}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Indicadores principais">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="relative overflow-hidden">
              <span className={cn('absolute inset-x-0 top-0 h-1', kpi.accent)} />
              <CardContent className="p-5 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{kpi.label}</p>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground/65" />
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-foreground">{kpi.value}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{kpi.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <DashboardCard
        title="Composição do preço por unidade"
        description="Contratos assinados com plano de pagamento disponível, sem estimar os contratos incompletos."
        icon={<BarChart3 className="h-4 w-4" />}
      >
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-primary" />Recursos próprios / outros</span>
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]" />Financiamento</span>
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-success" />FGTS + subsídio</span>
          {data.contratosAssinados > 0 && (
            <Badge variant={data.financiamentoCompleto ? 'success' : 'warning'} className="ml-auto">
              Cobertura {data.composicaoCobertura} de {data.contratosAssinados}
            </Badge>
          )}
        </div>
        {data.composicaoPorUnidade.length ? (
          <div className="overflow-x-auto pb-2">
            <div
              className="h-72 md:h-80"
              style={{ minWidth: Math.max(720, data.composicaoPorUnidade.length * 84) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data.composicaoPorUnidade} margin={{ top: 8, right: 8, left: 18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="unidade" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => formatCompactCurrency(Number(value))} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        recursosProprios: 'Recursos próprios / outros',
                        financiamento: 'Financiamento',
                        beneficios: 'FGTS + subsídio',
                      };
                      return [formatCurrency(Number(value)), labels[String(name)] || String(name)];
                    }}
                    contentStyle={{ borderRadius: 12, borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="recursosProprios" stackId="preco" fill="hsl(var(--primary))" />
                  <Bar dataKey="financiamento" stackId="preco" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="beneficios" stackId="preco" fill="hsl(var(--success))" radius={[7, 7, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <NoRecords label="Nenhum contrato assinado possui composição financeira disponível." />
        )}
      </DashboardCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard
          title="VGV acumulado por data de assinatura"
          description="Evolução dos contratos assinados no histórico disponível."
          icon={<LineChart className="h-4 w-4" />}
        >
          {!data.evolucaoVgvCompleta ? (
            <EmptyChart variant="blank" />
          ) : data.evolucaoVgv.length ? (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={data.evolucaoVgv} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tickFormatter={(value) => formatCompactCurrency(Number(value))} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'VGV acumulado']}
                    labelFormatter={(label) => `Assinatura: ${label}`}
                    contentStyle={{ borderRadius: 12, borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Line type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          ) : <NoRecords label="Nenhum contrato assinado com data de assinatura." />}
        </DashboardCard>

        <DashboardCard
          title="VGV por imobiliária / parceria"
          description="Contratos assinados agrupados pelo canal registrado no contrato."
          icon={<Handshake className="h-4 w-4" />}
        >
          {!data.vgvCompleto ? (
            <EmptyChart variant="blank" />
          ) : data.parceiros.length ? (
            <div className="w-full" style={{ height: Math.max(208, data.parceiros.length * 42) }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data.parceiros} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(value) => formatCompactCurrency(Number(value))} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={105} />
                  <Tooltip
                    formatter={(value, name) => name === 'vgv' ? [formatCurrency(Number(value)), 'VGV'] : [value, name]}
                    contentStyle={{ borderRadius: 12, borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="vgv" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          ) : <NoRecords label="Nenhum contrato assinado para agrupar por canal." />}
        </DashboardCard>
      </div>

      <DashboardCard
        title="Base completa de contratos"
        description="Dados contratuais disponíveis para o empreendimento selecionado."
        icon={<FileText className="h-4 w-4" />}
      >
        <div className="max-h-[520px] overflow-auto rounded-2xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {contractColumns.map((column) => <TableHead key={column} className="whitespace-nowrap">{column}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data.contratos.length && (
                <TableRow>
                  <TableCell colSpan={contractColumns.length} className="h-32 text-center text-muted-foreground">
                    Nenhum contrato registrado para este empreendimento.
                  </TableCell>
                </TableRow>
              )}
              {data.contratos.map((contract) => {
                const status = contract.status as ContratoStatus;
                const realEstate = variableValue(contract, 'imobiliaria');
                const broker = variableValue(contract, 'corretor_nome');
                const channel = [realEstate, broker].filter(Boolean).join(' · ') || 'Não informado';
                const unit = contract.unidade?.numero || variableValue(contract, 'unidade_numero') || '—';
                const buyer = contract.cliente?.nome || contract.cliente_nome || variableValue(contract, 'nome_cliente') || '—';
                const financial = data.financeiroPorContrato[contract.id];
                return (
                  <TableRow key={contract.id}>
                    <TableCell className="whitespace-nowrap font-medium">{unit}</TableCell>
                    <TableCell className="min-w-48">{buyer}</TableCell>
                    <TableCell className="min-w-48 text-muted-foreground">{channel}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {financial?.total > 0 ? formatCurrency(financial.total) : 'N/D'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {financial?.disponivel ? formatCurrency(financial.recursosProprios) : 'N/D'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {financial?.disponivel ? formatCurrency(financial.financiamento) : 'N/D'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">N/D</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(contract.data_assinatura)}</TableCell>
                    <TableCell>
                      <Badge variant={contractStatusVariant(contract.status)} className="whitespace-nowrap">
                        {CONTRATO_STATUS_LABELS[status] || contract.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Valores financeiros são exibidos somente quando o contrato possui plano de pagamento. O desconto permanece N/D por não existir um campo contratual confiável.
        </p>
      </DashboardCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard
          title="Desfecho das visitas realizadas"
          description="Distribuição dos atendimentos pelo status registrado no funil."
          icon={<Activity className="h-4 w-4" />}
        >
          {hasVisitOutcomes ? (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data.desfechosVisitas} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={102} />
                  <Tooltip
                    formatter={(value) => [Number(value), 'Atendimentos']}
                    contentStyle={{ borderRadius: 12, borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          ) : <NoRecords label="Nenhum atendimento registrado para este empreendimento." />}
        </DashboardCard>

        <DashboardCard
          title="Funil de propostas financiadas"
          description="Propostas com modalidade financiada, agrupadas pelo status comercial no mês atual."
          icon={<WalletCards className="h-4 w-4" />}
        >
          {!data.funilPropostasDisponivel ? (
            <EmptyChart variant="pipeline" />
          ) : data.propostasFinanciadas > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {data.funilPropostas.map((stage) => (
                  <div key={stage.status} className="rounded-xl border border-border/70 bg-secondary/20 p-3 text-center">
                    <strong className="block text-xl font-semibold tabular-nums">{stage.quantidade}</strong>
                    <span className="text-[10px] text-muted-foreground">{stage.label}</span>
                  </div>
                ))}
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={data.funilPropostas} layout="vertical" margin={{ top: 0, right: 10, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip
                      formatter={(value) => [Number(value), 'Propostas']}
                      contentStyle={{ borderRadius: 12, borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
                    />
                    <Bar dataKey="quantidade" fill="hsl(var(--chart-2))" radius={[0, 8, 8, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : <NoRecords label="Nenhuma proposta financiada registrada no mês atual." />}
        </DashboardCard>
      </div>

      <DashboardCard
        title="Cadência de vendas"
        description="Contratos assinados por semana e evolução acumulada no histórico disponível."
        icon={<TrendingUp className="h-4 w-4" />}
      >
        {!data.cadenciaCompleta ? (
          <EmptyChart variant="blank" height="h-64 md:h-72" />
        ) : data.cadencia.length ? (
          <div className="h-64 w-full md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.cadencia} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
                <Tooltip
                  formatter={(value, name) => [Number(value), name === 'vendas' ? 'Vendas na semana' : 'Vendas acumuladas']}
                  labelFormatter={(label) => `Semana de ${label}`}
                  contentStyle={{ borderRadius: 12, borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
                />
                <Bar dataKey="vendas" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} maxBarSize={64} />
                <Line type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : <NoRecords label="Nenhum contrato assinado com data de assinatura." />}
      </DashboardCard>

      <DashboardCard
        title="Radar de ação"
        description="Pendências com regra objetiva são exibidas; as demais permanecem N/D."
        icon={<Radar className="h-4 w-4" />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { label: 'Retornos de no-show', icon: ListChecks, value: String(data.visitasNoShow), helper: 'Atendimentos sem comparecimento' },
            { label: 'Fila de documentação', icon: ClipboardCheck, value: 'N/D', helper: 'Checklist ainda não disponível' },
            { label: 'Visitas em acompanhamento', icon: CalendarCheck2, value: String(data.visitasEmAcompanhamento), helper: 'Agendadas ou confirmadas' },
            {
              label: 'Propostas financiadas em aberto',
              icon: Clock3,
              value: data.funilPropostasDisponivel ? String(data.propostasFinanciadasEmAberto) : 'N/D',
              helper: 'Enviadas ou reservadas no mês atual',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.helper}</p>
                </div>
                <Badge variant={item.value === 'N/D' ? 'neutral' : 'success'}>{item.value}</Badge>
              </div>
            );
          })}
        </div>
      </DashboardCard>
    </div>
  );
}

export default function Performance() {
  const [incorporadoraId, setIncorporadoraId] = useState('');
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const { incorporadoras, isLoading: loadingIncorporadoras, error: incorporadorasError } = useIncorporadoras();
  const { data: empreendimentos = [], isLoading: loadingEmpreendimentos, error: empreendimentosError } = useEmpreendimentosSelect();

  const empreendimentosFiltrados = useMemo(
    () => empreendimentos.filter((empreendimento) => empreendimento.incorporadora_id === incorporadoraId),
    [empreendimentos, incorporadoraId],
  );

  const incorporadoraSelecionada = incorporadoras.find((item) => item.id === incorporadoraId);
  const empreendimentoSelecionado = empreendimentosFiltrados.find((item) => item.id === empreendimentoId);
  const dashboardReady = Boolean(incorporadoraSelecionada && empreendimentoSelecionado);

  const handleIncorporadoraChange = (value: string) => {
    setIncorporadoraId(value);
    setEmpreendimentoId('');
  };

  return (
    <MainLayout
      title="Performance"
      subtitle="Indicadores comerciais por incorporadora e empreendimento"
      badge={<Badge variant="success">Dados conectados</Badge>}
      contentClassName="pb-12 pt-4 md:pt-6"
    >
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-5 md:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,360px)_minmax(240px,360px)] lg:items-end">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Escopo da análise</span>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">Selecione o portfólio que deseja acompanhar</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Contratos assinados e atendimentos são lidos diretamente da operação. Indicadores sem fonte confiável permanecem sinalizados como N/D.
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground" htmlFor="performance-incorporadora">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Incorporadora
                </label>
                <Select value={incorporadoraId} onValueChange={handleIncorporadoraChange} disabled={loadingIncorporadoras || Boolean(incorporadorasError)}>
                  <SelectTrigger id="performance-incorporadora" className="h-11">
                    <SelectValue placeholder={loadingIncorporadoras ? 'Carregando...' : 'Selecione a incorporadora'} />
                  </SelectTrigger>
                  <SelectContent>
                    {incorporadoras.map((incorporadora) => (
                      <SelectItem key={incorporadora.id} value={incorporadora.id}>{incorporadora.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {incorporadorasError && <p className="text-xs text-destructive">Não foi possível carregar as incorporadoras.</p>}
              </div>

              {incorporadoraId ? (
                <div className="space-y-2 animate-fade-in">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground" htmlFor="performance-empreendimento">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Empreendimento
                  </label>
                  <Select value={empreendimentoId} onValueChange={setEmpreendimentoId} disabled={loadingEmpreendimentos || Boolean(empreendimentosError) || empreendimentosFiltrados.length === 0}>
                    <SelectTrigger id="performance-empreendimento" className="h-11">
                      <SelectValue
                        placeholder={loadingEmpreendimentos
                          ? 'Carregando...'
                          : empreendimentosFiltrados.length === 0
                          ? 'Nenhum empreendimento vinculado'
                          : 'Selecione o empreendimento'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {empreendimentosFiltrados.map((empreendimento) => (
                        <SelectItem key={empreendimento.id} value={empreendimento.id}>{empreendimento.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {empreendimentosError && <p className="text-xs text-destructive">Não foi possível carregar os empreendimentos.</p>}
                </div>
              ) : (
                <div className="hidden lg:block" aria-hidden="true" />
              )}
            </div>
          </CardContent>
        </Card>

        {dashboardReady ? (
          <PerformanceDashboard
            incorporadora={incorporadoraSelecionada.nome}
            empreendimento={empreendimentoSelecionado.nome}
            empreendimentoId={empreendimentoSelecionado.id}
          />
        ) : (
          <Card className="border-dashed bg-card/65">
            <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                <BarChart3 className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-foreground">
                {incorporadoraId ? 'Selecione um empreendimento' : 'Selecione uma incorporadora'}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {incorporadoraId
                  ? 'O painel completo de performance será exibido assim que um empreendimento for escolhido.'
                  : 'Comece pela incorporadora para carregar os empreendimentos vinculados e acessar o painel.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
