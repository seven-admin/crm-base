import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { dispararWebhook, getUsuarioLogado } from '@/lib/webhookUtils';

export interface MetaComercial {
  id: string;
  competencia: string;
  periodicidade: string;
  empreendimento_id: string | null;
  corretor_id: string | null;
  gestor_id: string | null;
  meta_valor: number;
  meta_unidades: number;
  meta_visitas: number;
  meta_atendimentos: number;
  meta_treinamentos: number;
  meta_propostas: number;
  created_at: string;
  updated_at: string;
}

// Pesos por etapa para cálculo de forecast ponderado
const ETAPA_PESOS: Record<string, number> = {
  lead: 0.10,
  atendimento: 0.20,
  visita: 0.35,
  negociacao: 0.65,
  fechado: 1.0,
  perdido: 0,
};

export function useMetasPorMes(competencia: Date, empreendimentoId?: string, periodicidade: string = 'mensal') {
  return useQuery({
    queryKey: ['metas-comerciais', format(competencia, 'yyyy-MM-dd'), empreendimentoId, periodicidade],
    queryFn: async () => {
      const competenciaStr = format(startOfMonth(competencia), 'yyyy-MM-dd');
      
      let query = supabase
        .from('metas_comerciais' as any)
        .select('*')
        .eq('competencia', competenciaStr)
        .eq('periodicidade', periodicidade);
      
      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      } else {
        query = query.is('empreendimento_id', null);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown as MetaComercial | null;
    },
  });
}

export function useVendasRealizadasMes(competencia: Date, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['vendas-realizadas', format(competencia, 'yyyy-MM'), empreendimentoId],
    queryFn: async () => {
      const inicio = startOfMonth(competencia);
      const fim = endOfMonth(competencia);
      
      let query = supabase
        .from('contratos')
        .select('id, valor_contrato, data_assinatura, empreendimento_id')
        .eq('status', 'assinado')
        .gte('data_assinatura', format(inicio, 'yyyy-MM-dd'))
        .lte('data_assinatura', format(fim, 'yyyy-MM-dd'));
      
      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const totalValor = data?.reduce((sum, c) => sum + (c.valor_contrato || 0), 0) || 0;
      const totalUnidades = data?.length || 0;
      
      return { totalValor, totalUnidades, contratos: data };
    },
  });
}

export function useForecastFechamento(competencia: Date, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['forecast-fechamento', format(competencia, 'yyyy-MM'), empreendimentoId],
    queryFn: async () => {
      let query = supabase
        .from('negociacoes')
        .select('id, valor_negociacao, etapa, data_previsao_fechamento, empreendimento_id, corretor_id')
        .not('etapa', 'in', '("fechado","perdido")');
      
      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let valorBruto = 0;
      let valorPonderado = 0;
      let quantidadePipeline = 0;
      
      data?.forEach(neg => {
        const valor = neg.valor_negociacao || 0;
        const peso = ETAPA_PESOS[neg.etapa] || 0;
        
        valorBruto += valor;
        valorPonderado += valor * peso;
        quantidadePipeline++;
      });
      
      return { valorBruto, valorPonderado, quantidadePipeline, negociacoes: data };
    },
  });
}

export function useRankingCorretoresMes(competencia: Date, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['ranking-corretores-mes', format(competencia, 'yyyy-MM'), empreendimentoId],
    queryFn: async () => {
      const inicio = startOfMonth(competencia);
      const fim = endOfMonth(competencia);
      
      let query = supabase
        .from('contratos')
        .select(`
          id, 
          valor_contrato, 
          data_assinatura,
          corretor:corretores(id, nome_completo)
        `)
        .eq('status', 'assinado')
        .gte('data_assinatura', format(inicio, 'yyyy-MM-dd'))
        .lte('data_assinatura', format(fim, 'yyyy-MM-dd'))
        .not('corretor_id', 'is', null);
      
      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const corretorMap = new Map<string, { nome: string; valor: number; unidades: number }>();
      
      data?.forEach(c => {
        const corretor = c.corretor as any;
        if (!corretor) return;
        
        const existing = corretorMap.get(corretor.id) || { nome: corretor.nome_completo, valor: 0, unidades: 0 };
        existing.valor += c.valor_contrato || 0;
        existing.unidades += 1;
        corretorMap.set(corretor.id, existing);
      });
      
      const ranking = Array.from(corretorMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);
      
      return ranking;
    },
  });
}

