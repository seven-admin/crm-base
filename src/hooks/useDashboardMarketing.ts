import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, subWeeks, format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Ticket, StatusTicket, CategoriaTicket, STATUS_COLORS, CATEGORIA_LABELS } from '@/types/marketing.types';

export interface DashboardMarketingData {
  // KPIs
  ticketsAtivos: number;
  emProducao: number;
  aguardandoAprovacao: number;
  concluidosPeriodo: number;
  atrasados: number;
  tempoMedioDias: number | null;
  
  // Distribuições
  porStatus: { status: string; label: string; count: number; color: string }[];
  porEtapa: { etapaId: string; nome: string; count: number; color: string; ordem: number }[];
  porCategoria: { categoria: string; label: string; count: number; interno: number; externo: number }[];
  internoVsExterno: { name: string; value: number; color: string }[];
  
  // Listas
  ticketsAtrasados: TicketResumo[];
  proximasEntregas: TicketResumo[];
  
  // Produtividade
  produtividadeEquipe: ProdutividadeMembro[];
  
  // Tendência
  entregasPorSemana: { semana: string; interno: number; externo: number; total: number }[];
}

export interface TicketResumo {
  id: string;
  codigo: string;
  titulo: string;
  categoria: CategoriaTicket;
  status: StatusTicket;
  data_previsao: string | null;
  cliente_nome: string | null;
  supervisor_nome: string | null;
  dias_atraso?: number;
  dias_restantes?: number;
  is_interno: boolean;
}

export interface ProdutividadeMembro {
  supervisor_id: string;
  nome: string;
  emProducao: number;
  concluidos: number;
  tempoMedio: number | null;
  score: number;
}

const STATUS_DB_TO_UI: Record<string, StatusTicket> = {
  'briefing': 'aguardando_analise',
  'triagem': 'aguardando_analise',
  'aguardando_analise': 'aguardando_analise',
  'em_producao': 'em_producao',
  'revisao': 'revisao',
  'aprovacao_cliente': 'aprovacao_cliente',
  'ajuste': 'ajuste',
  'concluido': 'concluido',
  'arquivado': 'arquivado',
};

const STATUS_COLORS_MAP: Record<StatusTicket, string> = {
  'aguardando_analise': 'hsl(var(--muted-foreground))',
  'em_producao': 'hsl(217, 91%, 60%)',
  'revisao': 'hsl(45, 93%, 47%)',
  'aprovacao_cliente': 'hsl(280, 67%, 60%)',
  'ajuste': 'hsl(25, 95%, 53%)',
  'concluido': 'hsl(142, 71%, 45%)',
  'arquivado': 'hsl(var(--muted-foreground))',
};

const STATUS_LABELS: Record<StatusTicket, string> = {
  'aguardando_analise': 'Aguardando Análise',
  'em_producao': 'Em Produção',
  'revisao': 'Revisão',
  'aprovacao_cliente': 'Aprovação Cliente',
  'ajuste': 'Ajuste',
  'concluido': 'Concluído',
  'arquivado': 'Arquivado',
};

const CATEGORIA_LABELS_MAP: Record<CategoriaTicket, string> = {
  'render_3d': 'Render 3D',
  'design_grafico': 'Design Gráfico',
  'video_animacao': 'Vídeo/Animação',
  'evento': 'Evento',
  'pedido_orcamento': 'Orçamento',
  'criacao_campanha': 'Criação de Campanha',
};

interface Filters {
  periodoInicio?: Date;
  periodoFim?: Date;
  categoria?: CategoriaTicket;
  tipo?: 'interno' | 'externo' | 'all';
  supervisorId?: string;
}

