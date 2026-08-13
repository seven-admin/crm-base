import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Carteira de negócios da ARQO, por usuário: oportunidades em aberto (leads ativos, não
// fechados) do consultor, agrupadas pelas etapas ativas do funil. Cada etapa vira um balde
// com QTD e VGV (soma de valor_estimado). Sem consultorId => todos (visão do super_admin).

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ArqoCarteiraBucket {
  etapaId: string;
  nome: string;
  cor: string;
  ordem: number;
  qtd: number;
  vgv: number;
}

export interface ArqoCarteira {
  buckets: ArqoCarteiraBucket[];
  vgvTotal: number;
}

export function useArqoCarteira(consultorId?: string) {
  return useQuery({
    queryKey: ['arqo', 'carteira', consultorId ?? 'todos'],
    staleTime: 60_000,
    queryFn: async (): Promise<ArqoCarteira> => {
      const etapasRes = await supabase
        .from('arqo_funil_etapas')
        .select('id, nome, cor, ordem, categoria')
        .eq('is_active', true)
        .eq('categoria', 'ativa');
      if (etapasRes.error) throw etapasRes.error;
      const etapas = ((etapasRes.data ?? []) as any[])
        .map((e) => ({ id: e.id as string, nome: e.nome as string, cor: e.cor as string, ordem: e.ordem as number }))
        .sort((a, b) => a.ordem - b.ordem);
      const etapaIds = new Set(etapas.map((e) => e.id));

      let leadsQuery = supabase
        .from('arqo_leads')
        .select('etapa_id, valor_estimado')
        .eq('is_active', true)
        .is('fechado_em', null);
      if (consultorId) leadsQuery = leadsQuery.eq('consultor_id', consultorId);
      const leadsRes = await leadsQuery;
      if (leadsRes.error) throw leadsRes.error;

      const agg = new Map<string, { qtd: number; vgv: number }>();
      let vgvTotal = 0;
      for (const l of (leadsRes.data ?? []) as any[]) {
        if (!etapaIds.has(l.etapa_id)) continue; // só etapas ativas (fora ganho/perda/descartado)
        const valor = Number(l.valor_estimado ?? 0);
        const cur = agg.get(l.etapa_id) ?? { qtd: 0, vgv: 0 };
        cur.qtd += 1;
        cur.vgv += valor;
        agg.set(l.etapa_id, cur);
        vgvTotal += valor;
      }

      const buckets: ArqoCarteiraBucket[] = etapas.map((e) => ({
        etapaId: e.id,
        nome: e.nome,
        cor: e.cor,
        ordem: e.ordem,
        qtd: agg.get(e.id)?.qtd ?? 0,
        vgv: agg.get(e.id)?.vgv ?? 0,
      }));

      return { buckets, vgvTotal };
    },
  });
}
