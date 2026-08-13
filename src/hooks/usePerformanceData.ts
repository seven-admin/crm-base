import { useQuery } from '@tanstack/react-query';
import { format, isValid, parseISO, startOfWeek } from 'date-fns';
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
  evolucaoVgv: PerformanceTimelinePoint[];
  cadencia: PerformanceCadencePoint[];
  parceiros: PerformancePartner[];
  desfechosVisitas: PerformanceVisitOutcome[];
}

const VISIT_STATUS: Array<{ status: NexaVisitaStatus; label: string }> = [
  { status: 'agendada', label: 'Agendadas' },
  { status: 'confirmada', label: 'Confirmadas' },
  { status: 'realizada', label: 'Realizadas' },
  { status: 'no_show', label: 'Não compareceu' },
  { status: 'cancelada', label: 'Canceladas' },
];

function contractValue(contract: PerformanceContract) {
  const value = Number(contract.valor_contrato ?? contract.valor ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function hasContractValue(contract: PerformanceContract) {
  return contract.valor_contrato != null || contract.valor != null;
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

function buildPerformanceData(contracts: PerformanceContract[], visits: PerformanceVisit[]): PerformanceData {
  const signed = contracts.filter((contract) => contract.status === 'assinado');
  const vgvContratado = signed.reduce((total, contract) => total + contractValue(contract), 0);
  const vgvCompleto = signed.every(hasContractValue);
  const signaturesComplete = signed.every((contract) => Boolean(validDate(contract.data_assinatura)));

  const dailyVgv = new Map<string, number>();
  const weeklySales = new Map<string, number>();
  const partnerMap = new Map<string, PerformancePartner>();

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

  return {
    contratos: contracts,
    contratosAssinados: signed.length,
    vgvContratado,
    vgvCompleto,
    evolucaoVgvCompleta: vgvCompleto && signaturesComplete,
    cadenciaCompleta: signaturesComplete,
    visitas: visits.length,
    visitasEmAcompanhamento: visits.filter((visit) => visit.status === 'agendada' || visit.status === 'confirmada').length,
    evolucaoVgv,
    cadencia,
    parceiros: [...partnerMap.values()].sort((a, b) => b.vgv - a.vgv || b.contratos - a.contratos).slice(0, 10),
    desfechosVisitas,
  };
}

export function usePerformanceData(empreendimentoId: string) {
  return useQuery({
    queryKey: ['performance', empreendimentoId],
    enabled: Boolean(empreendimentoId),
    staleTime: 60_000,
    queryFn: async () => {
      const [contractsResponse, visitsResponse] = await Promise.all([
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
      ]);

      if (contractsResponse.error) throw contractsResponse.error;
      if (visitsResponse.error) throw visitsResponse.error;

      return buildPerformanceData(
        (contractsResponse.data ?? []) as PerformanceContract[],
        (visitsResponse.data ?? []) as PerformanceVisit[],
      );
    },
  });
}
