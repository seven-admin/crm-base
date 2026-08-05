import { useMemo, useState } from 'react';
import { Building2, CalendarCheck2, Handshake, TrendingUp, UserRound, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useNexaMetasDashboard,
  type NexaConsultorCard,
  type NexaMetricSet,
  type NexaPerfLevel,
} from '@/hooks/useNexaMetas';

const PERF: Record<NexaPerfLevel, { emoji: string; label: string; cls: string }> = {
  bom: { emoji: '🤑', label: 'Bom', cls: 'text-emerald-700' },
  atencao: { emoji: '😮‍💨', label: 'Atenção', cls: 'text-amber-700' },
  critico: { emoji: '😱', label: 'Crítico', cls: 'text-red-600' },
  sem_meta: { emoji: '⚪', label: 'Sem meta', cls: 'text-muted-foreground' },
};

// Placeholder até definirmos a origem de vendas/VGV/carteira realizados (decisão do usuário).
const PLACEHOLDER = '—';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function pct(done: number, goal: number) {
  return goal > 0 ? Math.round((done / goal) * 100) : null;
}

function MetricRow({ label, hint, done, goal }: { label: string; hint?: string; done: number; goal: number }) {
  const p = pct(done, goal);
  const cls = p == null ? 'text-muted-foreground' : p >= 100 ? 'text-emerald-700' : p >= 70 ? 'text-amber-700' : 'text-red-600';
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/[.05] py-2 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <span className="text-base font-semibold">{done}</span>
        <span className="text-sm text-muted-foreground"> / {goal}</span>
        {p != null && <span className={`ml-2 text-xs font-semibold ${cls}`}>{p}%</span>}
      </div>
    </div>
  );
}

function PerfBadge({ title, level }: { title: string; level: NexaPerfLevel }) {
  const p = PERF[level];
  return (
    <div className="rounded-xl border border-black/[.07] bg-white px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-2xl leading-none">{p.emoji}</p>
      <p className={`mt-1 text-[11px] font-semibold ${p.cls}`}>{p.label}</p>
    </div>
  );
}

function CarteiraCell({ titulo, qtd }: { titulo: string; qtd: string }) {
  return (
    <div className="rounded-xl bg-black/[.02] px-3 py-2">
      <p className="text-[11px] font-semibold text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-sm">QTD <span className="font-semibold">{qtd}</span></p>
      <p className="text-xs text-muted-foreground">VGV {PLACEHOLDER}</p>
    </div>
  );
}

function ConsultorCard({ card }: { card: NexaConsultorCard }) {
  return (
    <Card className="p-5 shadow-none sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#201a17] text-white"><UserRound className="h-5 w-5" /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">Consultor(a)</p>
            <p className="text-lg font-semibold tracking-[-0.02em]">{card.nome}</p>
            <p className="text-xs text-muted-foreground">Prioridades do dia · Atendimento ({card.hoje.atendimentos}) · Visita ({card.hoje.visitas})</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PerfBadge title="Como vc está hoje?" level={card.performanceAtual.level} />
          <PerfBadge title="Semana anterior" level={card.performanceAnterior.level} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl border border-black/[.07] p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Meta semanal</p>
          <MetricRow label="Visitas" done={card.semana.visitas} goal={card.meta.visitas} />
          <MetricRow label="Engajamento real" hint="corretores em 2+ atividades" done={card.semana.engajamento} goal={card.meta.engajamento} />
          <MetricRow label="Impacto global" hint="corretores distintos" done={card.semana.impacto} goal={card.meta.impacto} />
          <MetricRow label="Atendimento" done={card.semana.atendimentos} goal={card.meta.atendimentos} />
          <div className="flex items-center justify-between gap-3 py-2 text-muted-foreground">
            <p className="text-sm font-medium">Venda</p>
            <span className="text-sm">{PLACEHOLDER}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-black/[.07] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Carteira de Negócios</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <CarteiraCell titulo="Reservas" qtd={PLACEHOLDER} />
              <CarteiraCell titulo="Em negociação" qtd={PLACEHOLDER} />
              <CarteiraCell titulo="Em contrato" qtd={PLACEHOLDER} />
              <CarteiraCell titulo="Em análise" qtd={PLACEHOLDER} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/[.07] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">VGV — R$</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{PLACEHOLDER}</p>
              <p className="text-xs text-muted-foreground">Meta semanal {card.metaVgv > 0 ? brl(card.metaVgv) : 'a definir'}</p>
            </div>
            <div className="rounded-2xl border border-black/[.07] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Unidades vendidas</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{PLACEHOLDER}</p>
              <p className="text-xs text-muted-foreground">Meta semanal a definir</p>
            </div>
          </div>
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

export function NexaMetasDashboard() {
  const { data, isLoading } = useNexaMetasDashboard();
  const { isSuperAdmin } = usePermissions();
  const [selUser, setSelUser] = useState('todos');

  const cards = data?.cards ?? [];
  const userOptions = useMemo(
    () => cards.map((c) => ({ id: c.userId, nome: c.nome })).sort((a, b) => a.nome.localeCompare(b.nome)),
    [cards],
  );

  if (isLoading || !data) return <Skeleton className="h-96 rounded-[2rem]" />;

  const { totals, seeAll } = data;
  const t: NexaMetricSet = totals.semana;
  const g: NexaMetricSet = totals.meta;

  // Super admin pode focar num usuário; nesse caso escondemos os totais "(todos)".
  const canFilter = isSuperAdmin() && userOptions.length > 0;
  const filtrando = canFilter && selUser !== 'todos';
  const visibleCards = filtrando ? cards.filter((c) => c.userId === selUser) : cards;

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

      {seeAll && !filtrando && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TotalTile label="Visitas (todos)" icon={<CalendarCheck2 className="h-4 w-4 text-primary" />} done={t.visitas} goal={g.visitas} />
          <TotalTile label="Engajamento (todos)" icon={<Building2 className="h-4 w-4 text-primary" />} done={t.engajamento} goal={g.engajamento} />
          <TotalTile label="Impacto (todos)" icon={<Users className="h-4 w-4 text-primary" />} done={t.impacto} goal={g.impacto} />
          <TotalTile label="Atendimentos (todos)" icon={<Handshake className="h-4 w-4 text-primary" />} done={t.atendimentos} goal={g.atendimentos} />
        </div>
      )}

      {visibleCards.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground shadow-none">
          Nenhuma meta vigente encontrada. Configure metas na aba "Configurar Metas".
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleCards.map((card) => <ConsultorCard key={card.userId} card={card} />)}
        </div>
      )}
    </div>
  );
}
