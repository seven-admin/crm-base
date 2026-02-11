import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, subDays } from 'date-fns';

export interface DashboardExecutivoData {
  vendas: {
    totalVendido: number;
    vendasMesAtual: number;
    vendasMesAnterior: number;
    variacaoMensal: number;
    ticketMedio: number;
    unidadesVendidas: number;
    tendencia: { mes: string; valor: number }[];
  };
  negociacoes: {
    total: number;
    porEtapa: { etapa: string; quantidade: number; valor: number }[];
    taxaConversao: number;
    novasHoje: number;
    tempoMedioFechamento: number;
  };
  financeiro: {
    receitasMes: number;
    despesasMes: number;
    saldoMes: number;
    aReceber: number;
    aPagar: number;
    tendencia: { mes: string; receitas: number; despesas: number }[];
  };
  comissoes: {
    totalPendente: number;
    totalPago: number;
    aVencer30Dias: number;
    porStatus: { status: string; valor: number; quantidade: number }[];
  };
  unidades: {
    total: number;
    disponiveis: number;
    reservadas: number;
    vendidas: number;
    bloqueadas: number;
    vgvDisponivel: number;
    vgvVendido: number;
    porEmpreendimento: { nome: string; disponiveis: number; vendidas: number; total: number }[];
  };
  marketing: {
    ticketsAbertos: number;
    ticketsEmAndamento: number;
    ticketsConcluidos: number;
    briefingsPendentes: number;
    slaAtrasados: number;
  };
  crm: {
    leadsQuentes: number;
    leadsMornos: number;
    leadsFrios: number;
    atividadesVencidas: number;
    followupsPendentes: number;
    clientesAtivos: number;
  };
  alertas: {
    tipo: 'urgente' | 'atencao' | 'info';
    titulo: string;
    descricao: string;
    link?: string;
    quantidade?: number;
  }[];
}

interface LancamentoRow {
  id: string;
  tipo: string;
  valor: number;
  status: string;
  data_vencimento: string;
  data_pagamento: string | null;
}

function applyEmpFilter(query: any, empreendimentoId?: string, empreendimentoIds?: string[]) {
  if (empreendimentoIds && empreendimentoIds.length > 0) {
    return query.in('empreendimento_id', empreendimentoIds);
  } else if (empreendimentoId) {
    return query.eq('empreendimento_id', empreendimentoId);
  }
  return query;
}

