import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const VGV_STATUS = ['negociacao', 'reservada', 'contrato'] as const;

export interface DashboardKPIs {
  leadsMes: number;
  leadsMesAnterior: number;
  taxaConversao: number;
  taxaConversaoAnterior: number;
  vgvNegociacao: number;
  propostasAtivas: number;
  vendasMes: number;
  ticketMedio: number;
}

export interface FunilEtapaReal {
  etapa: string;
  quantidade: number;
  tipo: 'ativo' | 'ganho' | 'perdido';
  ordem: number;
}

export interface TopEmpreendimentoReal {
  id: string;
  nome: string;
  tipo: string;
  leadsMes: number;
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard-home', 'kpis'],
    queryFn: async (): Promise<DashboardKPIs> => {
      const now = new Date();
      const mesInicio = startOfMonth(now).toISOString();
      const mesFim = endOfMonth(now).toISOString();
      const mesAntInicio = startOfMonth(subMonths(now, 1)).toISOString();
      const mesAntFim = endOfMonth(subMonths(now, 1)).toISOString();

      // Etapas de "ganho" primeiro: os ganhos são contados no servidor (count exato), não
      // fatiando linhas no cliente — que estourava o limite de 1000 do PostgREST.
      const etapasRes = await supabase.from('arqo_funil_etapas').select('id, categoria');
      const ganhoIds = (etapasRes.data ?? []).filter((e: any) => e.categoria === 'ganho').map((e: any) => e.id);
      const ganhoCount = (from: string, to: string) => (
        ganhoIds.length === 0
          ? Promise.resolve({ count: 0 } as { count: number | null })
          : supabase.from('arqo_leads').select('id', { count: 'exact', head: true })
              .in('etapa_id', ganhoIds).gte('created_at', from).lte('created_at', to)
      );

      const [leadsMesRes, leadsAntRes, ganhoMesRes, ganhoAntRes, unidadesVgvRes, unidadesVendidasRes] = await Promise.all([
        supabase.from('arqo_leads').select('id', { count: 'exact', head: true }).gte('created_at', mesInicio).lte('created_at', mesFim),
        supabase.from('arqo_leads').select('id', { count: 'exact', head: true }).gte('created_at', mesAntInicio).lte('created_at', mesAntFim),
        ganhoCount(mesInicio, mesFim),
        ganhoCount(mesAntInicio, mesAntFim),
        supabase.from('seven_unidades').select('valor, status').in('status', VGV_STATUS).eq('is_active', true),
        supabase.from('seven_unidades').select('valor, data_venda').eq('status', 'vendida').gte('data_venda', mesInicio.slice(0, 10)).lte('data_venda', mesFim.slice(0, 10)),
      ]);

      const ganhoMes = ganhoMesRes.count ?? 0;
      const ganhoAnt = ganhoAntRes.count ?? 0;
      const totalMes = leadsMesRes.count ?? 0;
      const totalAnt = leadsAntRes.count ?? 0;

      const vgv = (unidadesVgvRes.data ?? []).reduce((s: number, u: any) => s + Number(u.valor ?? 0), 0);
      const propostas = (unidadesVgvRes.data ?? []).filter((u: any) => u.status === 'negociacao' || u.status === 'contrato').length;
      const vendasArr = unidadesVendidasRes.data ?? [];
      const vendasValor = vendasArr.reduce((s: number, u: any) => s + Number(u.valor ?? 0), 0);
      const ticket = vendasArr.length > 0 ? vendasValor / vendasArr.length : 0;

      return {
        leadsMes: leadsMesRes.count ?? 0,
        leadsMesAnterior: leadsAntRes.count ?? 0,
        taxaConversao: totalMes > 0 ? (ganhoMes / totalMes) * 100 : 0,
        taxaConversaoAnterior: totalAnt > 0 ? (ganhoAnt / totalAnt) * 100 : 0,
        vgvNegociacao: vgv,
        propostasAtivas: propostas,
        vendasMes: vendasArr.length,
        ticketMedio: ticket,
      };
    },
  });
}

// Data 'YYYY-MM-01' do mês de referência, para os RPCs escoparem a janela do mês.
function refParam(ref: Date) {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-01`;
}

export interface ArqoOperacao {
  producao: { prospeccao: number; agendamento: number; atendimento: number };
  carteira: { proposta_qtd: number; assinado_qtd: number; vgv: number };
}

export function useArqoOperacao(ref: Date) {
  const p_ref = refParam(ref);
  return useQuery({
    queryKey: ['dashboard-home', 'arqo-operacao', p_ref],
    queryFn: async (): Promise<ArqoOperacao> => {
      const { data, error } = await supabase.rpc('arqo_dashboard_operacao' as any, { p_ref });
      if (error) throw error;
      return data as ArqoOperacao;
    },
  });
}

export interface TopConsultorArqo {
  consultor_id: string;
  nome: string;
  visitas: number;
  qtd_leads: number;
  vgv: number;
}

export function useTopConsultoresArqo(ref: Date, limit = 7) {
  const p_ref = refParam(ref);
  return useQuery({
    queryKey: ['dashboard-home', 'top-consultores', p_ref, limit],
    queryFn: async (): Promise<TopConsultorArqo[]> => {
      const { data, error } = await supabase.rpc('arqo_top_consultores' as any, { p_limit: limit, p_ref });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ ...r, vgv: Number(r.vgv ?? 0) })) as TopConsultorArqo[];
    },
  });
}

export function useFunilArqoReal() {
  return useQuery({
    queryKey: ['dashboard-home', 'funil'],
    queryFn: async (): Promise<FunilEtapaReal[]> => {
      // Contagem por etapa agregada no servidor (RPC): evita o corte de 1000 linhas do
      // PostgREST que fazia o funil mostrar números errados com dezenas de milhares de leads.
      const [etapasRes, countsRes] = await Promise.all([
        supabase.from('arqo_funil_etapas').select('id, nome, categoria, ordem').eq('is_active', true).order('ordem'),
        supabase.rpc('arqo_funil_contagem' as any),
      ]);
      if (countsRes.error) throw countsRes.error;
      const counts = (countsRes.data ?? {}) as Record<string, number>;
      return (etapasRes.data ?? []).map((e: any) => ({
        etapa: e.nome,
        quantidade: counts[e.id] ?? 0,
        tipo: e.categoria === 'ganho' ? 'ganho' : e.categoria === 'perda' || e.categoria === 'descartado' ? 'perdido' : 'ativo',
        ordem: e.ordem,
      }));
    },
  });
}

export function useTopEmpreendimentosReal(ref: Date) {
  const p_ref = refParam(ref);
  return useQuery({
    queryKey: ['dashboard-home', 'top-empreendimentos', p_ref],
    queryFn: async (): Promise<TopEmpreendimentoReal[]> => {
      const [empsRes, leadsRes] = await Promise.all([
        supabase.from('seven_empreendimentos').select('id, nome, tipo').eq('is_active', true),
        supabase.rpc('arqo_leads_empreendimento_mes' as any, { p_ref }),
      ]);

      const leadCount = new Map<string, number>();
      for (const r of (leadsRes.data ?? []) as any[]) leadCount.set(r.empreendimento_id, r.qtd);

      return (empsRes.data ?? []).map((e: any) => ({
        id: e.id,
        nome: e.nome,
        tipo: e.tipo ?? '—',
        leadsMes: leadCount.get(e.id) ?? 0,
      }));
    },
  });
}