export function useDashboardMarketing(filters?: Filters) {
  return useQuery({
    queryKey: ['dashboard-marketing', filters],
    queryFn: async (): Promise<DashboardMarketingData> => {
      const hoje = new Date();
      const hojeStr = format(hoje, 'yyyy-MM-dd');
      
      // Período padrão: últimos 30 dias
      const periodoInicio = filters?.periodoInicio || subWeeks(hoje, 4);
      const periodoFim = filters?.periodoFim || hoje;
      
      // Buscar etapas de tickets (incluindo is_final para lógica de atrasados)
      const { data: etapas } = await supabase
        .from('ticket_etapas')
        .select('id, nome, cor, ordem, is_final')
        .eq('is_active', true)
        .order('ordem', { ascending: true });
      
      // Criar set de IDs de etapas finais para verificação rápida
      const etapasFinaisIds = new Set(
        (etapas || []).filter(e => e.is_final).map(e => e.id)
      );
      
      // Buscar todos os tickets
      let query = supabase
        .from('projetos_marketing')
        .select(`
          id,
          codigo,
          titulo,
          categoria,
          status,
          ticket_etapa_id,
          data_previsao,
          data_entrega,
          is_interno,
          created_at,
          supervisor_id,
          cliente:cliente_id(id, full_name),
          supervisor:supervisor_id(id, full_name)
        `)
        .eq('is_active', true);
      
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria as any);
      }
      
      if (filters?.tipo === 'interno') {
        query = query.eq('is_interno', true);
      } else if (filters?.tipo === 'externo') {
        query = query.eq('is_interno', false);
      }
      
      if (filters?.supervisorId) {
        query = query.eq('supervisor_id', filters.supervisorId);
      }
      
      const { data: tickets, error } = await query;
      
      if (error) throw error;
      
      const allTickets = (tickets || []).map((t: any) => ({
        ...t,
        status: STATUS_DB_TO_UI[t.status] || t.status as StatusTicket,
        supervisor_nome: t.supervisor?.full_name || null,
        cliente_nome: t.cliente?.full_name || null,
        data_conclusao: t.data_entrega,
      }));
      
      // KPIs
      const ticketsAtivos = allTickets.filter(t => 
        !['concluido', 'arquivado'].includes(t.status)
      ).length;
      
      const emProducao = allTickets.filter(t => t.status === 'em_producao').length;
      const aguardandoAprovacao = allTickets.filter(t => t.status === 'aprovacao_cliente').length;
      
      const concluidosPeriodo = allTickets.filter(t => {
        if (t.status !== 'concluido' || !t.data_conclusao) return false;
        const dataConclusao = parseISO(t.data_conclusao);
        return dataConclusao >= periodoInicio && dataConclusao <= periodoFim;
      }).length;
      
      const ticketsAtrasados: TicketResumo[] = allTickets
        .filter(t => {
          // Ignorar se status legado é final
          if (['concluido', 'arquivado'].includes(t.status)) return false;
          // Ignorar se está numa etapa dinâmica marcada como final
          if (t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id)) return false;
          if (!t.data_previsao) return false;
          return t.data_previsao < hojeStr;
        })
        .map(t => ({
          id: t.id,
          codigo: t.codigo,
          titulo: t.titulo,
          categoria: t.categoria as CategoriaTicket,
          status: t.status,
          data_previsao: t.data_previsao,
          cliente_nome: t.cliente_nome,
          supervisor_nome: t.supervisor_nome,
          is_interno: t.is_interno,
          dias_atraso: differenceInDays(hoje, parseISO(t.data_previsao!)),
        }))
        .sort((a, b) => (b.dias_atraso || 0) - (a.dias_atraso || 0));
      
      const atrasados = ticketsAtrasados.length;
      
      // Tempo médio de conclusão
      const ticketsConcluidos = allTickets.filter(t => 
        t.status === 'concluido' && t.data_conclusao && t.created_at
      );
      
      let tempoMedioDias: number | null = null;
      if (ticketsConcluidos.length > 0) {
        const totalDias = ticketsConcluidos.reduce((acc, t) => {
          const dias = differenceInDays(
            parseISO(t.data_conclusao!),
            parseISO(t.created_at)
          );
          return acc + Math.max(0, dias);
        }, 0);
        tempoMedioDias = Math.round((totalDias / ticketsConcluidos.length) * 10) / 10;
      }
      
      // Distribuição por status
      const statusCounts: Record<StatusTicket, number> = {
        'aguardando_analise': 0,
        'em_producao': 0,
        'revisao': 0,
        'aprovacao_cliente': 0,
        'ajuste': 0,
        'concluido': 0,
        'arquivado': 0,
      };
      
      allTickets.forEach(t => {
        if (statusCounts[t.status] !== undefined) {
          statusCounts[t.status]++;
        }
      });
      
      const porStatus = Object.entries(statusCounts)
        .filter(([status]) => status !== 'arquivado')
        .map(([status, count]) => ({
          status,
          label: STATUS_LABELS[status as StatusTicket],
          count,
          color: STATUS_COLORS_MAP[status as StatusTicket],
        }));
      
      // Distribuição por etapa dinâmica
      const etapaCountMap = new Map<string, number>();
      let semEtapaCount = 0;
      
      allTickets.forEach(t => {
        if (t.ticket_etapa_id) {
          const current = etapaCountMap.get(t.ticket_etapa_id) || 0;
          etapaCountMap.set(t.ticket_etapa_id, current + 1);
        } else {
          semEtapaCount++;
        }
      });
      
      const porEtapa = (etapas || []).map(etapa => ({
        etapaId: etapa.id,
        nome: etapa.nome,
        count: etapaCountMap.get(etapa.id) || 0,
        color: etapa.cor || '#6b7280',
        ordem: etapa.ordem,
      }));
      
      // Adicionar "Sem etapa" se houver tickets órfãos
      if (semEtapaCount > 0) {
        porEtapa.push({
          etapaId: 'sem-etapa',
          nome: 'Sem etapa definida',
          count: semEtapaCount,
          color: '#9ca3af',
          ordem: 999,
        });
      }
      
      // Distribuição por categoria
      const categoriaCounts: Record<CategoriaTicket, { total: number; interno: number; externo: number }> = {
        'render_3d': { total: 0, interno: 0, externo: 0 },
        'design_grafico': { total: 0, interno: 0, externo: 0 },
        'video_animacao': { total: 0, interno: 0, externo: 0 },
        'evento': { total: 0, interno: 0, externo: 0 },
        'pedido_orcamento': { total: 0, interno: 0, externo: 0 },
        'criacao_campanha': { total: 0, interno: 0, externo: 0 },
      };
      
      allTickets.forEach(t => {
        const cat = t.categoria as CategoriaTicket;
        if (categoriaCounts[cat]) {
          categoriaCounts[cat].total++;
          if (t.is_interno) {
            categoriaCounts[cat].interno++;
          } else {
            categoriaCounts[cat].externo++;
          }
        }
      });
      
      const porCategoria = Object.entries(categoriaCounts).map(([cat, counts]) => ({
        categoria: cat,
        label: CATEGORIA_LABELS_MAP[cat as CategoriaTicket],
        count: counts.total,
        interno: counts.interno,
        externo: counts.externo,
      }));
      
      // Interno vs Externo
      const internos = allTickets.filter(t => t.is_interno).length;
      const externos = allTickets.filter(t => !t.is_interno).length;
      
      const internoVsExterno = [
        { name: 'Externos', value: externos, color: 'hsl(217, 91%, 60%)' },
        { name: 'Internos', value: internos, color: 'hsl(280, 67%, 60%)' },
      ];
      
      // Próximas entregas (7 dias)
      const seteDiasFrente = format(new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      const proximasEntregas: TicketResumo[] = allTickets
        .filter(t => {
          if (['concluido', 'arquivado'].includes(t.status)) return false;
          if (!t.data_previsao) return false;
          return t.data_previsao >= hojeStr && t.data_previsao <= seteDiasFrente;
        })
        .map(t => ({
          id: t.id,
          codigo: t.codigo,
          titulo: t.titulo,
          categoria: t.categoria as CategoriaTicket,
          status: t.status,
          data_previsao: t.data_previsao,
          cliente_nome: t.cliente_nome,
          supervisor_nome: t.supervisor_nome,
          is_interno: t.is_interno,
          dias_restantes: differenceInDays(parseISO(t.data_previsao!), hoje),
        }))
        .sort((a, b) => (a.dias_restantes || 0) - (b.dias_restantes || 0));
      
      // Produtividade da equipe
      const supervisorMap = new Map<string, {
        nome: string;
        emProducao: number;
        concluidos: number;
        diasTotal: number;
        countConcluidos: number;
      }>();
      
      allTickets.forEach(t => {
        if (!t.supervisor_id) return;
        
        if (!supervisorMap.has(t.supervisor_id)) {
          supervisorMap.set(t.supervisor_id, {
            nome: t.supervisor_nome || 'Sem nome',
            emProducao: 0,
            concluidos: 0,
            diasTotal: 0,
            countConcluidos: 0,
          });
        }
        
        const sup = supervisorMap.get(t.supervisor_id)!;
        
        if (t.status === 'em_producao') {
          sup.emProducao++;
        }
        
        if (t.status === 'concluido' && t.data_conclusao) {
          const dataConclusao = parseISO(t.data_conclusao);
          if (dataConclusao >= periodoInicio && dataConclusao <= periodoFim) {
            sup.concluidos++;
            if (t.created_at) {
              const dias = differenceInDays(dataConclusao, parseISO(t.created_at));
              sup.diasTotal += Math.max(0, dias);
              sup.countConcluidos++;
            }
          }
        }
      });
      
      const produtividadeEquipe: ProdutividadeMembro[] = Array.from(supervisorMap.entries())
        .map(([id, data]) => {
          const tempoMedio = data.countConcluidos > 0 
            ? Math.round((data.diasTotal / data.countConcluidos) * 10) / 10 
            : null;
          
          // Score: concluídos * 10 - (tempo médio * 2) - (em produção pendente)
          const score = Math.max(0, 
            (data.concluidos * 10) - 
            ((tempoMedio || 0) * 2) - 
            (data.emProducao * 2)
          );
          
          return {
            supervisor_id: id,
            nome: data.nome,
            emProducao: data.emProducao,
            concluidos: data.concluidos,
            tempoMedio,
            score: Math.round(score),
          };
        })
        .sort((a, b) => b.score - a.score);
      
      // Entregas por semana (últimas 8 semanas)
      const entregasPorSemana: { semana: string; interno: number; externo: number; total: number }[] = [];
      
      for (let i = 7; i >= 0; i--) {
        const inicioSemana = startOfWeek(subWeeks(hoje, i), { weekStartsOn: 1 });
        const fimSemana = new Date(inicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        const semanaLabel = format(inicioSemana, "dd/MM", { locale: ptBR });
        
        let interno = 0;
        let externo = 0;
        
        allTickets.forEach(t => {
          if (t.status !== 'concluido' || !t.data_conclusao) return;
          const dataConclusao = parseISO(t.data_conclusao);
          if (dataConclusao >= inicioSemana && dataConclusao <= fimSemana) {
            if (t.is_interno) {
              interno++;
            } else {
              externo++;
            }
          }
        });
        
        entregasPorSemana.push({
          semana: semanaLabel,
          interno,
          externo,
          total: interno + externo,
        });
      }
      
      return {
        ticketsAtivos,
        emProducao,
        aguardandoAprovacao,
        concluidosPeriodo,
        atrasados,
        tempoMedioDias,
        porStatus,
        porEtapa,
        porCategoria,
        internoVsExterno,
        ticketsAtrasados,
        proximasEntregas,
        produtividadeEquipe,
        entregasPorSemana,
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
