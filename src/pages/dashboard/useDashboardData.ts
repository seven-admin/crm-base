import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const VGV_STATUS = ['negociacao', 'reservada', 'contrato'];

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
  leadsAtivos: number;
  propostas: number;
  vendasMes: number;
  vgvNegociado: number;
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

      const [leadsMesRes, leadsAntRes, etapasRes, leadsGanhoRes, leadsGanhoAntRes, leadsTotalRes, leadsTotalAntRes, unidadesVgvRes, unidadesVendidasRes] = await Promise.all([
        supabase.from('arqo_leads').select('id', { count: 'exact', head: true }).gte('created_at', mesInicio).lte('created_at', mesFim),
        supabase.from('arqo_leads').select('id', { count: 'exact', head: true }).gte('created_at', mesAntInicio).lte('created_at', mesAntFim),
        supabase.from('arqo_funil_etapas').select('id, categoria'),
        // ganho/total: leads fechados no mês vs abertos no mês
        supabase.from('arqo_leads').select('id, etapa_id').gte('created_at', mesInicio).lte('created_at', mesFim),
        supabase.from('arqo_leads').select('id, etapa_id').gte('created_at', mesAntInicio).lte('created_at', mesAntFim),
        supabase.from('arqo_leads').select('id', { count: 'exact', head: true }).gte('created_at', mesInicio).lte('created_at', mesFim),
        supabase.from('arqo_leads').select('id', { count: 'exact', head: true }).gte('created_at', mesAntInicio).lte('created_at', mesAntFim),
        supabase.from('seven_unidades').select('valor, status').in('status', VGV_STATUS).eq('is_active', true),
        supabase.from('seven_unidades').select('valor, data_venda').eq('status', 'vendida').gte('data_venda', mesInicio.slice(0, 10)).lte('data_venda', mesFim.slice(0, 10)),
      ]);

      const etapasMap = new Map((etapasRes.data ?? []).map((e: any) => [e.id, e.categoria]));
      const ganhoIds = new Set((etapasRes.data ?? []).filter((e: any) => e.categoria === 'ganho').map((e: any) => e.id));

      const ganhoMes = (leadsGanhoRes.data ?? []).filter((l: any) => ganhoIds.has(l.etapa_id)).length;
      const ganhoAnt = (leadsGanhoAntRes.data ?? []).filter((l: any) => ganhoIds.has(l.etapa_id)).length;
      const totalMes = leadsTotalRes.count ?? 0;
      const totalAnt = leadsTotalAntRes.count ?? 0;

      const vgv = (unidadesVgvRes.data ?? []).reduce((s: number, u: any) => s + Number(u.valor ?? 0), 0);
      const propostas = (unidadesVgvRes.data ?? []).filter((u: any) => u.status === 'negociacao' || u.status === 'contrato').length;
      const vendasArr = unidadesVendidasRes.data ?? [];
      const vendasValor = vendasArr.reduce((s: number, u: any) => s + Number(u.valor ?? 0), 0);
      const ticket = vendasArr.length > 0 ? vendasValor / vendasArr.length : 0;

      // silence unused
      void etapasMap;

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

export function useFunilArqoReal() {
  return useQuery({
    queryKey: ['dashboard-home', 'funil'],
    queryFn: async (): Promise<FunilEtapaReal[]> => {
      const [etapasRes, leadsRes] = await Promise.all([
        supabase.from('arqo_funil_etapas').select('id, nome, categoria, ordem').eq('is_active', true).order('ordem'),
        supabase.from('arqo_leads').select('etapa_id').eq('is_active', true),
      ]);
      const counts = new Map<string, number>();
      (leadsRes.data ?? []).forEach((l: any) => {
        counts.set(l.etapa_id, (counts.get(l.etapa_id) ?? 0) + 1);
      });
      return (etapasRes.data ?? []).map((e: any) => ({
        etapa: e.nome,
        quantidade: counts.get(e.id) ?? 0,
        tipo: e.categoria === 'ganho' ? 'ganho' : e.categoria === 'perda' || e.categoria === 'descartado' ? 'perdido' : 'ativo',
        ordem: e.ordem,
      }));
    },
  });
}

export function useTopEmpreendimentosReal() {
  return useQuery({
    queryKey: ['dashboard-home', 'top-empreendimentos'],
    queryFn: async (): Promise<TopEmpreendimentoReal[]> => {
      const now = new Date();
      const mesInicio = startOfMonth(now).toISOString().slice(0, 10);
      const mesFim = endOfMonth(now).toISOString().slice(0, 10);

      const [empsRes, unidadesRes, vendasRes, leadsRes] = await Promise.all([
        supabase.from('seven_empreendimentos').select('id, nome, tipo').eq('is_active', true),
        supabase.from('seven_unidades').select('empreendimento_id, valor, status').in('status', VGV_STATUS).eq('is_active', true),
        supabase.from('seven_unidades').select('empreendimento_id').eq('status', 'vendida').gte('data_venda', mesInicio).lte('data_venda', mesFim),
        supabase.from('arqo_leads').select('empreendimento_id').eq('is_active', true).is('fechado_em', null),
      ]);

      const emps = empsRes.data ?? [];
      const agg = new Map<string, { vgv: number; propostas: number; vendas: number; leads: number }>();
      emps.forEach((e: any) => agg.set(e.id, { vgv: 0, propostas: 0, vendas: 0, leads: 0 }));

      (unidadesRes.data ?? []).forEach((u: any) => {
        const a = agg.get(u.empreendimento_id);
        if (!a) return;
        a.vgv += Number(u.valor ?? 0);
        if (u.status === 'negociacao' || u.status === 'contrato') a.propostas += 1;
      });
      (vendasRes.data ?? []).forEach((u: any) => {
        const a = agg.get(u.empreendimento_id);
        if (a) a.vendas += 1;
      });
      (leadsRes.data ?? []).forEach((l: any) => {
        if (!l.empreendimento_id) return;
        const a = agg.get(l.empreendimento_id);
        if (a) a.leads += 1;
      });

      return emps
        .map((e: any) => {
          const a = agg.get(e.id)!;
          return {
            id: e.id,
            nome: e.nome,
            tipo: e.tipo ?? '—',
            leadsAtivos: a.leads,
            propostas: a.propostas,
            vendasMes: a.vendas,
            vgvNegociado: a.vgv,
          };
        })
        .sort((a, b) => b.vgvNegociado - a.vgvNegociado)
        .slice(0, 5);
    },
  });
}
