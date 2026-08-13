import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, PhoneCall, TrendingUp, UserPlus, UserRound, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { useArqoConsultorHome } from '@/hooks/useArqoConsultorHome';
import { useArqoCarteira } from '@/hooks/useArqoCarteira';
import { useArqoMetasDashboard, type ArqoPerfLevel } from '@/hooks/useArqoMetasDashboard';
import { useMeusArqoGrupos, useArqoFilaGrupos } from '@/hooks/useArqo';
import { ArqoNovoLeadDialog } from '@/components/arqo/ArqoNovoLeadDialog';
import { ArqoCarteiraCard } from '@/components/arqo/ArqoCarteiraCard';

const PERF: Record<ArqoPerfLevel, { emoji: string; label: string; cls: string }> = {
  bom: { emoji: '🤑', label: 'Bom', cls: 'text-emerald-400' },
  atencao: { emoji: '😮‍💨', label: 'Atenção', cls: 'text-amber-400' },
  critico: { emoji: '😱', label: 'Crítico', cls: 'text-red-400' },
  sem_meta: { emoji: '😐', label: 'Sem meta', cls: 'text-white/50' },
};

function MoodBadge({ title, level, score }: { title: string; level: ArqoPerfLevel; score: number | null }) {
  const p = PERF[level];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3">
      <span className="text-3xl leading-none">{p.emoji}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{title}</p>
        <p className={`text-sm font-semibold ${p.cls}`}>{p.label}{score != null && ` · ${score.toFixed(0)}%`}</p>
      </div>
    </div>
  );
}

function TopBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-primary-soft px-5 py-3 text-sm font-bold text-[#181613] transition-colors hover:bg-primary-soft/70">
      {label}
    </button>
  );
}

function PriorityTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-black/[.07] px-4 py-3 ${accent ? 'bg-primary-soft/40' : 'bg-[#f6f1eb]'}`}>
      <p className={`text-[10px] font-bold uppercase tracking-[.14em] ${accent ? 'text-primary' : 'text-muted-foreground'}`}>{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] tabular-nums">{value}</p>
    </div>
  );
}

function MetaSemanalRow({ label, meta, feito }: { label: string; meta: number; feito: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-black/[.06] px-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">({meta}) na semana</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Realizadas</p>
        <p className="text-lg font-semibold tabular-nums">{meta > 0 ? feito : '—'}</p>
      </div>
    </div>
  );
}

export function ArqoHomeConsultor() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const nome = profile?.full_name ?? 'Consultor';
  const [novoLeadOpen, setNovoLeadOpen] = useState(false);

  const { data: home, isLoading: lh } = useArqoConsultorHome();
  const { data: carteira, isLoading: lc } = useArqoCarteira(user?.id);
  const { data: metasDash } = useArqoMetasDashboard();
  const { data: meusGrupos = [] } = useMeusArqoGrupos(user?.id);
  const { data: fila = {} } = useArqoFilaGrupos(user?.id);

  const card = metasDash?.cards?.[0];
  const filaTotal = useMemo(
    () => meusGrupos.reduce((s: number, g: any) => s + (fila[g.id] ?? 0), 0),
    [meusGrupos, fila],
  );
  const grupoNome = meusGrupos.map((g: any) => g.nome).join(' · ') || 'Sem grupo';

  if (lh || lc || !home || !carteira) return <Skeleton className="h-[600px] rounded-[2rem]" />;

  const irRoleta = () => navigate('/arqo/roleta');

  return (
    <div className="space-y-5">
      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-3">
        <TopBtn label="+ Prospectar" onClick={irRoleta} />
        <TopBtn label="+ Atendimento" onClick={irRoleta} />
        <TopBtn label="Carteira de negócios" onClick={() => navigate('/empreendimentos')} />
      </div>

      {/* Cabeçalho do especialista + humores */}
      <Card className="overflow-hidden rounded-[1.75rem] border-black/[.07] bg-[#201a17] p-5 text-white shadow-none sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10"><UserRound className="h-6 w-6" /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff8a39]">Especialista</p>
              <p className="text-xl font-semibold tracking-[-0.03em]">{nome}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <MoodBadge title="Como vc está hoje?" level={card?.performanceHoje.level ?? 'sem_meta'} score={card?.performanceHoje.score ?? null} />
            <MoodBadge title="Como fechou a semana anterior?" level={card?.performanceAnterior.level ?? 'sem_meta'} score={card?.performanceAnterior.score ?? null} />
          </div>
        </div>
      </Card>

      {/* Prioridades + VGV */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 shadow-none">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Prioridades do dia</p>
          <div className="grid grid-cols-2 gap-3">
            <PriorityTile label="Atendimentos" value={home.atendimentosHoje} />
            <PriorityTile label="Retorno" value={home.retorno} accent />
          </div>
        </Card>
        <Card className="flex flex-col justify-between gap-4 p-5 shadow-none sm:flex-row sm:items-center">
          <Button variant="outline" onClick={() => navigate('/arqo/calendario')}>
            <CalendarDays className="mr-2 h-4 w-4" /> Calendário de atendimento
          </Button>
          <div className="text-right">
            <p className="text-[2.75rem] font-semibold leading-none tracking-[-0.06em]">{formatarMoedaCompacta(carteira.vgvTotal)}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              VGV · Meta {home.metaVgvSemana > 0 ? formatarMoedaCompacta(home.metaVgvSemana) : '—'}
            </p>
          </div>
        </Card>
      </div>

      {/* Clientes em atendimento + Carteira de negócios */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col p-5 shadow-none">
          <div className="rounded-xl bg-[#bcd7f2] px-4 py-2 text-sm font-semibold text-[#173a5e]">Clientes em Atendimento</div>
          <p className="mt-3 text-sm text-muted-foreground">Forecast com todos os clientes (agendados e atendidos)</p>
          <div className="mt-3 flex items-end gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Clientes</p>
              <p className="text-3xl font-semibold tabular-nums">{home.clientesEmAtendimento}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Forecast VGV</p>
              <p className="text-3xl font-semibold tabular-nums">{formatarMoedaCompacta(home.forecastVgv)}</p>
            </div>
          </div>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <Button onClick={() => setNovoLeadOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Inserir cliente</Button>
            <Button variant="outline" onClick={irRoleta}><PhoneCall className="mr-2 h-4 w-4" /> + Atendimento</Button>
          </div>
        </Card>

        <ArqoCarteiraCard buckets={carteira.buckets} subtitle="Seu funil de oportunidades em aberto" />
      </div>

      {/* Prospectar (roleta) + Meta semanal novos clientes */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 shadow-none">
          <div className="rounded-xl bg-[#bcd7f2] px-4 py-2 text-sm font-semibold text-[#173a5e]">Prospectar</div>
          <div className="mt-4 rounded-2xl border border-black/[.07] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Consultor</p>
                  <p className="text-sm font-semibold">{grupoNome}</p>
                </div>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-bold tabular-nums">{filaTotal}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{filaTotal} leads aguardando atendimento</p>
            <Button className="mt-3 w-full" onClick={irRoleta}>
              Puxar próximo lead <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-5 shadow-none">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[.14em] text-[#181613]">
            <TrendingUp className="h-4 w-4 text-primary" /> Meta semanal · novos clientes
          </p>
          <div className="space-y-2">
            <MetaSemanalRow label="Prospeção" meta={home.metaProspeccaoSemana} feito={home.prospeccaoSemana} />
            <MetaSemanalRow label="Ações" meta={home.metaAcoesSemana} feito={home.acoesSemana} />
          </div>
        </Card>
      </div>

      <ArqoNovoLeadDialog open={novoLeadOpen} onOpenChange={setNovoLeadOpen} />
    </div>
  );
}
