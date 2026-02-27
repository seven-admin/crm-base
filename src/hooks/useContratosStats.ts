import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import type { ContratoStatus } from '@/types/contratos.types';

export interface ContratosStats {
  total: number;
  porStatus: Record<string, number>;
  valorPipeline: number;
  tempoMedioFechamento: number;
  taxaConversao: number;
  contratosEsteMes: number;
  valorEsteMes: number;
  contratosPendentes: Array<{
    id: string;
    numero: string;
    cliente: string;
    status: ContratoStatus;
    diasEmAberto: number;
    valorContrato: number;
  }>;
}

export function useContratosStats() {
  return useQuery({
    queryKey: ['contratos-stats'],
    refetchInterval: 60 * 1000, // Atualiza a cada 60 segundos
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<ContratosStats> => {
      const { data: contratos, error } = await supabase
        .from('contratos')
        .select(`
          id,
          numero,
          status,
          valor_contrato,
          data_geracao,
          data_aprovacao,
          created_at,
          cliente:clientes(nome)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrar comprador histórico
      const contratosValidos = (contratos || []).filter((c: any) => 
        !c.cliente?.nome?.toUpperCase().includes('COMPRADOR HISTÓRICO')
      );

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calcular estatísticas por status
      const porStatus: Record<string, number> = {};
      let valorPipeline = 0;
      let totalFechados = 0;
      let somaDiasFechamento = 0;
      let contratosEsteMes = 0;
      let valorEsteMes = 0;

      const contratosPendentes: ContratosStats['contratosPendentes'] = [];

      contratosValidos.forEach((c) => {
        // Contar por status
        porStatus[c.status] = (porStatus[c.status] || 0) + 1;

        // Valor do pipeline (contratos não finalizados)
        if (!['aprovado', 'reprovado', 'cancelado'].includes(c.status)) {
          valorPipeline += c.valor_contrato || 0;
        }

        // Tempo médio de fechamento
        if (c.data_aprovacao && c.data_geracao) {
          const dias = differenceInDays(new Date(c.data_aprovacao), new Date(c.data_geracao));
          somaDiasFechamento += dias;
          totalFechados++;
        }

        // Contratos este mês
        if (new Date(c.created_at) >= startOfMonth) {
          contratosEsteMes++;
          valorEsteMes += c.valor_contrato || 0;
        }

        // Contratos pendentes de ação
        if (['em_geracao', 'enviado_assinatura', 'enviado_incorporador'].includes(c.status)) {
          contratosPendentes.push({
            id: c.id,
            numero: c.numero,
            cliente: c.cliente?.nome || 'Cliente não informado',
            status: c.status as ContratoStatus,
            diasEmAberto: differenceInDays(now, new Date(c.data_geracao)),
            valorContrato: c.valor_contrato || 0,
          });
        }
      });

      // Taxa de conversão (aprovados / total finalizado)
      const totalFinalizados = (porStatus['aprovado'] || 0) + (porStatus['reprovado'] || 0) + (porStatus['cancelado'] || 0);
      const taxaConversao = totalFinalizados > 0 
        ? ((porStatus['aprovado'] || 0) / totalFinalizados) * 100 
        : 0;

      return {
        total: contratosValidos.length,
        porStatus,
        valorPipeline,
        tempoMedioFechamento: totalFechados > 0 ? Math.round(somaDiasFechamento / totalFechados) : 0,
        taxaConversao,
        contratosEsteMes,
        valorEsteMes,
        contratosPendentes: contratosPendentes.slice(0, 5),
      };
    },
  });
}
