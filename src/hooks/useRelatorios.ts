import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

// Stats gerais do dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    refetchInterval: 60 * 1000, // Atualiza a cada 60 segundos
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const startOfLastMonth = startOfMonth(subMonths(now, 1));
      const endOfLastMonth = endOfMonth(subMonths(now, 1));

      // Total em vendas (contratos assinados)
      const { data: totalVendasData } = await supabase
        .from('contratos')
        .select('valor_contrato')
        .eq('is_active', true)
        .eq('status', 'assinado');

      const totalVendas = totalVendasData?.reduce((acc, c) => acc + (c.valor_contrato || 0), 0) || 0;

      // Vendas do mês atual
      const { data: vendasMesData } = await supabase
        .from('contratos')
        .select('valor_contrato')
        .eq('is_active', true)
        .eq('status', 'assinado')
        .gte('data_assinatura', startOfCurrentMonth.toISOString());

      const vendasMes = vendasMesData?.reduce((acc, c) => acc + (c.valor_contrato || 0), 0) || 0;

      // Vendas do mês anterior (para comparação)
      const { data: vendasMesAnteriorData } = await supabase
        .from('contratos')
        .select('valor_contrato')
        .eq('is_active', true)
        .eq('status', 'assinado')
        .gte('data_assinatura', startOfLastMonth.toISOString())
        .lte('data_assinatura', endOfLastMonth.toISOString());

      const vendasMesAnterior = vendasMesAnteriorData?.reduce((acc, c) => acc + (c.valor_contrato || 0), 0) || 0;

      // Clientes ativos (prospectos + qualificados + negociando)
      const { count: clientesAtivos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('fase', ['prospecto', 'qualificado', 'negociando']);

      // Negociações abertas (não fechadas)
      const { count: negociacoesAbertas } = await supabase
        .from('negociacoes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('etapa', 'in', '("fechado","perdido")');

      // Taxa de conversão (negociações fechadas / total)
      const { count: negociacoesTotal } = await supabase
        .from('negociacoes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: negociacoesFechadas } = await supabase
        .from('negociacoes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('etapa', 'fechado');

      const taxaConversao = negociacoesTotal && negociacoesTotal > 0
        ? Math.round((negociacoesFechadas || 0) / negociacoesTotal * 100)
        : 0;

      // Ticket médio
      const quantidadeContratos = totalVendasData?.length || 0;
      const ticketMedio = quantidadeContratos > 0 ? totalVendas / quantidadeContratos : 0;

      // Variação vs mês anterior
      const variacaoVendas = vendasMesAnterior > 0
        ? Math.round(((vendasMes - vendasMesAnterior) / vendasMesAnterior) * 100)
        : 0;

      return {
        totalVendas,
        vendasMes,
        vendasMesAnterior,
        variacaoVendas,
        leadsAtivos: clientesAtivos || 0,
        negociacoesAbertas: negociacoesAbertas || 0,
        taxaConversao,
        ticketMedio,
      };
    },
  });
}

// Vendas por mês (últimos 6 meses)
export function useVendasPorMes() {
  return useQuery({
    queryKey: ['vendas-por-mes'],
    refetchInterval: 2 * 60 * 1000, // Atualiza a cada 2 minutos
    queryFn: async () => {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      
      const { data } = await supabase
        .from('contratos')
        .select('valor_contrato, data_assinatura')
        .eq('is_active', true)
        .eq('status', 'assinado')
        .gte('data_assinatura', sixMonthsAgo.toISOString());

      const monthlyTotals = new Map<string, number>();
      
      data?.forEach(c => {
        if (c.data_assinatura) {
          const monthKey = format(new Date(c.data_assinatura), 'yyyy-MM');
          const current = monthlyTotals.get(monthKey) || 0;
          monthlyTotals.set(monthKey, current + (c.valor_contrato || 0));
        }
      });

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const key = format(date, 'yyyy-MM');
        months.push({
          mes: format(date, 'MMM'),
          mesCompleto: format(date, 'MMMM yyyy'),
          vendas: monthlyTotals.get(key) || 0,
        });
      }

      return months;
    },
  });
}

// Performance por corretor
export function usePerformanceCorretores() {
  return useQuery({
    queryKey: ['performance-corretores'],
    refetchInterval: 2 * 60 * 1000, // Atualiza a cada 2 minutos
    queryFn: async () => {
      const { data: contratos } = await supabase
        .from('contratos')
        .select(`valor_contrato, corretor_id, corretores (id, nome_completo)`)
        .eq('is_active', true)
        .eq('status', 'assinado')
        .not('corretor_id', 'is', null);

      const corretoresMap = new Map<string, { nome: string; vendas: number; unidades: number }>();

      contratos?.forEach((contrato) => {
        const corretorId = contrato.corretor_id;
        const corretorNome = contrato.corretores?.nome_completo || 'Desconhecido';
        const valor = contrato.valor_contrato || 0;

        if (!corretoresMap.has(corretorId!)) {
          corretoresMap.set(corretorId!, { nome: corretorNome, vendas: 0, unidades: 0 });
        }

        const atual = corretoresMap.get(corretorId!)!;
        atual.vendas += valor;
        atual.unidades += 1;
      });

      return Array.from(corretoresMap.entries())
        .map(([id, data]) => ({ id, nome: data.nome, vendas: data.vendas, unidades: data.unidades }))
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 10);
    },
  });
}

