import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CalendarCheck2, Clock3, Layers3, Target, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useArqoAtendimentoDashboard, type ArqoPerformanceLevel } from '@/hooks/useArqoAtendimentoDashboard';

type DashboardData = ReturnType<typeof useArqoAtendimentoDashboard>;

const LEVELS: Record<ArqoPerformanceLevel, { label: string; emoji: string; className: string }> = {
  bom: { label: 'Bom', emoji: '🟢', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  atencao: { label: 'Atenção', emoji: '🟠', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  critico: { label: 'Crítico', emoji: '🔴', className: 'border-red-200 bg-red-50 text-red-800' },
  sem_meta: { label: 'Sem meta', emoji: '⚪', className: 'border-border bg-muted text-muted-foreground' },
};

function PerformanceCard({ title, subtitle, score, level }: { title: string; subtitle: string; score: number | null; level: ArqoPerformanceLevel }) {
  const config = LEVELS[level];
  return (
    <Card className="min-h-44 p-5 shadow-none sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Performance</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em]">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant="outline" className={config.className}>{config.emoji} {config.label}</Badge>
      </div>
      <div className="mt-7 flex items-end gap-2">
        <strong className="text-5xl font-semibold tracking-[-0.06em] tabular-nums">{score == null ? '—' : score.toFixed(0)}</strong>
        <span className="pb-1 text-sm text-muted-foreground">{score == null ? 'configure uma meta' : '% da meta ponderada'}</span>
      </div>
    </Card>
  );
}

function ResultChart({ title, actual, target }: { title: string; actual: DashboardData['dayMetrics']; target: DashboardData['dayGoals'] }) {
  const data = [
    { name: 'Ligações', resultado: actual.ligacoes, meta: target.ligacoes },
    { name: 'Conversas', resultado: actual.conversas, meta: target.conversas },
    { name: 'Agendamentos', resultado: actual.agendamentos, meta: target.agendamentos },
    { name: 'Visitas realizadas', resultado: actual.visitasRealizadas, meta: target.visitasRealizadas },
  ];
  return (
    <Card className="p-5 shadow-none sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Resultado × meta</p>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.035em]">{title}</h3>
        </div>
        <BarChart3 className="h-5 w-5 text-primary" />
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,.07)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(244,116,24,.06)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="resultado" name="Resultado" fill="#ff7417" radius={[8, 8, 0, 0]} />
            <Bar dataKey="meta" name="Meta" fill="#28221e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ArqoPerformanceDashboard({ dashboard, roulette }: { dashboard: DashboardData; roulette?: ReactNode }) {
  const classification = Object.entries(dashboard.portfolio.classificacao)
    .map(([name, quantity]) => `${name} ${quantity}`)
    .join(' · ') || 'Sem classificação';

  if (dashboard.isLoading) return <Skeleton className="h-[620px] rounded-[2rem]" />;

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[1.5rem] border border-black/[.06] bg-[#fffdfa] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#201a17] text-white"><Users className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold">{dashboard.consultantName}</p>
            <p className="text-xs text-muted-foreground">Especialista: {dashboard.specialistName ?? 'Sem especialista definido'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs text-muted-foreground sm:grid-cols-4 lg:text-right">
          <span><strong className="block text-base text-foreground">{dashboard.portfolio.totalVisivel}</strong> Total visível</span>
          <span><strong className="block text-base text-foreground">{dashboard.portfolio.lista}</strong> Minha carteira</span>
          <span><strong className="block text-base text-foreground">{dashboard.portfolio.retornos}</strong> Retornos</span>
          <span className="max-w-xs"><strong className="block truncate text-sm text-foreground">{classification}</strong> Classificação</span>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3" aria-label="Ações do dia">
        <Link to="/arqo/atividades" className="group">
          <Card className="flex min-h-32 items-center justify-between p-5 shadow-none transition-colors group-hover:border-primary/30 group-hover:bg-primary-soft/35">
            <div><p className="text-xs font-semibold text-muted-foreground">Retornar</p><strong className="mt-2 block text-4xl tracking-[-0.05em]">{dashboard.actions.retornar}</strong></div>
            <Clock3 className="h-6 w-6 text-primary" />
          </Card>
        </Link>
        <Link to="/arqo/atividades" className="group">
          <Card className="flex min-h-32 items-center justify-between p-5 shadow-none transition-colors group-hover:border-primary/30 group-hover:bg-primary-soft/35">
            <div><p className="text-xs font-semibold text-muted-foreground">Visitas do dia</p><strong className="mt-2 block text-4xl tracking-[-0.05em]">{dashboard.actions.visitasHoje}</strong></div>
            <CalendarCheck2 className="h-6 w-6 text-primary" />
          </Card>
        </Link>
        <a href="#roleta" className="group">
          <Card className="flex min-h-32 items-center justify-between border-[#201a17] bg-[#201a17] p-5 text-white shadow-none transition-colors group-hover:bg-[#312823]">
            <div><p className="text-xs font-semibold text-white/50">Leads na fila</p><strong className="mt-2 block text-4xl tracking-[-0.05em]">{dashboard.actions.fila}</strong></div>
            <Layers3 className="h-6 w-6 text-[#ff7417]" />
          </Card>
        </a>
      </section>

      {roulette}

      <section className="grid gap-4 lg:grid-cols-2">
        <PerformanceCard title="Como você está hoje?" subtitle="Resultado do dia comparado à meta configurada." {...dashboard.dayPerformance} />
        <PerformanceCard title="Como fechou a semana anterior?" subtitle="Referência comparativa da última semana completa." {...dashboard.previousWeekPerformance} />
      </section>

      {!dashboard.meta && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Target className="h-4 w-4" /> Nenhuma meta vigente foi encontrada. O administrador pode configurá-la em Configurações Arqo.
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <ResultChart title="Hoje" actual={dashboard.dayMetrics} target={dashboard.dayGoals} />
        <ResultChart title="Semana atual" actual={dashboard.weekMetrics} target={dashboard.weekGoals} />
      </section>
    </div>
  );
}
