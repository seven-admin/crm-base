import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface TicketStats {
  total: number;
  internos: number;
  externos: number;
  porStatus: { status: string; count: number; interno: number; externo: number }[];
  porCategoria: { categoria: string; count: number; interno: number; externo: number }[];
  tempoMedioProducao: { interno: number | null; externo: number | null; geral: number | null };
  porMes: { mes: string; interno: number; externo: number }[];
  taxaConclusao: { interno: number; externo: number; geral: number };
}

const STATUS_LABELS: Record<string, string> = {
  'briefing': 'Aguardando Análise',
  'triagem': 'Ajuste',
  'em_producao': 'Em Produção',
  'revisao': 'Revisão',
  'aprovacao_cliente': 'Aprovação Cliente',
  'concluido': 'Concluído',
  'arquivado': 'Arquivado'
};

const CATEGORIA_LABELS: Record<string, string> = {
  'render_3d': 'Renders / 3D',
  'design_grafico': 'Design Gráfico',
  'video_animacao': 'Vídeos / Animação',
  'evento': 'Evento',
  'pedido_orcamento': 'Pedido de Orçamento'
};

export function useTicketStats(dateFrom?: Date, dateTo?: Date) {
  return useQuery({
    queryKey: ['ticket-stats', dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async (): Promise<TicketStats> => {
      let query = supabase
        .from('projetos_marketing')
        .select('*')
        .eq('is_active', true);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const tickets = data || [];
      
      // Contadores básicos
      const total = tickets.length;
      const internos = tickets.filter(t => t.is_interno).length;
      const externos = tickets.filter(t => !t.is_interno).length;

      // Por status
      const statusMap = new Map<string, { count: number; interno: number; externo: number }>();
      tickets.forEach(t => {
        const status = t.status as string;
        const current = statusMap.get(status) || { count: 0, interno: 0, externo: 0 };
        current.count++;
        if (t.is_interno) current.interno++;
        else current.externo++;
        statusMap.set(status, current);
      });
      const porStatus = Array.from(statusMap.entries()).map(([status, counts]) => ({
        status: STATUS_LABELS[status] || status,
        ...counts
      }));

      // Por categoria
      const categoriaMap = new Map<string, { count: number; interno: number; externo: number }>();
      tickets.forEach(t => {
        const categoria = t.categoria as string;
        const current = categoriaMap.get(categoria) || { count: 0, interno: 0, externo: 0 };
        current.count++;
        if (t.is_interno) current.interno++;
        else current.externo++;
        categoriaMap.set(categoria, current);
      });
      const porCategoria = Array.from(categoriaMap.entries()).map(([categoria, counts]) => ({
        categoria: CATEGORIA_LABELS[categoria] || categoria,
        ...counts
      }));

      // Tempo médio de produção (data_inicio até data_entrega)
      const calcularTempoMedio = (ticketsFiltrados: typeof tickets) => {
        const concluidos = ticketsFiltrados.filter(t => t.data_inicio && t.data_entrega);
        if (concluidos.length === 0) return null;
        
        const totalDias = concluidos.reduce((acc, t) => {
          const inicio = parseISO(t.data_inicio as string);
          const fim = parseISO(t.data_entrega as string);
          return acc + differenceInDays(fim, inicio);
        }, 0);
        
        return Math.round(totalDias / concluidos.length);
      };

      const tempoMedioProducao = {
        interno: calcularTempoMedio(tickets.filter(t => t.is_interno)),
        externo: calcularTempoMedio(tickets.filter(t => !t.is_interno)),
        geral: calcularTempoMedio(tickets)
      };

      // Por mês (últimos 6 meses)
      const mesMap = new Map<string, { interno: number; externo: number }>();
      tickets.forEach(t => {
        const mes = format(startOfMonth(parseISO(t.created_at)), 'MMM/yy', { locale: ptBR });
        const current = mesMap.get(mes) || { interno: 0, externo: 0 };
        if (t.is_interno) current.interno++;
        else current.externo++;
        mesMap.set(mes, current);
      });
      const porMes = Array.from(mesMap.entries())
        .map(([mes, counts]) => ({ mes, ...counts }))
        .slice(-6);

      // Taxa de conclusão
      const calcularTaxa = (ticketsFiltrados: typeof tickets) => {
        if (ticketsFiltrados.length === 0) return 0;
        const concluidos = ticketsFiltrados.filter(t => t.status === 'concluido').length;
        return Math.round((concluidos / ticketsFiltrados.length) * 100);
      };

      const taxaConclusao = {
        interno: calcularTaxa(tickets.filter(t => t.is_interno)),
        externo: calcularTaxa(tickets.filter(t => !t.is_interno)),
        geral: calcularTaxa(tickets)
      };

      return {
        total,
        internos,
        externos,
        porStatus,
        porCategoria,
        tempoMedioProducao,
        porMes,
        taxaConclusao
      };
    }
  });
}
