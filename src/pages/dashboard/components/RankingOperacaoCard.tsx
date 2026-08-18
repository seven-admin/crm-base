import { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { useTopConsultoresArqo, type TopConsultorArqo } from '../useDashboardData';
import { useNexaDashboard } from '@/hooks/useNexaDashboard';

const EMPTY_TOP_ARQO: TopConsultorArqo[] = [];
const ARQO_RANKING_CANDIDATES_LIMIT = 1000;

function Pos({ n }: { n: number }) {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f3eee8] text-xs font-bold tabular-nums text-[#181613]">
      {String(n).padStart(2, '0')}
    </span>
  );
}

function TopArqo({ month }: { month: Date }) {
  const { data: arqoData = EMPTY_TOP_ARQO, isLoading: loadingArqo } = useTopConsultoresArqo(month, ARQO_RANKING_CANDIDATES_LIMIT);
  const { data: nexaData, isLoading: loadingNexa } = useNexaDashboard(month);
  const data = useMemo(() => {
    const byConsultor = new Map(
      arqoData.map((consultor) => [consultor.consultor_id, { ...consultor }]),
    );

    for (const proposta of nexaData?.arqo.consultores ?? []) {
      const consultor = byConsultor.get(proposta.consultorId) ?? {
        consultor_id: proposta.consultorId,
        nome: proposta.nome,
        visitas: 0,
        qtd_leads: 0,
        vgv: 0,
      };
      consultor.qtd_leads += proposta.propostas;
      consultor.vgv += proposta.vgv;
      byConsultor.set(proposta.consultorId, consultor);
    }

    return [...byConsultor.values()]
      .sort((a, b) => b.vgv - a.vgv || b.visitas - a.visitas || b.qtd_leads - a.qtd_leads)
      .slice(0, 7);
  }, [arqoData, nexaData]);
  const isLoading = loadingArqo || loadingNexa;

  return (
    <div className="flex h-full flex-col rounded-[1.75rem] border border-black/[.06] bg-[#fffdfa] p-6 md:p-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#f47418]">Top 07 · Arqo</p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#181613]">Consultores de relacionamento</h2>
      <p className="mt-1 text-sm text-black/45">Ranqueado por VGV da carteira · visitas do mês</p>

      <div className="mt-5 grid grid-cols-[auto_1fr_repeat(3,minmax(0,auto))] items-center gap-x-3 gap-y-1 border-t border-black/[.06] pt-4 text-[10px] font-bold uppercase tracking-[.1em] text-black/35">
        <span /><span>Consultor</span>
        <span className="text-right">Visitas</span>
        <span className="text-right">QTD</span>
        <span className="text-right">VGV</span>
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-40 rounded-2xl" />
      ) : data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum consultor com carteira ativa.</p>
      ) : (
        <div className="mt-2 grid grid-cols-[auto_1fr_repeat(3,minmax(0,auto))] items-center gap-x-3 gap-y-2">
          {data.map((c, i) => (
            <div key={c.consultor_id} className="contents">
              <Pos n={i + 1} />
              <span className="truncate text-sm font-medium text-[#332e29]">{c.nome}</span>
              <span className="text-right text-sm tabular-nums text-black/55">{c.visitas}</span>
              <span className="text-right text-sm tabular-nums text-black/55">{c.qtd_leads}</span>
              <span className="text-right text-sm font-semibold tabular-nums text-[#181613]">{formatarMoedaCompacta(c.vgv)}</span>
            </div>
          ))}
        </div>
      )}

      <Link to="/arqo/metas" className="mt-auto flex items-center justify-between border-t border-black/[.06] pt-4 text-xs font-semibold text-black/55 transition-colors hover:text-black">
        Ver metas da equipe <ArrowUpRight className="h-4 w-4 text-[#f47418]" />
      </Link>
    </div>
  );
}

function TopNexa({ month }: { month: Date }) {
  const { data, isLoading } = useNexaDashboard(month);
  const parceiros = data?.parceiros ?? [];
  return (
    <div className="flex h-full flex-col rounded-[1.75rem] border border-black/[.06] bg-[#201a17] p-6 text-white md:p-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#ff8a39]">Top 10 · Nexa</p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-white">Parceiros de venda</h2>
      <p className="mt-1 text-sm text-white/45">Imobiliárias e corretores por VGV das propostas</p>

      {isLoading ? (
        <Skeleton className="mt-5 h-40 rounded-2xl bg-white/10" />
      ) : parceiros.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/45">Nenhuma proposta com parceiro identificado.</p>
      ) : (
        <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
          {parceiros.map((p, i) => (
            <div key={p.nome} className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[.08] text-xs font-bold tabular-nums text-white/80">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{p.nome}</p>
                <p className="text-[11px] capitalize text-white/40">{p.tipo ?? 'corretor'} · {p.propostas} proposta(s)</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-white">{formatarMoedaCompacta(p.vgv)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RankingOperacaoCard({ month }: { month: Date }) {
  return (
    <section className="grid gap-5 lg:grid-cols-2" aria-label="Ranking de operação">
      <TopArqo month={month} />
      <TopNexa month={month} />
    </section>
  );
}