export function useDashboardExecutivo(empreendimentoId?: string, empreendimentoIds?: string[]) {
  return useQuery({
    queryKey: ['dashboard-executivo', empreendimentoId, empreendimentoIds],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DashboardExecutivoData> => {
      const hoje = new Date();
      const inicioMesAtual = startOfMonth(hoje);
      const fimMesAtual = endOfMonth(hoje);
      const inicioMesAnterior = startOfMonth(subMonths(hoje, 1));
      const fimMesAnterior = endOfMonth(subMonths(hoje, 1));
      const em30Dias = subDays(hoje, -30);

      // ============ PARALLEL GROUP 1: All independent queries ============
      let contratosQ = supabase
        .from('contratos')
        .select('id, valor_contrato, data_assinatura, empreendimento_id, created_at')
        .eq('is_active', true)
        .eq('status', 'assinado');
      contratosQ = applyEmpFilter(contratosQ, empreendimentoId, empreendimentoIds);

      let negociacoesQ = supabase
        .from('negociacoes')
        .select('id, etapa, valor_negociacao, funil_etapa_id, created_at, data_fechamento')
        .eq('is_active', true);
      negociacoesQ = applyEmpFilter(negociacoesQ, empreendimentoId, empreendimentoIds);

      let lancamentosQ = supabase
        .from('lancamentos_financeiros')
        .select('id, tipo, valor, status, data_vencimento, data_pagamento, empreendimento_id');
      lancamentosQ = applyEmpFilter(lancamentosQ, empreendimentoId, empreendimentoIds);

      let comissoesQ = supabase
        .from('comissoes')
        .select('id')
        .eq('is_active', true);
      comissoesQ = applyEmpFilter(comissoesQ, empreendimentoId, empreendimentoIds);

      let unidadesQ = supabase
        .from('unidades')
        .select('id, status, valor, empreendimento_id')
        .eq('is_active', true);
      unidadesQ = applyEmpFilter(unidadesQ, empreendimentoId, empreendimentoIds);

      let ticketsQ = supabase
        .from('projetos_marketing')
        .select('id, status, data_previsao, empreendimento_id')
        .eq('is_active', true);
      ticketsQ = applyEmpFilter(ticketsQ, empreendimentoId, empreendimentoIds);

      let briefingsQ = supabase
        .from('briefings')
        .select('id, status')
        .eq('is_active', true);
      briefingsQ = applyEmpFilter(briefingsQ, empreendimentoId, empreendimentoIds);

      const [
        { data: contratos },
        { data: negociacoes },
        { data: etapasFunil },
        { data: lancamentosRaw },
        { data: comissoes },
        { data: parcelas },
        { data: unidades },
        { data: empreendimentos },
        { data: tickets },
        { data: briefings },
        { data: clientes },
        { data: atividades },
      ] = await Promise.all([
        contratosQ,
        negociacoesQ,
        supabase.from('funil_etapas').select('id, nome, ordem').eq('is_active', true).order('ordem'),
        lancamentosQ,
        comissoesQ,
        supabase.from('comissao_parcelas').select('id, valor, status, data_vencimento, comissao_id'),
        unidadesQ,
        supabase.from('empreendimentos').select('id, nome').eq('is_active', true),
        ticketsQ,
        briefingsQ,
        supabase.from('clientes').select('id, temperatura, fase').eq('is_active', true),
        supabase.from('atividades').select('id, status, data_inicio, data_fim, requer_followup, data_followup'),
      ]);

      const lancamentos = (lancamentosRaw as LancamentoRow[] | null) || [];

      // ============ VENDAS ============
      const contratosMesAtual = contratos?.filter(c => {
        const data = new Date(c.data_assinatura || c.created_at);
        return data >= inicioMesAtual && data <= fimMesAtual;
      }) || [];

      const contratosMesAnterior = contratos?.filter(c => {
        const data = new Date(c.data_assinatura || c.created_at);
        return data >= inicioMesAnterior && data <= fimMesAnterior;
      }) || [];

      const totalVendido = contratos?.reduce((acc, c) => acc + (c.valor_contrato || 0), 0) || 0;
      const vendasMesAtual = contratosMesAtual.reduce((acc, c) => acc + (c.valor_contrato || 0), 0);
      const vendasMesAnterior = contratosMesAnterior.reduce((acc, c) => acc + (c.valor_contrato || 0), 0);
      const variacaoMensal = vendasMesAnterior > 0 
        ? ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100 
        : 0;
      const ticketMedio = contratos?.length ? totalVendido / contratos.length : 0;

      const tendenciaVendas: { mes: string; valor: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const mesRef = subMonths(hoje, i);
        const inicioMes = startOfMonth(mesRef);
        const fimMes = endOfMonth(mesRef);
        const vendasMes = contratos?.filter(c => {
          const data = new Date(c.data_assinatura || c.created_at);
          return data >= inicioMes && data <= fimMes;
        }).reduce((acc, c) => acc + (c.valor_contrato || 0), 0) || 0;
        tendenciaVendas.push({ mes: format(mesRef, 'MMM'), valor: vendasMes });
      }

      // ============ NEGOCIAÇÕES ============
      const negociacoesAtivas = negociacoes?.filter(n => 
        !['fechado', 'perdido'].includes(n.etapa)
      ) || [];

      const negociacoesGanhas = negociacoes?.filter(n => n.etapa === 'fechado') || [];
      const taxaConversao = negociacoes?.length 
        ? (negociacoesGanhas.length / negociacoes.length) * 100 
        : 0;

      let tempoMedioFechamento = 0;
      const negociacoesComFechamento = negociacoes?.filter(n => n.data_fechamento) || [];
      if (negociacoesComFechamento.length > 0) {
        const totalDias = negociacoesComFechamento.reduce((acc, n) => {
          const created = new Date(n.created_at).getTime();
          const fechado = new Date(n.data_fechamento!).getTime();
          return acc + Math.max(0, (fechado - created) / (1000 * 60 * 60 * 24));
        }, 0);
        tempoMedioFechamento = Math.round(totalDias / negociacoesComFechamento.length);
      }

      const hojeStr = format(hoje, 'yyyy-MM-dd');
      const novasHoje = negociacoes?.filter(n => 
        format(new Date(n.created_at), 'yyyy-MM-dd') === hojeStr
      ).length || 0;

      const porEtapa = (etapasFunil || []).map(etapa => {
        const negociacoesEtapa = negociacoesAtivas.filter(n => n.funil_etapa_id === etapa.id);
        return {
          etapa: etapa.nome,
          quantidade: negociacoesEtapa.length,
          valor: negociacoesEtapa.reduce((acc, n) => acc + (Number(n.valor_negociacao) || 0), 0)
        };
      });

      // ============ FINANCEIRO ============
      const receitasMes = lancamentos
        .filter(l => l.tipo === 'receita' && l.status === 'pago')
        .filter(l => {
          const data = new Date(l.data_pagamento || l.data_vencimento);
          return data >= inicioMesAtual && data <= fimMesAtual;
        })
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      const despesasMes = lancamentos
        .filter(l => l.tipo === 'despesa' && l.status === 'pago')
        .filter(l => {
          const data = new Date(l.data_pagamento || l.data_vencimento);
          return data >= inicioMesAtual && data <= fimMesAtual;
        })
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      const aReceber = lancamentos
        .filter(l => l.tipo === 'receita' && l.status === 'pendente')
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      const aPagar = lancamentos
        .filter(l => l.tipo === 'despesa' && l.status === 'pendente')
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      const tendenciaFinanceiro: { mes: string; receitas: number; despesas: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const mesRef = subMonths(hoje, i);
        const inicioMes = startOfMonth(mesRef);
        const fimMes = endOfMonth(mesRef);
        
        const receitasMesRef = lancamentos
          .filter(l => l.tipo === 'receita' && l.status === 'pago')
          .filter(l => {
            const data = new Date(l.data_pagamento || l.data_vencimento);
            return data >= inicioMes && data <= fimMes;
          })
          .reduce((acc, l) => acc + (l.valor || 0), 0);

        const despesasMesRef = lancamentos
          .filter(l => l.tipo === 'despesa' && l.status === 'pago')
          .filter(l => {
            const data = new Date(l.data_pagamento || l.data_vencimento);
            return data >= inicioMes && data <= fimMes;
          })
          .reduce((acc, l) => acc + (l.valor || 0), 0);

        tendenciaFinanceiro.push({ 
          mes: format(mesRef, 'MMM'), 
          receitas: receitasMesRef, 
          despesas: despesasMesRef 
        });
      }

      // ============ COMISSÕES ============
      const parcelasComissoes = comissoes?.map(c => c.id) || [];
      const parcelasFiltradas = parcelas?.filter(p => parcelasComissoes.includes(p.comissao_id)) || [];

      const totalPendente = parcelasFiltradas
        .filter(p => p.status === 'pendente' || p.status === 'atrasada')
        .reduce((acc, p) => acc + (p.valor || 0), 0);

      const totalPago = parcelasFiltradas
        .filter(p => p.status === 'paga')
        .reduce((acc, p) => acc + (p.valor || 0), 0);

      const aVencer30Dias = parcelasFiltradas
        .filter(p => {
          if (p.status !== 'pendente') return false;
          const vencimento = new Date(p.data_vencimento);
          return vencimento >= hoje && vencimento <= em30Dias;
        })
        .reduce((acc, p) => acc + (p.valor || 0), 0);

      // ============ UNIDADES ============
      const unidadesDisponiveis = unidades?.filter(u => u.status === 'disponivel') || [];
      const unidadesReservadas = unidades?.filter(u => u.status === 'reservada') || [];
      const unidadesVendidas = unidades?.filter(u => u.status === 'vendida') || [];
      const unidadesBloqueadas = unidades?.filter(u => u.status === 'bloqueada') || [];

      const vgvDisponivel = unidadesDisponiveis.reduce((acc, u) => acc + (u.valor || 0), 0);
      const vgvVendido = unidadesVendidas.reduce((acc, u) => acc + (u.valor || 0), 0);

      const porEmpreendimento = empreendimentos?.map(emp => {
        const unidadesEmp = unidades?.filter(u => u.empreendimento_id === emp.id) || [];
        return {
          nome: emp.nome,
          disponiveis: unidadesEmp.filter(u => u.status === 'disponivel').length,
          vendidas: unidadesEmp.filter(u => u.status === 'vendida').length,
          total: unidadesEmp.length
        };
      }).filter(e => e.total > 0) || [];

      // ============ MARKETING ============
      const ticketsAbertos = tickets?.filter(t => t.status === 'briefing' || t.status === 'triagem').length || 0;
      const ticketsEmAndamento = tickets?.filter(t => 
        ['em_producao', 'revisao', 'aprovacao_cliente'].includes(t.status)
      ).length || 0;
      const ticketsConcluidos = tickets?.filter(t => t.status === 'concluido').length || 0;
      const briefingsPendentes = briefings?.filter(b => b.status === 'pendente').length || 0;
      const slaAtrasados = tickets?.filter(t => {
        if (!t.data_previsao || t.status === 'concluido' || t.status === 'arquivado') return false;
        return new Date(t.data_previsao) < hoje;
      }).length || 0;

      // ============ CRM ============
      const leadsQuentes = clientes?.filter(c => c.temperatura === 'quente').length || 0;
      const leadsMornos = clientes?.filter(c => c.temperatura === 'morno').length || 0;
      const leadsFrios = clientes?.filter(c => c.temperatura === 'frio').length || 0;
      const clientesAtivos = clientes?.filter(c => c.fase !== 'perdido').length || 0;

      const atividadesVencidas = atividades?.filter(a => {
        if (a.status === 'concluida') return false;
        return new Date(a.data_fim) < hoje;
      }).length || 0;

      const followupsPendentes = atividades?.filter(a => {
        if (!a.requer_followup || !a.data_followup) return false;
        return new Date(a.data_followup) <= hoje && a.status !== 'concluida';
      }).length || 0;

      // ============ ALERTAS ============
      const alertas: DashboardExecutivoData['alertas'] = [];

      if (atividadesVencidas > 0) {
        alertas.push({
          tipo: 'urgente',
          titulo: 'Atividades Vencidas',
          descricao: `${atividadesVencidas} atividade(s) precisam de atenção imediata`,
          link: '/atividades',
          quantidade: atividadesVencidas
        });
      }

      if (followupsPendentes > 0) {
        alertas.push({
          tipo: 'atencao',
          titulo: 'Follow-ups Pendentes',
          descricao: `${followupsPendentes} follow-up(s) aguardando realização`,
          link: '/atividades',
          quantidade: followupsPendentes
        });
      }

      if (briefingsPendentes > 0) {
        alertas.push({
          tipo: 'atencao',
          titulo: 'Briefings Pendentes',
          descricao: `${briefingsPendentes} briefing(s) aguardando triagem`,
          link: '/briefings',
          quantidade: briefingsPendentes
        });
      }

      if (slaAtrasados > 0) {
        alertas.push({
          tipo: 'urgente',
          titulo: 'Tickets com SLA Atrasado',
          descricao: `${slaAtrasados} ticket(s) ultrapassaram o prazo`,
          link: '/marketing',
          quantidade: slaAtrasados
        });
      }

      if (aVencer30Dias > 0) {
        alertas.push({
          tipo: 'info',
          titulo: 'Comissões a Vencer',
          descricao: `R$ ${aVencer30Dias.toLocaleString('pt-BR')} em comissões nos próximos 30 dias`,
          link: '/comissoes',
          quantidade: 1
        });
      }

      return {
        vendas: {
          totalVendido,
          vendasMesAtual,
          vendasMesAnterior,
          variacaoMensal,
          ticketMedio,
          unidadesVendidas: contratos?.length || 0,
          tendencia: tendenciaVendas
        },
        negociacoes: {
          total: negociacoesAtivas.length,
          porEtapa,
          taxaConversao,
          novasHoje,
          tempoMedioFechamento
        },
        financeiro: {
          receitasMes,
          despesasMes,
          saldoMes: receitasMes - despesasMes,
          aReceber,
          aPagar,
          tendencia: tendenciaFinanceiro
        },
        comissoes: {
          totalPendente,
          totalPago,
          aVencer30Dias,
          porStatus: [
            { status: 'Pendente', valor: totalPendente, quantidade: parcelasFiltradas.filter(p => p.status === 'pendente' || p.status === 'atrasada').length },
            { status: 'Pago', valor: totalPago, quantidade: parcelasFiltradas.filter(p => p.status === 'paga').length }
          ]
        },
        unidades: {
          total: unidades?.length || 0,
          disponiveis: unidadesDisponiveis.length,
          reservadas: unidadesReservadas.length,
          vendidas: unidadesVendidas.length,
          bloqueadas: unidadesBloqueadas.length,
          vgvDisponivel,
          vgvVendido,
          porEmpreendimento
        },
        marketing: {
          ticketsAbertos,
          ticketsEmAndamento,
          ticketsConcluidos,
          briefingsPendentes,
          slaAtrasados
        },
        crm: {
          leadsQuentes,
          leadsMornos,
          leadsFrios,
          atividadesVencidas,
          followupsPendentes,
          clientesAtivos
        },
        alertas
      };
    },
  });
}
