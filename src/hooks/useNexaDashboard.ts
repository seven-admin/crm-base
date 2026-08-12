import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Agregados NEXA da home comercial, montados ao vivo a partir do edge function `propostas`
// (Supabase externo). O VGV vem de seven_unidades.valor casado por external_unit_id — o feed
// de propostas não carrega valor numérico, mas a unidade sim.

type PropostaRaw = {
  proposal_code: string;
  status: string;
  external_unit_id: string | null;
  project_name: string | null;
  broker_name: string | null;
  broker_type: string | null;
  real_estate_team: string | null;
  modality: string | null;
};

export interface NexaCarteira {
  propostaQtd: number;   // submitted
  emContratoQtd: number; // reserved
  assinadoQtd: number;   // sold
  vgv: number;           // soma do valor das unidades (exceto retiradas)
}

export interface NexaParceiro {
  nome: string;
  tipo: string | null; // imobiliaria / corretor
  propostas: number;
  vgv: number;
}

export interface NexaDashboard {
  producao: { propostas: number; analiseCredito: number };
  carteira: NexaCarteira;
  parceiros: NexaParceiro[];
  porEmpreendimento: Map<string, number>; // empreendimento_id -> nº de propostas ativas
}

const ATIVAS = new Set(['submitted', 'reserved', 'sold']);

// "Análise de crédito" = proposta financiada (qualquer modalidade que não seja Fluxo Direto).
const isAnaliseCredito = (modality: string | null) =>
  !!modality && modality.trim().toLowerCase() !== 'fluxo direto';

export function useNexaDashboard() {
  return useQuery({
    queryKey: ['dashboard-home', 'nexa-operacao'],
    staleTime: 60_000,
    queryFn: async (): Promise<NexaDashboard> => {
      const { data, error } = await supabase.functions.invoke('propostas', { body: { list: true } });
      if (error) throw error;
      const propostas = ((data?.items ?? []) as PropostaRaw[]).filter((p) => ATIVAS.has(p.status));

      // valor + empreendimento das unidades ligadas às propostas
      const unitIds = [...new Set(propostas.map((p) => p.external_unit_id).filter(Boolean))] as string[];
      const unitValor = new Map<string, number>();
      const unitEmp = new Map<string, string>();
      if (unitIds.length) {
        const { data: unidades } = await supabase
          .from('seven_unidades')
          .select('id, valor, empreendimento_id')
          .in('id', unitIds);
        for (const u of (unidades ?? []) as any[]) {
          unitValor.set(u.id, Number(u.valor ?? 0));
          if (u.empreendimento_id) unitEmp.set(u.id, u.empreendimento_id);
        }
      }

      const carteira: NexaCarteira = { propostaQtd: 0, emContratoQtd: 0, assinadoQtd: 0, vgv: 0 };
      const producao = { propostas: propostas.length, analiseCredito: 0 };
      const parceiroMap = new Map<string, NexaParceiro>();
      const porEmpreendimento = new Map<string, number>();

      for (const p of propostas) {
        const valor = p.external_unit_id ? (unitValor.get(p.external_unit_id) ?? 0) : 0;
        if (isAnaliseCredito(p.modality)) producao.analiseCredito += 1;
        if (p.status === 'submitted') carteira.propostaQtd += 1;
        else if (p.status === 'reserved') carteira.emContratoQtd += 1;
        else if (p.status === 'sold') carteira.assinadoQtd += 1;
        carteira.vgv += valor;

        const empId = p.external_unit_id ? unitEmp.get(p.external_unit_id) : undefined;
        if (empId) porEmpreendimento.set(empId, (porEmpreendimento.get(empId) ?? 0) + 1);

        const nome = (p.broker_name ?? '').trim();
        if (nome) {
          const key = nome.toLowerCase();
          const cur = parceiroMap.get(key) ?? { nome, tipo: p.broker_type, propostas: 0, vgv: 0 };
          cur.propostas += 1;
          cur.vgv += valor;
          if (!cur.tipo && p.broker_type) cur.tipo = p.broker_type;
          parceiroMap.set(key, cur);
        }
      }

      const parceiros = [...parceiroMap.values()]
        .sort((a, b) => b.vgv - a.vgv || b.propostas - a.propostas)
        .slice(0, 10);

      return { producao, carteira, parceiros, porEmpreendimento };
    },
  });
}