// Estatísticas de unidades
export function useUnidadesStats(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['unidades-stats', empreendimentoId],
    queryFn: async () => {
      let query = supabase.from('unidades').select('status').eq('is_active', true);
      if (empreendimentoId) query = query.eq('empreendimento_id', empreendimentoId);
      const { data } = await query;

      const stats = { disponivel: 0, reservada: 0, vendida: 0, bloqueada: 0, total: 0 };
      data?.forEach((unidade) => {
        stats.total++;
        const status = unidade.status as keyof typeof stats;
        if (status in stats) stats[status]++;
      });
      return stats;
    },
  });
}

// Vendas por empreendimento
export function useVendasPorEmpreendimento() {
  return useQuery({
    queryKey: ['vendas-por-empreendimento'],
    queryFn: async () => {
      const { data: contratos } = await supabase
        .from('contratos')
        .select(`valor_contrato, empreendimento_id, empreendimentos (id, nome)`)
        .eq('is_active', true)
        .eq('status', 'assinado');

      const empreendimentosMap = new Map<string, { nome: string; vendas: number; quantidade: number }>();

      contratos?.forEach((contrato) => {
        const empId = contrato.empreendimento_id;
        const empNome = contrato.empreendimentos?.nome || 'Desconhecido';
        const valor = contrato.valor_contrato || 0;

        if (!empreendimentosMap.has(empId)) {
          empreendimentosMap.set(empId, { nome: empNome, vendas: 0, quantidade: 0 });
        }
        const atual = empreendimentosMap.get(empId)!;
        atual.vendas += valor;
        atual.quantidade += 1;
      });

      return Array.from(empreendimentosMap.entries())
        .map(([id, data]) => ({ id, nome: data.nome, vendas: data.vendas, quantidade: data.quantidade }))
        .sort((a, b) => b.vendas - a.vendas);
    },
  });
}

// Vendas por período customizado
export function useVendasPorPeriodo(dataInicio: Date, dataFim: Date) {
  return useQuery({
    queryKey: ['vendas-periodo', dataInicio.toISOString(), dataFim.toISOString()],
    queryFn: async () => {
      const { data } = await supabase
        .from('contratos')
        .select(`id, numero, valor_contrato, data_assinatura, clientes (nome), empreendimentos (nome), corretores (nome_completo)`)
        .eq('is_active', true)
        .eq('status', 'assinado')
        .gte('data_assinatura', dataInicio.toISOString())
        .lte('data_assinatura', dataFim.toISOString())
        .order('data_assinatura', { ascending: false });

      return data?.map((c) => ({
        id: c.id,
        numero: c.numero,
        valor: c.valor_contrato || 0,
        dataAssinatura: c.data_assinatura,
        cliente: c.clientes?.nome || 'N/A',
        empreendimento: c.empreendimentos?.nome || 'N/A',
        corretor: c.corretores?.nome_completo || 'N/A',
      })) || [];
    },
  });
}

