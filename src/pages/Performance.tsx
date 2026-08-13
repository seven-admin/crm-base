import { useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
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
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { useIncorporadoras } from '@/hooks/useIncorporadoras';
import { cn } from '@/lib/utils';

type ChartVariant = 'columns' | 'line' | 'bars' | 'pipeline' | 'combo';

const kpis = [
  { label: 'VGV contratado', value: 'R$ N/D', helper: 'Valor contratado no período', icon: Banknote, accent: 'bg-primary' },
  { label: 'Meta comercial', value: 'R$ N/D', helper: 'Meta vigente do empreendimento', icon: Target, accent: 'bg-warning' },
  { label: 'Financiamento', value: 'R$ N/D', helper: 'Volume financiado', icon: Landmark, accent: 'bg-info' },
  { label: 'Visitas', value: 'N/D', helper: 'Visitas registradas no funil', icon: CalendarCheck2, accent: 'bg-success' },
  { label: 'Aprovados sem venda', value: 'N/D', helper: 'Crédito aprovado sem contrato', icon: BadgeCheck, accent: 'bg-[hsl(var(--chart-5))]' },
  { label: 'Fila de documentação', value: 'N/D', helper: 'Contratos aguardando documentos', icon: FileClock, accent: 'bg-destructive' },
] as const;

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

      {(variant === 'columns' || variant === 'combo') && (
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

      {(variant === 'bars' || variant === 'pipeline') && (
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

      {(variant === 'line' || variant === 'combo') && (
        <svg className="absolute inset-5 h-[calc(100%-2.5rem)] w-[calc(100%-2.5rem)] text-primary opacity-25" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="2,43 17,34 34,36 51,23 68,27 83,14 98,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/55 text-center backdrop-blur-[1px]">
        <CircleDashed className="h-7 w-7 text-muted-foreground/65" />
        <span className="text-lg font-semibold tracking-[-0.03em] text-foreground">N/D</span>
        <span className="text-xs text-muted-foreground">Aguardando integração dos dados</span>
      </div>
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

function PerformanceDashboard({ incorporadora, empreendimento }: { incorporadora: string; empreendimento: string }) {
  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <Badge variant="outline" className="bg-card">{incorporadora}</Badge>
        <span className="text-xs text-muted-foreground">/</span>
        <Badge variant="default">{empreendimento}</Badge>
        <Badge variant="neutral" className="ml-auto">Dados em preparação</Badge>
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
        description="Valor contratado de cada unidade, dividido entre recursos próprios, financiamento e subsídios."
        icon={<BarChart3 className="h-4 w-4" />}
      >
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-primary" />Recursos próprios</span>
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]" />Financiamento</span>
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-success" />FGTS + subsídio</span>
        </div>
        <EmptyChart variant="columns" height="h-72 md:h-80" />
      </DashboardCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard
          title="VGV acumulado por data de assinatura"
          description="Evolução do valor contratado ao longo do período selecionado."
          icon={<LineChart className="h-4 w-4" />}
        >
          <EmptyChart variant="line" />
        </DashboardCard>

        <DashboardCard
          title="VGV por imobiliária / parceria"
          description="Valor contratado atribuído ao canal responsável pela venda."
          icon={<Handshake className="h-4 w-4" />}
        >
          <EmptyChart variant="bars" />
        </DashboardCard>
      </div>

      <DashboardCard
        title="Base completa de contratos"
        description="Detalhamento por unidade, compradores, canal de venda e composição financeira."
        icon={<FileText className="h-4 w-4" />}
      >
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {contractColumns.map((column) => <TableHead key={column} className="whitespace-nowrap">{column}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {contractColumns.map((column, index) => (
                  <TableCell key={column} className="whitespace-nowrap text-muted-foreground">
                    {index === contractColumns.length - 1 ? <Badge variant="neutral">N/D</Badge> : '—'}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Nenhum dado de contrato integrado para este empreendimento.</p>
      </DashboardCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard
          title="Desfecho das visitas realizadas"
          description="Distribuição das visitas por resultado registrado no funil comercial."
          icon={<Activity className="h-4 w-4" />}
        >
          <EmptyChart variant="bars" />
        </DashboardCard>

        <DashboardCard
          title="Esteira de crédito"
          description="Posição das propostas em cada etapa da análise de financiamento."
          icon={<WalletCards className="h-4 w-4" />}
        >
          <EmptyChart variant="pipeline" />
        </DashboardCard>
      </div>

      <DashboardCard
        title="Cadência de vendas"
        description="Ritmo de vendas no período e evolução acumulada em relação à meta."
        icon={<TrendingUp className="h-4 w-4" />}
      >
        <EmptyChart variant="combo" height="h-64 md:h-72" />
      </DashboardCard>

      <DashboardCard
        title="Radar de ação"
        description="Pendências operacionais organizadas para apoiar a priorização do time."
        icon={<Radar className="h-4 w-4" />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { label: 'Resgates imediatos', icon: ListChecks },
            { label: 'Fila de documentação', icon: ClipboardCheck },
            { label: 'Visitas em acompanhamento', icon: CalendarCheck2 },
            { label: 'Decisões pendentes', icon: Clock3 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Sem dados integrados</p>
                </div>
                <Badge variant="neutral">N/D</Badge>
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
      badge={<Badge variant="warning">Estrutura inicial</Badge>}
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
                  Os indicadores serão conectados aos dados operacionais em uma próxima etapa. Por enquanto, o painel apresenta toda a estrutura planejada.
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
          <PerformanceDashboard incorporadora={incorporadoraSelecionada.nome} empreendimento={empreendimentoSelecionado.nome} />
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
