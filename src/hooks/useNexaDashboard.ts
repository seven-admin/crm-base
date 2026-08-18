import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Agregados NEXA da home comercial, montados ao vivo a partir do edge function `propostas`
// (Supabase externo). O VGV vem de seven_unidades.valor casado por external_unit_id — o feed
// de propostas não carrega valor numérico, mas a unidade sim.

type PropostaRaw = {
  proposal_code: string;
  status: string;
  created_at: string;
  external_unit_id: string | null;
  project_name: string | null;
  broker_name: string | null;
  broker_type: string | null;
  broker_email: string | null;
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

export interface NexaArqoConsultor {
  consultorId: string;
  nome: string;
  propostas: number;
  vgv: number;
}

export interface NexaArqoOperacao {
  carteira: { propostaQtd: number; assinadoQtd: number; vgv: number };
  consultores: NexaArqoConsultor[];
}

export interface NexaDashboard {
  producao: { propostas: number; analiseCredito: number };
  carteira: NexaCarteira;
  parceiros: NexaParceiro[];
  porEmpreendimento: Map<string, number>; // empreendimento_id -> nº de propostas no mês
  vgvPorEmpreendimento: Map<string, number>; // empreendimento_id -> VGV das propostas no mês
  arqo: NexaArqoOperacao;
}

const ATIVAS = new Set(['submitted', 'reserved', 'sold']);
const ARQO_EMAIL_DOMAIN = '@arqoimobiliaria.com.br';
const POSTGREST_IN_CHUNK_SIZE = 200;

const normalizeEmail = (email: string | null | undefined) => email?.trim().toLowerCase() ?? '';
const isArqoEmail = (email: string | null | undefined) => normalizeEmail(email).endsWith(ARQO_EMAIL_DOMAIN);

// "Análise de crédito" = proposta financiada (qualquer modalidade que não seja Fluxo Direto).
const isAnaliseCredito = (modality: string | null) =>
  !!modality && modality.trim().toLowerCase() !== 'fluxo direto';

export function useNexaDashboard(ref: Date) {
  const loDate = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const hiDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  const lo = loDate.getTime();
  const hi = hiDate.getTime();
  const refKey = `${ref.getFullYear()}-${ref.getMonth() + 1}`;
  return useQuery({
    queryKey: ['dashboard-home', 'nexa-operacao', refKey],
    staleTime: 60_000,
    queryFn: async (): Promise<NexaDashboard> => {
      const { data, error } = await supabase.functions.invoke('propostas', {
        body: { dashboard: true, from: loDate.toISOString(), to: hiDate.toISOString() },
      });
      if (error) throw error;
      const propostas = ((data?.items ?? []) as PropostaRaw[]).filter((p) => {
        if (!ATIVAS.has(p.status)) return false;
        const t = new Date(p.created_at).getTime();
        return t >= lo && t < hi;
      });

      // valor + empreendimento das unidades ligadas às propostas
      const unitIds = [...new Set(propostas.map((p) => p.external_unit_id).filter(Boolean))] as string[];
      const unitValor = new Map<string, number>();
      const unitEmp = new Map<string, string>();
      const unitChunks = Array.from(
        { length: Math.ceil(unitIds.length / POSTGREST_IN_CHUNK_SIZE) },
        (_, index) => unitIds.slice(index * POSTGREST_IN_CHUNK_SIZE, (index + 1) * POSTGREST_IN_CHUNK_SIZE),
      );
      const [unidadesResults, profilesRes] = await Promise.all([
        Promise.all(unitChunks.map((ids) => (
          supabase
            .from('seven_unidades')
            .select('id, valor, empreendimento_id')
            .in('id', ids)
        ))),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('is_active', true)
          .ilike('email', `%${ARQO_EMAIL_DOMAIN}`),
      ]);
      if (profilesRes.error) throw profilesRes.error;

      for (const result of unidadesResults) {
        if (result.error) throw result.error;
        for (const u of result.data ?? []) {
          unitValor.set(u.id, Number(u.valor ?? 0));
          if (u.empreendimento_id) unitEmp.set(u.id, u.empreendimento_id);
        }
      }

      const profileByEmail = new Map<string, { id: string; nome: string }>();
      for (const profile of profilesRes.data ?? []) {
        const email = normalizeEmail(profile.email);
        if (email) profileByEmail.set(email, { id: profile.id, nome: profile.full_name || profile.email });
      }

      const carteira: NexaCarteira = { propostaQtd: 0, emContratoQtd: 0, assinadoQtd: 0, vgv: 0 };
      const producao = { propostas: propostas.length, analiseCredito: 0 };
      const parceiroMap = new Map<string, NexaParceiro>();
      const porEmpreendimento = new Map<string, number>();
      const vgvPorEmpreendimento = new Map<string, number>();
      const arqoCarteira = { propostaQtd: 0, assinadoQtd: 0, vgv: 0 };
      const arqoConsultorMap = new Map<string, NexaArqoConsultor>();

      for (const p of propostas) {
        const valor = p.external_unit_id ? (unitValor.get(p.external_unit_id) ?? 0) : 0;
        if (isAnaliseCredito(p.modality)) producao.analiseCredito += 1;

        const empId = p.external_unit_id ? unitEmp.get(p.external_unit_id) : undefined;
        if (empId) {
          porEmpreendimento.set(empId, (porEmpreendimento.get(empId) ?? 0) + 1);
          vgvPorEmpreendimento.set(empId, (vgvPorEmpreendimento.get(empId) ?? 0) + valor);
        }

        if (isArqoEmail(p.broker_email)) {
          if (p.status === 'sold') arqoCarteira.assinadoQtd += 1;
          else arqoCarteira.propostaQtd += 1; // submitted e reserved permanecem em proposta na ARQO
          arqoCarteira.vgv += valor;

          const profile = profileByEmail.get(normalizeEmail(p.broker_email));
          if (profile) {
            const cur = arqoConsultorMap.get(profile.id) ?? {
              consultorId: profile.id,
              nome: profile.nome,
              propostas: 0,
              vgv: 0,
            };
            cur.propostas += 1;
            cur.vgv += valor;
            arqoConsultorMap.set(profile.id, cur);
          }
          continue;
        }

        if (p.status === 'submitted') carteira.propostaQtd += 1;
        else if (p.status === 'reserved') carteira.emContratoQtd += 1;
        else if (p.status === 'sold') carteira.assinadoQtd += 1;
        carteira.vgv += valor;

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

      return {
        producao,
        carteira,
        parceiros,
        porEmpreendimento,
        vgvPorEmpreendimento,
        arqo: { carteira: arqoCarteira, consultores: [...arqoConsultorMap.values()] },
      };
    },
  });
}