// Comissões por Gestor do Produto
export function useComissoesPorGestor(dataInicio?: Date, dataFim?: Date) {
  return useQuery({
    queryKey: ['comissoes-por-gestor', dataInicio?.toISOString(), dataFim?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('comissoes')
        .select(`
          id, valor_venda, valor_comissao, status, created_at,
          gestor:profiles!comissoes_gestor_id_fkey(id, full_name, cargo),
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('is_active', true);

      if (dataInicio) {
        query = query.gte('created_at', dataInicio.toISOString());
      }
      if (dataFim) {
        query = query.lte('created_at', dataFim.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Agrupar por gestor
      const gestoresMap = new Map<string, {
        id: string;
        nome: string;
        cargo: string | null;
        totalVendas: number;
        totalComissao: number;
        totalPago: number;
        totalPendente: number;
        quantidade: number;
        empreendimentos: Map<string, { id: string; nome: string; totalVendas: number; totalComissao: number; quantidade: number; }>;
      }>();
      
      data?.forEach(comissao => {
        const gestorId = comissao.gestor?.id;
        if (!gestorId) return;
        
        if (!gestoresMap.has(gestorId)) {
          gestoresMap.set(gestorId, {
            id: gestorId,
            nome: comissao.gestor.full_name,
            cargo: comissao.gestor.cargo,
            totalVendas: 0,
            totalComissao: 0,
            totalPago: 0,
            totalPendente: 0,
            quantidade: 0,
            empreendimentos: new Map()
          });
        }
        
        const gestor = gestoresMap.get(gestorId)!;
        gestor.totalVendas += Number(comissao.valor_venda);
        gestor.totalComissao += Number(comissao.valor_comissao || 0);
        gestor.quantidade += 1;
        
        if (comissao.status === 'pago') {
          gestor.totalPago += Number(comissao.valor_comissao || 0);
        } else {
          gestor.totalPendente += Number(comissao.valor_comissao || 0);
        }
        
        // Agrupar por empreendimento
        const empId = comissao.empreendimento?.id;
        if (empId) {
          if (!gestor.empreendimentos.has(empId)) {
            gestor.empreendimentos.set(empId, {
              id: empId,
              nome: comissao.empreendimento.nome,
              totalVendas: 0,
              totalComissao: 0,
              quantidade: 0
            });
          }
          const emp = gestor.empreendimentos.get(empId)!;
          emp.totalVendas += Number(comissao.valor_venda);
          emp.totalComissao += Number(comissao.valor_comissao || 0);
          emp.quantidade += 1;
        }
      });

      return Array.from(gestoresMap.values()).map(g => ({
        ...g,
        empreendimentos: Array.from(g.empreendimentos.values())
      })).sort((a, b) => b.totalComissao - a.totalComissao);
    }
  });
}

// Relatório de valores por bloco/quadra
export interface RelatorioValoresPorBloco {
  blocoId: string;
  blocoNome: string;
  qtdUnidades: number;
  areaTotal: number;
  valorTotal: number;
  valorMedio: number;
  valorM2Medio: number;
}

export function useRelatorioValores(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['relatorio-valores', empreendimentoId],
    queryFn: async (): Promise<{ porBloco: RelatorioValoresPorBloco[]; totais: RelatorioValoresPorBloco }> => {
      if (!empreendimentoId) {
        return { porBloco: [], totais: { blocoId: '', blocoNome: 'Total', qtdUnidades: 0, areaTotal: 0, valorTotal: 0, valorMedio: 0, valorM2Medio: 0 } };
      }

      const { data, error } = await supabase
        .from('unidades')
        .select(`
          id, numero, area_privativa, valor,
          bloco:blocos(id, nome)
        `)
        .eq('empreendimento_id', empreendimentoId)
        .eq('is_active', true);

      if (error) throw error;

      // Agrupar por bloco
      const blocoMap = new Map<string, {
        blocoId: string;
        blocoNome: string;
        qtdUnidades: number;
        areaTotal: number;
        valorTotal: number;
      }>();

      data?.forEach(unidade => {
        const blocoId = (unidade.bloco as { id: string; nome: string } | null)?.id || 'sem-bloco';
        const blocoNome = (unidade.bloco as { id: string; nome: string } | null)?.nome || 'Sem Bloco';

        if (!blocoMap.has(blocoId)) {
          blocoMap.set(blocoId, {
            blocoId,
            blocoNome,
            qtdUnidades: 0,
            areaTotal: 0,
            valorTotal: 0,
          });
        }

        const bloco = blocoMap.get(blocoId)!;
        bloco.qtdUnidades++;
        bloco.areaTotal += Number(unidade.area_privativa) || 0;
        bloco.valorTotal += Number(unidade.valor) || 0;
      });

      const porBloco: RelatorioValoresPorBloco[] = Array.from(blocoMap.values())
        .map(b => ({
          ...b,
          valorMedio: b.qtdUnidades > 0 ? b.valorTotal / b.qtdUnidades : 0,
          valorM2Medio: b.areaTotal > 0 ? b.valorTotal / b.areaTotal : 0,
        }))
        .sort((a, b) => a.blocoNome.localeCompare(b.blocoNome));

      const totais: RelatorioValoresPorBloco = {
        blocoId: '',
        blocoNome: 'TOTAL',
        qtdUnidades: porBloco.reduce((acc, b) => acc + b.qtdUnidades, 0),
        areaTotal: porBloco.reduce((acc, b) => acc + b.areaTotal, 0),
        valorTotal: porBloco.reduce((acc, b) => acc + b.valorTotal, 0),
        valorMedio: 0,
        valorM2Medio: 0,
      };
      totais.valorMedio = totais.qtdUnidades > 0 ? totais.valorTotal / totais.qtdUnidades : 0;
      totais.valorM2Medio = totais.areaTotal > 0 ? totais.valorTotal / totais.areaTotal : 0;

      return { porBloco, totais };
    },
    enabled: !!empreendimentoId,
  });
}
