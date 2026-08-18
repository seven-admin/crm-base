import { useQuery } from '@tanstack/react-query';
import { addMonths, format, isValid, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { ContratoStatus } from '@/types/contratos.types';
import type { NexaVisitaStatus } from '@/types/nexa.types';

// nexa_atividades ainda não consta nos tipos gerados do Supabase.
/* eslint-disable @typescript-eslint/no-explicit-any */

type ContractVariables = Record<string, unknown>;

export interface PerformanceContract {
  id: string;
  numero: string | null;
  cliente_nome: string | null;
  status: ContratoStatus | string;
  valor_contrato: number | null;
  valor: number | null;
  data_assinatura: string | null;
  data_geracao: string | null;
  created_at: string;
  variaveis_valores: ContractVariables | null;
  cliente?: { id: string; nome: string } | null;
  unidade?: { id: string; numero: string } | null;
}

interface PerformanceVisit {
  id: string;
  status: NexaVisitaStatus | null;
  data_hora: string;
}

interface PerformanceProposal {
  status: string;
  external_unit_id: string | null;
  modality: string | null;
}

export interface PerformanceFinancialBreakdown {
  disponivel: boolean;
  recursosProprios: number;
  financiamento: number;
  beneficios: number;
  total: number;
}

export interface PerformanceCompositionPoint extends PerformanceFinancialBreakdown {
  contratoId: string;
  unidade: string;
}

export interface PerformanceProposalStage {
  status: 'submitted' | 'reserved' | 'sold';
  label: string;
  quantidade: number;
}

export interface PerformanceTimelinePoint {
  key: string;
  label: string;
  valor: number;
  acumulado: number;
}

export interface PerformanceCadencePoint {
  key: string;
  label: string;
  vendas: number;
  acumulado: number;
}

export interface PerformancePartner {
  nome: string;
  contratos: number;
  vgv: number;
}

export interface PerformanceVisitOutcome {
  status: NexaVisitaStatus;
  label: string;
  quantidade: number;
}

export interface PerformanceData {
  contratos: PerformanceContract[];
  contratosAssinados: number;
  vgvContratado: number;
  vgvCompleto: boolean;
  evolucaoVgvCompleta: boolean;
  cadenciaCompleta: boolean;
  visitas: number;
  visitasEmAcompanhamento: number;
  visitasNoShow: number;
  evolucaoVgv: PerformanceTimelinePoint[];
  cadencia: PerformanceCadencePoint[];
  parceiros: PerformancePartner[];
  desfechosVisitas: PerformanceVisitOutcome[];
  financeiroPorContrato: Record<string, PerformanceFinancialBreakdown>;
  composicaoPorUnidade: PerformanceCompositionPoint[];
  composicaoCobertura: number;
  financiamentoConhecido: number;
  financiamentoCompleto: boolean;
  funilPropostasDisponivel: boolean;
  funilPropostas: PerformanceProposalStage[];
  propostasFinanciadas: number;
  propostasFinanciadasEmAberto: number;
}

const VISIT_STATUS: Array<{ status: NexaVisitaStatus; label: string }> = [
  { status: 'agendada', label: 'Agendadas' },
  { status: 'confirmada', label: 'Confirmadas' },
  { status: 'realizada', label: 'Realizadas' },
  { status: 'no_show', label: 'Não compareceu' },
  { status: 'cancelada', label: 'Canceladas' },
];

const PAYMENT_KEYS = [
  'pagamento_financiamento',
  'pagamento_fgts',
  'pagamento_subsidio',
  'pagamento_subsidio_entrada',
  'pagamento_sinal',
  'pagamento_ato',
  'pagamento_mensais',
  'pagamento_baloes',
  'pagamento_dacao',
] as const;

const PROPOSAL_STAGES: Array<{ status: PerformanceProposalStage['status']; label: string }> = [
  { status: 'submitted', label: 'Enviadas' },
  { status: 'reserved', label: 'Reservadas' },
  { status: 'sold', label: 'Vendidas' },
];

function contractValue(contract: PerformanceContract) {
  const directValue = contract.valor_contrato ?? contract.valor;
  if (directValue != null) {
    const value = Number(directValue);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return (
    parseMoney(contract.variaveis_valores?.valor_contrato)
    ?? parseMoney(contract.variaveis_valores?.valor_unidade)
    ?? 0
  );
}

function hasContractValue(contract: PerformanceContract) {
  return contractValue(contract) > 0;
}

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;

  const raw = value.trim().replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
  if (!raw) return null;
  const lastDot = raw.lastIndexOf('.');
  const dotLooksLikeThousands = lastDot >= 0 && raw.length - lastDot - 1 === 3;
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : dotLooksLikeThousands
      ? raw.replace(/\./g, '')
      : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function paymentValue(contract: PerformanceContract, key: typeof PAYMENT_KEYS[number]) {
  return parseMoney(contract.variaveis_valores?.[key]);
}

function contractFinancialBreakdown(contract: PerformanceContract): PerformanceFinancialBreakdown {
  const total = contractValue(contract);
  const hasPaymentPlan = PAYMENT_KEYS.some((key) => paymentValue(contract, key) != null);
  if (!hasContractValue(contract) || total <= 0 || !hasPaymentPlan) {
    return { disponivel: false, recursosProprios: 0, financiamento: 0, beneficios: 0, total };
  }

  const financiamento = paymentValue(contract, 'pagamento_financiamento') ?? 0;
  const beneficios = (
    (paymentValue(contract, 'pagamento_fgts') ?? 0)
    + (paymentValue(contract, 'pagamento_subsidio') ?? 0)
    + (paymentValue(contract, 'pagamento_subsidio_entrada') ?? 0)
  );
  const recursosProprios = total - financiamento - beneficios;

  if (financiamento < 0 || beneficios < 0 || recursosProprios < -0.01) {
    return { disponivel: false, recursosProprios: 0, financiamento: 0, beneficios: 0, total };
  }

  return {
    disponivel: true,
    recursosProprios: Math.max(0, recursosProprios),
    financiamento,
    beneficios,
    total,
  };
}

function validDate(value: string | null) {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

function contractPartner(contract: PerformanceContract) {
  const variables = contract.variaveis_valores ?? {};
  const realEstate = String(variables.imobiliaria ?? '').trim();
  const broker = String(variables.corretor_nome ?? '').trim();
  return realEstate || broker || 'Não informado';
}

function contractUnit(contract: PerformanceContract) {
  const variableUnit = String(contract.variaveis_valores?.unidade_numero ?? '').trim();
  return contract.unidade?.numero || variableUnit || contract.numero || 'Sem unidade';
}

function isFinancedProposal(proposal: PerformanceProposal) {
  const modality = proposal.modality?.trim().toLowerCase();
  return Boolean(modality && modality !== 'fluxo direto');
}

function buildPerformanceData(
  contracts: PerformanceContract[],
  visits: PerformanceVisit[],
  proposals: PerformanceProposal[],
  proposalIntegrationAvailable: boolean,
): PerformanceData {
  const signed = contracts.filter((contract) => contract.status === 'assinado');
  const vgvContratado = signed.reduce((total, contract) => total + contractValue(contract), 0);
  const vgvCompleto = signed.every(hasContractValue);
  const signaturesComplete = signed.every((contract) => Boolean(validDate(contract.data_assinatura)));

  const dailyVgv = new Map<string, number>();
  const weeklySales = new Map<string, number>();
  const partnerMap = new Map<string, PerformancePartner>();
  const financeiroPorContrato: Record<string, PerformanceFinancialBreakdown> = {};

  for (const contract of contracts) {
    financeiroPorContrato[contract.id] = contractFinancialBreakdown(contract);
  }

  for (const contract of signed) {
    const value = contractValue(contract);
    const signatureDate = validDate(contract.data_assinatura);
    if (signatureDate) {
      const dayKey = format(signatureDate, 'yyyy-MM-dd');
      dailyVgv.set(dayKey, (dailyVgv.get(dayKey) ?? 0) + value);

      const weekKey = format(startOfWeek(signatureDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      weeklySales.set(weekKey, (weeklySales.get(weekKey) ?? 0) + 1);
    }

    const partnerName = contractPartner(contract);
    const current = partnerMap.get(partnerName) ?? { nome: partnerName, contratos: 0, vgv: 0 };
    current.contratos += 1;
    current.vgv += value;
    partnerMap.set(partnerName, current);
  }

  let accumulatedVgv = 0;
  const evolucaoVgv = [...dailyVgv.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([key, valor]) => {
      accumulatedVgv += valor;
      return { key, label: format(parseISO(key), 'dd/MM'), valor, acumulado: accumulatedVgv };
    });

  let accumulatedSales = 0;
  const cadencia = [...weeklySales.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([key, vendas]) => {
      accumulatedSales += vendas;
      return { key, label: format(parseISO(key), 'dd/MM'), vendas, acumulado: accumulatedSales };
    });

  const desfechosVisitas = VISIT_STATUS.map(({ status, label }) => ({
    status,
    label,
    quantidade: visits.filter((visit) => visit.status === status).length,
  }));

  const composicaoPorUnidade = signed.flatMap((contract) => {
    const financial = financeiroPorContrato[contract.id];
    if (!financial.disponivel) return [];
    return [{ ...financial, contratoId: contract.id, unidade: contractUnit(contract) }];
  });
  const financiamentoConhecido = composicaoPorUnidade.reduce((total, item) => total + item.financiamento, 0);
  const financedProposals = proposals.filter(isFinancedProposal);
  const funilPropostas = PROPOSAL_STAGES.map(({ status, label }) => ({
    status,
    label,
    quantidade: financedProposals.filter((proposal) => proposal.status === status).length,
  }));

  return {
    contratos: contracts,
    contratosAssinados: signed.length,
    vgvContratado,
    vgvCompleto,
    evolucaoVgvCompleta: vgvCompleto && signaturesComplete,
    cadenciaCompleta: signaturesComplete,
    visitas: visits.length,
    visitasEmAcompanhamento: visits.filter((visit) => visit.status === 'agendada' || visit.status === 'confirmada').length,
    visitasNoShow: visits.filter((visit) => visit.status === 'no_show').length,
    evolucaoVgv,
    cadencia,
    parceiros: [...partnerMap.values()].sort((a, b) => b.vgv - a.vgv || b.contratos - a.contratos).slice(0, 10),
    desfechosVisitas,
    financeiroPorContrato,
    composicaoPorUnidade,
    composicaoCobertura: composicaoPorUnidade.length,
    financiamentoConhecido,
    financiamentoCompleto: signed.length === composicaoPorUnidade.length,
    funilPropostasDisponivel: proposalIntegrationAvailable,
    funilPropostas,
    propostasFinanciadas: financedProposals.length,
    propostasFinanciadasEmAberto: financedProposals.filter((proposal) => proposal.status === 'submitted' || proposal.status === 'reserved').length,
  };
}

export function usePerformanceData(empreendimentoId: string) {
  return useQuery({
    queryKey: ['performance', empreendimentoId],
    enabled: Boolean(empreendimentoId),
    staleTime: 60_000,
    queryFn: async () => {
      const proposalPeriodStart = startOfMonth(new Date());
      const proposalPeriodEnd = addMonths(proposalPeriodStart, 1);
      const [contractsResponse, visitsResponse, unitsResponse, proposalsResponse] = await Promise.all([
        (supabase.from('nexa_contratos' as any) as any)
          .select(`
            id, numero, cliente_nome, status, valor_contrato, valor, data_assinatura,
            data_geracao, created_at, variaveis_valores,
            cliente:seven_clientes(id, nome),
            unidade:seven_unidades(id, numero)
          `)
          .eq('empreendimento_id', empreendimentoId)
          .order('created_at', { ascending: false }),
        (supabase.from('nexa_atividades' as any) as any)
          .select('id, status, data_hora')
          .eq('tipo', 'atendimento')
          .eq('empreendimento_id', empreendimentoId)
          .not('status', 'is', null)
          .order('data_hora', { ascending: false }),
        supabase
          .from('seven_unidades')
          .select('id')
          .eq('empreendimento_id', empreendimentoId),
        supabase.functions.invoke('propostas', {
          body: {
            dashboard: true,
            from: proposalPeriodStart.toISOString(),
            to: proposalPeriodEnd.toISOString(),
          },
        }),
      ]);

      if (contractsResponse.error) throw contractsResponse.error;
      if (visitsResponse.error) throw visitsResponse.error;
      if (unitsResponse.error) throw unitsResponse.error;

      const unitIds = new Set((unitsResponse.data ?? []).map((unit) => unit.id));
      const proposalIntegrationAvailable = !proposalsResponse.error && !proposalsResponse.data?.error;
      const proposals = proposalIntegrationAvailable
        ? ((proposalsResponse.data?.items ?? []) as PerformanceProposal[])
          .filter((proposal) => proposal.external_unit_id && unitIds.has(proposal.external_unit_id))
        : [];

      return buildPerformanceData(
        (contractsResponse.data ?? []) as PerformanceContract[],
        (visitsResponse.data ?? []) as PerformanceVisit[],
        proposals,
        proposalIntegrationAvailable,
      );
    },
  });
}