export function useHistoricoMetas(meses: number = 6, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['historico-metas', meses, empreendimentoId],
    queryFn: async () => {
      const hoje = new Date();
      const mesesAtras = subMonths(hoje, meses - 1);
      const inicioPeríodo = format(startOfMonth(mesesAtras), 'yyyy-MM-dd');
      const fimPeríodo = format(endOfMonth(hoje), 'yyyy-MM-dd');

      // Bulk query 1: all metas in the period
      let metaQuery = supabase
        .from('metas_comerciais' as any)
        .select('competencia, meta_valor')
        .gte('competencia', inicioPeríodo)
        .lte('competencia', fimPeríodo);
      
      if (empreendimentoId) {
        metaQuery = metaQuery.eq('empreendimento_id', empreendimentoId);
      } else {
        metaQuery = metaQuery.is('empreendimento_id', null);
      }

      // Bulk query 2: all signed contracts in the period
      let vendaQuery = supabase
        .from('contratos')
        .select('valor_contrato, data_assinatura')
        .eq('status', 'assinado')
        .gte('data_assinatura', inicioPeríodo)
        .lte('data_assinatura', fimPeríodo);
      
      if (empreendimentoId) {
        vendaQuery = vendaQuery.eq('empreendimento_id', empreendimentoId);
      }

      const [{ data: todasMetas }, { data: todosContratos }] = await Promise.all([
        metaQuery,
        vendaQuery,
      ]);

      // Build lookup maps
      const metasPorMes = new Map<string, number>();
      (todasMetas || []).forEach((m: any) => {
        const key = format(new Date(m.competencia), 'yyyy-MM');
        metasPorMes.set(key, (metasPorMes.get(key) || 0) + (m.meta_valor || 0));
      });

      const vendasPorMes = new Map<string, number>();
      (todosContratos || []).forEach((c: any) => {
        const key = format(new Date(c.data_assinatura), 'yyyy-MM');
        vendasPorMes.set(key, (vendasPorMes.get(key) || 0) + (c.valor_contrato || 0));
      });

      // Build result array
      const resultado: Array<{
        mes: string;
        mesLabel: string;
        meta: number;
        realizado: number;
      }> = [];

      for (let i = meses - 1; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const mesKey = format(data, 'yyyy-MM');
        resultado.push({
          mes: mesKey,
          mesLabel: format(data, 'MMM/yy'),
          meta: metasPorMes.get(mesKey) || 0,
          realizado: vendasPorMes.get(mesKey) || 0,
        });
      }
      
      // Se nenhum mês tem meta cadastrada, retornar vazio
      const temAlgumaMeta = resultado.some(r => r.meta > 0);
      return temAlgumaMeta ? resultado : [];
    },
  });
}

export function useCreateMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      competencia: string;
      periodicidade?: string;
      empreendimento_id?: string | null;
      corretor_id?: string | null;
      gestor_id?: string | null;
      meta_valor: number;
      meta_unidades: number;
      meta_visitas?: number;
      meta_atendimentos?: number;
      meta_treinamentos?: number;
      meta_propostas?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('metas_comerciais' as any)
        .upsert({
          competencia: data.competencia,
          periodicidade: data.periodicidade || 'mensal',
          empreendimento_id: data.empreendimento_id || null,
          corretor_id: data.corretor_id || null,
          gestor_id: data.gestor_id || null,
          meta_valor: data.meta_valor,
          meta_unidades: data.meta_unidades,
          meta_visitas: data.meta_visitas || 0,
          meta_atendimentos: data.meta_atendimentos || 0,
          meta_treinamentos: data.meta_treinamentos || 0,
          meta_propostas: data.meta_propostas || 0,
        }, {
          onConflict: 'metas_comerciais_unique_comp_emp_cor_ges_per',
        })
        .select()
        .single();
      
      if (error) throw error;

      const criador = await getUsuarioLogado();
      dispararWebhook('meta_comercial_criada', {
        competencia: data.competencia,
        empreendimento_id: data.empreendimento_id || null,
        meta_valor: data.meta_valor,
        meta_unidades: data.meta_unidades,
        meta_visitas: data.meta_visitas || 0,
        meta_atendimentos: data.meta_atendimentos || 0,
        meta_treinamentos: data.meta_treinamentos || 0,
        meta_propostas: data.meta_propostas || 0,
        criado_por: criador ? { id: criador.id, nome: criador.nome, telefone: criador.telefone } : null,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-comerciais'] });
      queryClient.invalidateQueries({ queryKey: ['historico-metas'] });
      queryClient.invalidateQueries({ queryKey: ['todas-metas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas-realizadas'] });
      queryClient.invalidateQueries({ queryKey: ['forecast-fechamento'] });
      queryClient.invalidateQueries({ queryKey: ['ranking-corretores-mes'] });
      queryClient.invalidateQueries({ queryKey: ['metas-vs-realizado-empreendimento'] });
    },
  });
}

export function useUpdateMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MetaComercial> }) => {
      const { data: result, error } = await supabase
        .from('metas_comerciais' as any)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-comerciais'] });
      queryClient.invalidateQueries({ queryKey: ['historico-metas'] });
      queryClient.invalidateQueries({ queryKey: ['todas-metas'] });
    },
  });
}

export interface MetaComercialComEmpreendimento extends MetaComercial {
  empreendimento?: {
    id: string;
    nome: string;
  } | null;
  gestor?: {
    id: string;
    full_name: string;
  } | null;
}

