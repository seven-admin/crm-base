import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Carteira de negócios da Seven (global): pipeline imobiliário real de seven_unidades
// (reservada/negociacao/contrato) + "Em Análise" = propostas NEXA financiadas (análise de crédito).
// É a fonte usada na home do consultor ARQO, já que a ARQO não tem esse pipeline próprio.

export interface CarteiraBucket {
  qtd: number;
  vgv: number;
}

export interface SevenCarteira {
  reservas: CarteiraBucket;
  negociacao: CarteiraBucket;
  contrato: CarteiraBucket;
  analise: CarteiraBucket;
  vgvTotal: number;
}

const STATUS_MAP: Record<string, keyof Omit<SevenCarteira, 'vgvTotal'>> = {
  reservada: 'reservas',
  negociacao: 'negociacao',
  contrato: 'contrato',
};

const isAnaliseCredito = (modality: string | null) =>
  !!modality && modality.trim().toLowerCase() !== 'fluxo direto';

export function useSevenCarteira() {
  return useQuery({
    queryKey: ['seven', 'carteira-negocios'],
    staleTime: 60_000,
    queryFn: async (): Promise<SevenCarteira> => {
      const empty = (): CarteiraBucket => ({ qtd: 0, vgv: 0 });
      const carteira: SevenCarteira = {
        reservas: empty(), negociacao: empty(), contrato: empty(), analise: empty(), vgvTotal: 0,
      };

      // Reservas / Em negociação / Em contrato — de seven_unidades.
      const { data: unidades } = await supabase
        .from('seven_unidades')
        .select('id, status, valor')
        .in('status', ['reservada', 'negociacao', 'contrato'])
        .eq('is_active', true);
      for (const u of (unidades ?? []) as any[]) {
        const bucket = STATUS_MAP[u.status];
        if (!bucket) continue;
        carteira[bucket].qtd += 1;
        carteira[bucket].vgv += Number(u.valor ?? 0);
        carteira.vgvTotal += Number(u.valor ?? 0);
      }

      // Em Análise — propostas NEXA financiadas (análise de crédito), com VGV pela unidade.
      try {
        const { data } = await supabase.functions.invoke('propostas', { body: { list: true } });
        const propostas = (data?.items ?? []) as Array<{ status: string; modality: string | null; external_unit_id: string | null }>;
        const analise = propostas.filter((p) => ['submitted', 'reserved', 'sold'].includes(p.status) && isAnaliseCredito(p.modality));
        const unitIds = [...new Set(analise.map((p) => p.external_unit_id).filter(Boolean))] as string[];
        const valorMap = new Map<string, number>();
        if (unitIds.length) {
          const { data: us } = await supabase.from('seven_unidades').select('id, valor').in('id', unitIds);
          for (const u of (us ?? []) as any[]) valorMap.set(u.id, Number(u.valor ?? 0));
        }
        for (const p of analise) {
          carteira.analise.qtd += 1;
          carteira.analise.vgv += p.external_unit_id ? (valorMap.get(p.external_unit_id) ?? 0) : 0;
        }
      } catch {
        // Integração NEXA indisponível: mantém "Em Análise" zerado sem quebrar a home.
      }

      return carteira;
    },
  });
}
