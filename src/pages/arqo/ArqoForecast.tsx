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
    <MainLayout title="Arqo — Forecast" subtitle="VGV bruto e ponderado (temperatura × peso da etapa)">
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6">
              <div className="text-xs text-muted-foreground uppercase">Volume real (bruto)</div>
              <div className="text-3xl font-bold mt-2">{fmt(totalBruto)}</div>
              <div className="text-xs text-muted-foreground mt-1">Soma sem ponderação — para volume comercial</div>
            </Card>
            <Card className="p-6">
              <div className="text-xs text-muted-foreground uppercase">Forecast ponderado</div>
              <div className="text-3xl font-bold mt-2">{fmt(totalPond)}</div>
              <div className="text-xs text-muted-foreground mt-1">Temperatura × peso da etapa</div>
            </Card>
            <Card className="p-6">
              <div className="text-xs text-muted-foreground uppercase">Leads ativos</div>
              <div className="text-3xl font-bold mt-2">{rows.length}</div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Por etapa</h3>
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