export function useTodasMetas(anoFiltro?: number) {
  return useQuery({
    queryKey: ['todas-metas', anoFiltro],
    queryFn: async () => {
      let query = supabase
        .from('metas_comerciais' as any)
        .select(`
          *,
          empreendimento:empreendimentos(id, nome),
          gestor:profiles!metas_comerciais_gestor_id_fkey(id, full_name)
        `)
        .order('competencia', { ascending: false });
      
      if (anoFiltro) {
        query = query.gte('competencia', `${anoFiltro}-01-01`)
                    .lte('competencia', `${anoFiltro}-12-31`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as MetaComercialComEmpreendimento[];
    },
  });
}

export function useDeleteMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('metas_comerciais' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-comerciais'] });
      queryClient.invalidateQueries({ queryKey: ['todas-metas'] });
      queryClient.invalidateQueries({ queryKey: ['historico-metas'] });
    },
  });
}

// Hook para buscar metas vs realizado por empreendimento - BULK version
export function useMetasVsRealizadoPorEmpreendimento(competencia: Date) {
  return useQuery({
    queryKey: ['metas-vs-realizado-empreendimento', format(competencia, 'yyyy-MM')],
    queryFn: async () => {
      const competenciaStr = format(startOfMonth(competencia), 'yyyy-MM-dd');
      const inicio = startOfMonth(competencia);
      const fim = endOfMonth(competencia);
      
      // 3 parallel bulk queries instead of N+1
      const [
        { data: empreendimentos },
        { data: todasMetas },
        { data: todasVendas },
      ] = await Promise.all([
        supabase.from('empreendimentos').select('id, nome').eq('is_active', true),
        supabase.from('metas_comerciais' as any)
          .select('empreendimento_id, meta_valor')
          .eq('competencia', competenciaStr)
          .not('empreendimento_id', 'is', null),
        supabase.from('contratos')
          .select('valor_contrato, empreendimento_id')
          .eq('status', 'assinado')
          .gte('data_assinatura', format(inicio, 'yyyy-MM-dd'))
          .lte('data_assinatura', format(fim, 'yyyy-MM-dd')),
      ]);

      // Build lookup maps
      const metasPorEmp = new Map<string, number>();
      (todasMetas || []).forEach((m: any) => {
        metasPorEmp.set(m.empreendimento_id, (metasPorEmp.get(m.empreendimento_id) || 0) + (m.meta_valor || 0));
      });

      const vendasPorEmp = new Map<string, number>();
      (todasVendas || []).forEach((v: any) => {
        if (v.empreendimento_id) {
          vendasPorEmp.set(v.empreendimento_id, (vendasPorEmp.get(v.empreendimento_id) || 0) + (v.valor_contrato || 0));
        }
      });

      const resultado: Array<{
        nome: string;
        meta: number;
        realizado: number;
        atingimento: number;
      }> = [];

      for (const emp of empreendimentos || []) {
        const meta = metasPorEmp.get(emp.id) || 0;
        if (meta > 0) {
          const realizado = vendasPorEmp.get(emp.id) || 0;
          resultado.push({
            nome: emp.nome.length > 20 ? emp.nome.substring(0, 18) + '...' : emp.nome,
            meta,
            realizado,
            atingimento: meta > 0 ? (realizado / meta) * 100 : 0
          });
        }
      }
      
      return resultado.sort((a, b) => b.realizado - a.realizado);
    },
  });
}

// Hook para copiar metas entre meses
export function useCopiarMetas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ origemCompetencia, destinoCompetencia }: {
      origemCompetencia: string;
      destinoCompetencia: string;
    }) => {
      const { data: metasOrigem, error: fetchError } = await supabase
        .from('metas_comerciais' as any)
        .select('*')
        .eq('competencia', origemCompetencia);
      
      if (fetchError) throw fetchError;
      if (!metasOrigem?.length) throw new Error('Nenhuma meta encontrada no mês de origem');
      
      const typedMetas = metasOrigem as unknown as MetaComercial[];
      
      for (const meta of typedMetas) {
        const { error } = await supabase
          .from('metas_comerciais' as any)
          .upsert({
            competencia: destinoCompetencia,
            periodicidade: (meta as any).periodicidade || 'mensal',
            empreendimento_id: meta.empreendimento_id,
            corretor_id: meta.corretor_id,
            meta_valor: meta.meta_valor,
            meta_unidades: meta.meta_unidades,
            meta_visitas: meta.meta_visitas || 0,
            meta_atendimentos: meta.meta_atendimentos || 0,
            meta_treinamentos: meta.meta_treinamentos || 0,
            meta_propostas: meta.meta_propostas || 0,
          }, {
            onConflict: 'metas_comerciais_unique_comp_emp_cor_ges_per',
          });
        
        if (error) throw error;
      }
      
      return typedMetas.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-comerciais'] });
      queryClient.invalidateQueries({ queryKey: ['todas-metas'] });
      queryClient.invalidateQueries({ queryKey: ['historico-metas'] });
    },
  });
}
