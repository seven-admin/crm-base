import { useMemo, useState } from 'react';
import { FileSignature, Landmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNexaPropostasFeed, PROPOSTA_STATUS_LABEL, type PropostaTipo, type PropostaFeedItem } from '@/hooks/useNexaPropostas';
import { PropostaDetalheDialog } from '@/components/nexa/PropostaDetalheDialog';

const STATUS_CLS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  reserved: 'bg-amber-100 text-amber-800',
  sold: 'bg-emerald-100 text-emerald-800',
  withdrawn: 'bg-red-100 text-red-700',
};

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PropostasNexaCard() {
  const { data, isLoading } = useNexaPropostasFeed();
  const [filtro, setFiltro] = useState<'todos' | PropostaTipo>('todos');
  const [selecionada, setSelecionada] = useState<PropostaFeedItem | null>(null);

  const itens = useMemo(() => {
    const all = data?.items ?? [];
    return filtro === 'todos' ? all : all.filter((i) => i.tipo === filtro);
  }, [data, filtro]);

  const nCredito = (data?.items ?? []).filter((i) => i.tipo === 'analise_credito').length;

  if (isLoading) return <Skeleton className="h-80 rounded-[1.5rem]" />;

  return (
    <Card className="p-5 shadow-none sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Nexa</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Propostas & Análise de crédito</h3>
          <p className="text-xs text-muted-foreground">
            {data?.canSeeAll ? 'Todos os empreendimentos' : 'Seus empreendimentos'} · {(data?.items ?? []).length} no total · {nCredito} em análise
          </p>
        </div>
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
          <TabsList>
            <TabsTrigger value="todos">Todas</TabsTrigger>
            <TabsTrigger value="proposta">Propostas</TabsTrigger>
            <TabsTrigger value="analise_credito">Análise de crédito</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {itens.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {data?.canSeeAll
            ? 'Nenhuma proposta encontrada.'
            : 'Nenhuma proposta nos empreendimentos atribuídos a você.'}
        </p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {itens.map((p) => (
            <button
              key={p.proposal_code}
              type="button"
              onClick={() => setSelecionada(p)}
              className="flex w-full items-start gap-3 rounded-xl border border-black/[.07] bg-[#fffdfa] p-3 text-left transition-colors hover:border-primary/30 hover:bg-[#fffaf5]"
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${p.tipo === 'analise_credito' ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground'}`}>
                {p.tipo === 'analise_credito' ? <Landmark className="h-4 w-4" /> : <FileSignature className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold">{p.buyer_name || 'Sem nome'}</span>
                  <Badge variant="outline" className={STATUS_CLS[p.status] ?? ''}>{PROPOSTA_STATUS_LABEL[p.status] ?? p.status}</Badge>
                  {p.tipo === 'analise_credito' && <Badge className="bg-primary/10 text-primary">Análise de crédito</Badge>}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {p.empreendimento_nome ?? 'Sem empreendimento'}{p.unit_number ? ` · Unid. ${p.unit_number}` : ''}
                  {p.modality ? ` · ${p.modality}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatData(p.created_at)}</span>
            </button>
          ))}
        </div>
      )}

      <PropostaDetalheDialog item={selecionada} onOpenChange={(v) => !v && setSelecionada(null)} />
    </Card>
  );
}
