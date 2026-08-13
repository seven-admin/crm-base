import { useQuery } from '@tanstack/react-query';
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Dados da home do consultor ARQO (escopo: o próprio consultor).
// - Prioridades do dia: atendimentos de hoje e leads de retorno (followup/reagendar).
// - Carteira própria: clientes em atendimento + forecast (soma de valor_estimado).
// - Meta semanal de novos clientes: prospecção e ações realizadas × metas.

export interface ArqoConsultorHome {
  atendimentosHoje: number;
  retorno: number;
  clientesEmAtendimento: number;
  forecastVgv: number;
  prospeccaoSemana: number;
  acoesSemana: number;
  metaProspeccaoSemana: number;
  metaAcoesSemana: number;
  metaVgvSemana: number;
}

const RETORNO_ETAPAS = ['Aguardando Followup', 'Reagendar'];

export function useArqoConsultorHome() {
  const { user } = useAuth();
  const userId = user?.id;
  const now = new Date();
  const week = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  const today = { start: startOfDay(now), end: endOfDay(now) };

  return useQuery({
    queryKey: ['arqo', 'consultor-home', userId, week.start.toISOString().slice(0, 10)],
    enabled: !!userId,
    queryFn: async (): Promise<ArqoConsultorHome> => {
      const ref = now.toISOString().slice(0, 10);

      const [etapasRes, leadsRes, atendRes, prospRes, acoesRes, metaRes] = await Promise.all([
        supabase.from('arqo_funil_etapas').select('id, nome'),
        // Carteira própria (leads ativos em aberto do consultor)
        supabase.from('arqo_leads').select('etapa_id, valor_estimado')
          .eq('consultor_id', userId).eq('is_active', true).is('fechado_em', null),
        // Atendimentos de hoje
        (supabase.from('arqo_atendimentos' as any) as any).select('id', { count: 'exact', head: true })
          .eq('consultor_id', userId).gte('encerrado_em', today.start.toISOString()).lte('encerrado_em', today.end.toISOString()),
        // Prospecção da semana = leads atribuídos ao consultor na semana
        supabase.from('arqo_leads').select('id', { count: 'exact', head: true })
          .eq('consultor_id', userId).gte('atribuido_em', week.start.toISOString()).lte('atribuido_em', week.end.toISOString()),
        // Ações da semana = agendamentos criados pelo consultor na semana
        (supabase.from('arqo_agendamentos' as any) as any).select('id', { count: 'exact', head: true })
          .eq('responsavel_id', userId).gte('created_at', week.start.toISOString()).lte('created_at', week.end.toISOString()),
        // Meta vigente do consultor
        (supabase.from('arqo_metas_atendimento' as any) as any)
          .select('*, usuarios:arqo_meta_usuarios(user_id)')
          .eq('is_active', true),
      ]);

      const etapaNome = new Map<string, string>();
      for (const e of (etapasRes.data ?? []) as any[]) etapaNome.set(e.id, e.nome);

      const leads = (leadsRes.data ?? []) as any[];
      const clientesEmAtendimento = leads.length;
      const forecastVgv = leads.reduce((s, l) => s + Number(l.valor_estimado ?? 0), 0);
      const retorno = leads.filter((l) => RETORNO_ETAPAS.includes(etapaNome.get(l.etapa_id) ?? '')).length;

      // Meta vigente mais recente que cobre hoje e inclui o consultor.
      const metas = ((metaRes.data ?? []) as any[])
        .filter((m) => m.vigencia_inicio <= ref && (!m.vigencia_fim || m.vigencia_fim >= ref)
          && ((m.usuarios ?? []).some((u: any) => u.user_id === userId) || m.user_id === userId))
        .sort((a, b) => String(b.vigencia_inicio).localeCompare(String(a.vigencia_inicio)));
      const meta = metas[0];

      return {
        atendimentosHoje: atendRes.count ?? 0,
        retorno,
        clientesEmAtendimento,
        forecastVgv,
        prospeccaoSemana: prospRes.count ?? 0,
        acoesSemana: acoesRes.count ?? 0,
        metaProspeccaoSemana: Number(meta?.meta_semanal_prospeccao ?? 0),
        metaAcoesSemana: Number(meta?.meta_semanal_acoes ?? 0),
        metaVgvSemana: Number(meta?.meta_semanal_vgv ?? 0),
      };
    },
  });
}
