import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { useArqoForecast, useArqoEtapas } from '@/hooks/useArqo';

interface ForecastRow {
  lead_id: string;
  etapa_id: string;
  etapa_nome: string;
  temperatura_nome: string | null;
  valor_bruto: number;
  fator_ponderacao: number;
  valor_ponderado: number;
  consultor_id: string | null;
}

export default function ArqoForecast() {
  const { data = [], isLoading } = useArqoForecast();
  const { data: etapas = [] } = useArqoEtapas();
  const rows = data as unknown as ForecastRow[];

  const totalBruto = useMemo(() => rows.reduce((a, r) => a + Number(r.valor_bruto || 0), 0), [rows]);
  const totalPond = useMemo(() => rows.reduce((a, r) => a + Number(r.valor_ponderado || 0), 0), [rows]);

  const porEtapa = useMemo(() => {
    const map = new Map<string, { nome: string; qtd: number; bruto: number; pond: number; cor: string }>();
    etapas.filter(e => e.categoria === 'ativa').forEach(e => map.set(e.id, { nome: e.nome, qtd: 0, bruto: 0, pond: 0, cor: e.cor }));
    rows.forEach(r => {
      const cell = map.get(r.etapa_id);
      if (cell) { cell.qtd++; cell.bruto += Number(r.valor_bruto || 0); cell.pond += Number(r.valor_ponderado || 0); }
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [rows, etapas]);

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <MainLayout title="Forecast comercial" subtitle="VGV bruto e ponderado por temperatura e etapa">
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando…</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 overflow-hidden rounded-[1.75rem] border border-black/[.06] bg-[#fffdfa] md:grid-cols-3">
            <div className="border-b border-border/70 p-6 md:border-b-0 md:border-r">
              <div className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">Volume real</div>
              <div className="mt-4 text-3xl font-semibold tracking-[-0.05em]">{fmt(totalBruto)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Soma sem ponderação</div>
            </div>
            <div className="border-b border-border/70 bg-[#201a17] p-6 text-white md:border-b-0 md:border-r">
              <div className="text-[10px] font-bold uppercase tracking-[.15em] text-[#ff8a39]">Forecast ponderado</div>
              <div className="mt-4 text-3xl font-semibold tracking-[-0.05em]">{fmt(totalPond)}</div>
              <div className="mt-2 text-xs text-white/45">Temperatura × peso da etapa</div>
            </div>
            <div className="p-6">
              <div className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">Leads ativos</div>
              <div className="mt-4 text-3xl font-semibold tracking-[-0.05em]">{rows.length}</div>
            </div>
          </div>

          <Card className="p-6 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Distribuição</p>
            <h3 className="mb-5 mt-2 text-xl font-semibold tracking-[-0.035em]">Valor por etapa</h3>
            <div className="space-y-3">
              {porEtapa.map(e => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.cor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{e.nome}</span>
                      <span className="text-muted-foreground">{e.qtd} leads · {fmt(e.bruto)} bruto · <strong>{fmt(e.pond)}</strong> ponderado</span>
                    </div>
                    <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full" style={{ backgroundColor: e.cor, width: totalPond > 0 ? `${(e.pond / totalPond) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </MainLayout>
  );
}
