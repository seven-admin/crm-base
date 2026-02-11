import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, differenceInDays, parseISO } from 'date-fns';

export interface TicketResumo {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  data_previsao: string | null;
  categoria: string;
}

export interface MembroEquipe {
  id: string;
  nome: string;
  avatar_url: string | null;
  cargo: string | null;
  emProducao: number;
  aguardando: number;
  revisao: number;
  concluidos: number;
  tempoMedio: number | null;
  taxaNoPrazo: number;
  totalTickets: number;
  ticketsEmProducao: TicketResumo[];
  ticketsPendentes: TicketResumo[];
  ticketsConcluidos: TicketResumo[];
}

export interface EquipeMarketingData {
  membros: MembroEquipe[];
  kpis: {
    totalMembros: number;
    totalEmProducao: number;
    totalConcluidos: number;
    tempoMedioGeral: number | null;
    taxaNoPrazoGeral: number;
  };
  ticketsRecentes: {
    id: string;
    codigo: string;
    titulo: string;
    status: string;
    supervisor_id: string;
    supervisor_nome: string;
    data_entrega: string | null;
    data_previsao: string | null;
    categoria: string;
  }[];
}

interface Filters {
  periodoInicio?: Date;
  periodoFim?: Date;
}

export function useEquipeMarketing(filters?: Filters) {
  const periodoInicio = filters?.periodoInicio || startOfMonth(new Date());
  const periodoFim = filters?.periodoFim || endOfMonth(new Date());

  return useQuery({
    queryKey: ['equipe-criacao', periodoInicio.toISOString(), periodoFim.toISOString()],
    queryFn: async (): Promise<EquipeMarketingData> => {
      // Buscar o ID do módulo projetos_marketing
      const { data: moduloMarketing } = await supabase
        .from('modules')
        .select('id')
        .eq('name', 'projetos_marketing')
        .single();

      if (!moduloMarketing) {
        return { membros: [], kpis: { totalMembros: 0, totalEmProducao: 0, totalConcluidos: 0, tempoMedioGeral: null, taxaNoPrazoGeral: 0 }, ticketsRecentes: [] };
      }

      // 1. Buscar roles com acesso ao módulo projetos_marketing
      const { data: rolesComAcesso } = await supabase
        .from('role_permissions')
        .select('role_id')
        .eq('module_id', moduloMarketing.id)
        .eq('can_view', true);

      const roleIdsComAcesso = rolesComAcesso?.map(r => r.role_id).filter(Boolean) || [];

      // 2. Buscar usuários com esses roles (via role_id)
      const { data: usuariosViaRole } = roleIdsComAcesso.length > 0
        ? await supabase
            .from('user_roles')
            .select('user_id')
            .in('role_id', roleIdsComAcesso)
        : { data: [] };

      // 3. Buscar usuários com permissões customizadas no módulo
      const { data: usuariosCustom } = await supabase
        .from('user_module_permissions')
        .select('user_id')
        .eq('module_id', moduloMarketing.id)
        .eq('can_view', true);

      // 4. Combinar IDs únicos de ambas as fontes
      const todosUserIds = new Set<string>([
        ...(usuariosViaRole || []).map(u => u.user_id),
        ...(usuariosCustom || []).map(u => u.user_id)
      ]);

      if (todosUserIds.size === 0) {
        return { membros: [], kpis: { totalMembros: 0, totalEmProducao: 0, totalConcluidos: 0, tempoMedioGeral: null, taxaNoPrazoGeral: 0 }, ticketsRecentes: [] };
      }

      // 5. Buscar roles admin/super_admin para exclusão
      const { data: rolesAdmin } = await supabase
        .from('roles')
        .select('id')
        .in('name', ['admin', 'super_admin']);

      const adminRoleIds = new Set(rolesAdmin?.map(r => r.id) || []);

      // 6. Buscar quais usuários têm roles de admin
      const { data: adminsUsers } = adminRoleIds.size > 0
        ? await supabase
            .from('user_roles')
            .select('user_id')
            .in('role_id', Array.from(adminRoleIds))
        : { data: [] };

      const adminUserIds = new Set(adminsUsers?.map(a => a.user_id) || []);

      // 7. Filtrar removendo admins
      const userIdsFiltrados = Array.from(todosUserIds).filter(id => !adminUserIds.has(id));

      if (userIdsFiltrados.length === 0) {
        return { membros: [], kpis: { totalMembros: 0, totalEmProducao: 0, totalConcluidos: 0, tempoMedioGeral: null, taxaNoPrazoGeral: 0 }, ticketsRecentes: [] };
      }

      // 8. Buscar profiles dos usuários filtrados
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, cargo')
        .in('id', userIdsFiltrados);

      const membrosEquipe = (profiles || []).map(p => ({
        id: p.id,
        nome: p.full_name || 'Sem nome',
        avatar_url: p.avatar_url,
        cargo: p.cargo
      }));

      // Buscar todos os tickets ativos
      const { data: tickets, error } = await supabase
        .from('projetos_marketing')
        .select(`
          id,
          codigo,
          titulo,
          status,
          categoria,
          supervisor_id,
          data_solicitacao,
          data_previsao,
          data_entrega,
          supervisor:profiles!projetos_marketing_supervisor_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Criar mapa de tickets por supervisor
      const ticketsPorSupervisor = new Map<string, typeof tickets>();
      tickets?.forEach(ticket => {
        if (!ticket.supervisor_id) return;
        if (!ticketsPorSupervisor.has(ticket.supervisor_id)) {
          ticketsPorSupervisor.set(ticket.supervisor_id, []);
        }
        ticketsPorSupervisor.get(ticket.supervisor_id)!.push(ticket);
      });

      // Calcular métricas para cada membro da equipe (baseado em permissões)
      const membros: MembroEquipe[] = membrosEquipe.map(membro => {
        const ticketsMembro = ticketsPorSupervisor.get(membro.id) || [];
        
        const emProducaoTickets = ticketsMembro.filter(t => t.status === 'em_producao');
        const aguardandoTickets = ticketsMembro.filter(t => t.status === 'briefing' || t.status === 'triagem');
        const revisaoTickets = ticketsMembro.filter(t => t.status === 'revisao' || t.status === 'aprovacao_cliente');
        
        // Tickets concluídos no período
        const ticketsConcluidos = ticketsMembro.filter(t => {
          if (t.status !== 'concluido' || !t.data_entrega) return false;
          const dataEntrega = parseISO(t.data_entrega);
          return dataEntrega >= periodoInicio && dataEntrega <= periodoFim;
        });
        
        const concluidos = ticketsConcluidos.length;

        // Tempo médio de entrega
        let tempoMedio: number | null = null;
        const tempos: number[] = [];
        
        ticketsConcluidos.forEach(t => {
          if (t.data_solicitacao && t.data_entrega) {
            const dias = differenceInDays(parseISO(t.data_entrega), parseISO(t.data_solicitacao));
            if (dias >= 0) tempos.push(dias);
          }
        });
        
        if (tempos.length > 0) {
          tempoMedio = Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
        }

        // Taxa de entregas no prazo
        let taxaNoPrazo = 0;
        const comPrazo = ticketsConcluidos.filter(t => t.data_previsao);
        if (comPrazo.length > 0) {
          const noPrazo = comPrazo.filter(t => {
            if (!t.data_entrega || !t.data_previsao) return false;
            return parseISO(t.data_entrega) <= parseISO(t.data_previsao);
          });
          taxaNoPrazo = Math.round((noPrazo.length / comPrazo.length) * 100);
        }

        const mapToResumo = (t: typeof ticketsMembro[0]): TicketResumo => ({
          id: t.id,
          codigo: t.codigo,
          titulo: t.titulo,
          status: t.status,
          data_previsao: t.data_previsao,
          categoria: t.categoria,
        });

        return {
          id: membro.id,
          nome: membro.nome,
          avatar_url: membro.avatar_url,
          cargo: membro.cargo,
          emProducao: emProducaoTickets.length,
          aguardando: aguardandoTickets.length,
          revisao: revisaoTickets.length,
          concluidos,
          tempoMedio,
          taxaNoPrazo,
          totalTickets: ticketsMembro.length,
          ticketsEmProducao: emProducaoTickets.map(mapToResumo),
          ticketsPendentes: [...aguardandoTickets, ...revisaoTickets].map(mapToResumo),
          ticketsConcluidos: ticketsConcluidos.map(mapToResumo),
        };
      });

      // Ordenar por total de tickets em andamento (maior carga primeiro)
      membros.sort((a, b) => (b.emProducao + b.aguardando + b.revisao) - (a.emProducao + a.aguardando + a.revisao));

      // Calcular KPIs gerais
      const totalEmProducao = membros.reduce((sum, m) => sum + m.emProducao, 0);
      const totalConcluidos = membros.reduce((sum, m) => sum + m.concluidos, 0);
      
      const temposMembros = membros.filter(m => m.tempoMedio !== null).map(m => m.tempoMedio!);
      const tempoMedioGeral = temposMembros.length > 0 
        ? Math.round(temposMembros.reduce((a, b) => a + b, 0) / temposMembros.length)
        : null;

      const taxasMembros = membros.filter(m => m.concluidos > 0);
      const taxaNoPrazoGeral = taxasMembros.length > 0
        ? Math.round(taxasMembros.reduce((sum, m) => sum + m.taxaNoPrazo, 0) / taxasMembros.length)
        : 0;

      // Tickets recentes (últimas entregas)
      const ticketsRecentes = tickets
        ?.filter(t => t.status === 'concluido' && t.data_entrega)
        .sort((a, b) => new Date(b.data_entrega!).getTime() - new Date(a.data_entrega!).getTime())
        .slice(0, 10)
        .map(t => {
          const supervisor = t.supervisor as { id: string; full_name: string } | null;
          return {
            id: t.id,
            codigo: t.codigo,
            titulo: t.titulo,
            status: t.status,
            supervisor_id: t.supervisor_id!,
            supervisor_nome: supervisor?.full_name || 'N/A',
            data_entrega: t.data_entrega,
            data_previsao: t.data_previsao,
            categoria: t.categoria
          };
        }) || [];

      return {
        membros,
        kpis: {
          totalMembros: membros.length,
          totalEmProducao,
          totalConcluidos,
          tempoMedioGeral,
          taxaNoPrazoGeral
        },
        ticketsRecentes
      };
    },
    staleTime: 30000,
    refetchInterval: 60000
  });
}
