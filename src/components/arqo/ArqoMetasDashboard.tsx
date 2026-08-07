import { useMemo, useState } from 'react';
import { CalendarCheck2, Handshake, PhoneCall, TrendingUp, UserRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useArqoMetasDashboard,
  aggregateArqoCards,
  type ArqoConsultorCard,
  type ArqoMetricSet,
  type ArqoPerfLevel,
} from '@/hooks/useArqoMetasDashboard';

const PERF: Record<ArqoPerfLevel, { emoji: string; label: string; cls: string }> = {
  bom: { emoji: '🟢', label: 'Bom', cls: 'text-emerald-700' },
  atencao: { emoji: '🟠', label: 'Atenção', cls: 'text-amber-700' },
  critico: { emoji: '🔴', label: 'Crítico', cls: 'text-red-600' },
  sem_meta: { emoji: '⚪', label: 'Sem meta', cls: 'text-muted-foreground' },
};

function pct(done: number, goal: number) {
  return goal > 0 ? Math.round((done / goal) * 100) : null;
}

function MetricRow({ label, done, goal }: { label: string; done: number; goal: number }) {
  const p = pct(done, goal);
  const cls = p == null ? 'text-muted-foreground' : p >= 100 ? 'text-emerald-700' : p >= 70 ? 'text-amber-700' : 'text-red-600';
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/[.05] py-2 last:border-0">
      <p className="min-w-0 truncate text-sm font-medium">{label}</p>
      <div className="shrink-0 text-right tabular-nums">
        <span className="text-base font-semibold">{done}</span>
        <span className="text-sm text-muted-foreground"> / {goal}</span>
        {p != null && <span className={`ml-2 text-xs font-semibold ${cls}`}>{p}%</span>}
      </div>
    </div>
  );
}

function PerfBadge({ title, level, score }: { title: string; level: ArqoPerfLevel; score: number | null }) {
  const p = PERF[level];
  return (
    <div className="rounded-xl border border-black/[.07] bg-white px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-2xl leading-none">{p.emoji}</p>
      <p className={`mt-1 text-[11px] font-semibold ${p.cls}`}>
        {p.label}{score != null && ` · ${score.toFixed(0)}%`}
      </p>
    </div>
  );
}

function ConsultorCard({ card }: { card: ArqoConsultorCard }) {
  return (
    <Card className="p-5 shadow-none sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#201a17] text-white"><UserRound className="h-5 w-5" /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{card.userId === 'todos' ? 'Consolidado' : 'Consultor(a)'}</p>
            <p className="text-lg font-semibold tracking-[-0.02em]">{card.nome}</p>
            <p className="text-xs text-muted-foreground">
              Hoje · Ligações ({card.hoje.ligacoes}) · Conversas ({card.hoje.conversas}) · Agendamentos ({card.hoje.agendamentos}) · Visitas ({card.hoje.visitasRealizadas})
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PerfBadge title="Como vc está hoje?" level={card.performanceHoje.level} score={card.performanceHoje.score} />
          <PerfBadge title="Semana anterior" level={card.performanceAnterior.level} score={card.performanceAnterior.score} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/[.07] p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Meta semanal</p>
          <MetricRow label="Ligações" done={card.semana.ligacoes} goal={card.metaSemana.ligacoes} />
          <MetricRow label="Conversas efetivadas" done={card.semana.conversas} goal={card.metaSemana.conversas} />
          <MetricRow label="Agendamentos" done={card.semana.agendamentos} goal={card.metaSemana.agendamentos} />
          <MetricRow label="Visitas realizadas" done={card.semana.visitasRealizadas} goal={card.metaSemana.visitasRealizadas} />
        </div>

        <div className="rounded-2xl border border-black/[.07] p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Meta diária</p>
          <MetricRow label="Ligações" done={card.hoje.ligacoes} goal={card.metaDia.ligacoes} />
          <MetricRow label="Conversas efetivadas" done={card.hoje.conversas} goal={card.metaDia.conversas} />
          <MetricRow label="Agendamentos" done={card.hoje.agendamentos} goal={card.metaDia.agendamentos} />
          <MetricRow label="Visitas realizadas" done={card.hoje.visitasRealizadas} goal={card.metaDia.visitasRealizadas} />
        </div>
      </div>
    </Card>
  );
}

function TotalTile({ label, icon, done, goal }: { label: string; icon: React.ReactNode; done: number; goal: number }) {
  const p = pct(done, goal);
  return (
    <Card className="p-4 shadow-none">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{label}</p>
        {icon}
      </div>
      <div className="mt-2 flex items-end gap-1.5">
        <strong className="text-3xl font-semibold tracking-[-0.05em] tabular-nums">{done}</strong>
        <span className="pb-1 text-xs text-muted-foreground">/ {goal}{p != null && ` · ${p}%`}</span>
      </div>
    </Card>
  );
}

export function ArqoMetasDashboard() {
  const { data, isLoading } = useArqoMetasDashboard();
  const { isSuperAdmin } = usePermissions();
  const [selUser, setSelUser] = useState('todos');

  const cards = data?.cards ?? [];
  const userOptions = useMemo(
    () => cards.map((c) => ({ id: c.userId, nome: c.nome })).sort((a, b) => a.nome.localeCompare(b.nome)),
    [cards],
  );

  if (isLoading || !data) return <Skeleton className="h-96 rounded-[2rem]" />;

  const { totals, seeAll } = data;
  const t: ArqoMetricSet = totals.semana;
  const g: ArqoMetricSet = totals.meta;

  // Super admin: 1 card consolidado (todos) por padrão, ou o card do usuário filtrado.
  const canFilter = isSuperAdmin() && userOptions.length > 0;
  const emptyMsg = (
    <Card className="p-10 text-center text-sm text-muted-foreground shadow-none">
      Nenhuma meta vigente encontrada. Configure metas na aba "Configurar Metas".
    </Card>
  );

  let cardsContent: React.ReactNode;
  if (canFilter) {
    const card = selUser === 'todos'
      ? (cards.length ? aggregateArqoCards(cards) : null)
      : (cards.find((c) => c.userId === selUser) ?? null);
    cardsContent = card ? <ConsultorCard card={card} /> : emptyMsg;
  } else {
    cardsContent = cards.length === 0
      ? emptyMsg
      : <div className="space-y-4">{cards.map((card) => <ConsultorCard key={card.userId} card={card} />)}</div>;
  }

  return (
    <div className="space-y-5">
      {canFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Usuário</span>
          <Select value={selUser} onValueChange={setSelUser}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Usuário" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os usuários</SelectItem>
              {userOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Totais em tiles: para gestores que veem tudo mas não têm o filtro (não super admin). */}
      {seeAll && !canFilter && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TotalTile label="Ligações (todos)" icon={<PhoneCall className="h-4 w-4 text-primary" />} done={t.ligacoes} goal={g.ligacoes} />
          <TotalTile label="Conversas (todos)" icon={<Handshake className="h-4 w-4 text-primary" />} done={t.conversas} goal={g.conversas} />
          <TotalTile label="Agendamentos (todos)" icon={<CalendarCheck2 className="h-4 w-4 text-primary" />} done={t.agendamentos} goal={g.agendamentos} />
          <TotalTile label="Visitas realizadas (todos)" icon={<TrendingUp className="h-4 w-4 text-primary" />} done={t.visitasRealizadas} goal={g.visitasRealizadas} />
        </div>
      )}

      {cardsContent}
    </div>
  );
}
