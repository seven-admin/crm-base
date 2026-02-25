import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Cliente, 
  ClienteFormData, 
  ClienteFilters,
  ClienteFase,
  ClienteTemperatura
} from '@/types/clientes.types';
import { toast } from 'sonner';
import { invalidateDashboards } from '@/lib/invalidateDashboards';
import { perf } from '@/lib/perf';

// Interface for bulk update data
export interface ClienteUpdateEmLoteData {
  gestor_id?: string | null;
  fase?: ClienteFase;
  temperatura?: ClienteTemperatura | null;
}

/**
 * Normalização removida do frontend — os triggers do banco (uppercase_clientes)
 * já fazem uppercase/lowercase automaticamente ao salvar.
 * Mantemos apenas um pass-through para não quebrar chamadas existentes.
 */
function normalizeClienteForSave<T extends Partial<ClienteFormData>>(data: T): T {
  return data;
}

// Helper para aplicar filtros
const applyFilters = (query: any, filters?: ClienteFilters) => {
  if (filters?.search) {
    query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`);
  }
  if (filters?.fase) {
    query = query.eq('fase', filters.fase);
  }
  if (filters?.corretor_id) {
    query = query.eq('corretor_id', filters.corretor_id);
  }
  if (filters?.imobiliaria_id) {
    query = query.eq('imobiliaria_id', filters.imobiliaria_id);
  }
  if (filters?.origem) {
    query = query.eq('origem', filters.origem);
  }
  if (filters?.gestor_id) {
    query = query.eq('gestor_id', filters.gestor_id);
  }
  return query;
};

export function useClientes(filters?: ClienteFilters) {
  return useQuery({
    queryKey: ['clientes', filters],
    queryFn: async () => {
      // Tenta com join de cônjuge
      let query = supabase
        .from('clientes')
        .select(`
          *,
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          gestor:profiles(id, full_name),
          empreendimento:empreendimentos(id, nome),
          conjuge:clientes!clientes_conjuge_id_fkey(id, nome)
        `)
        .eq('is_active', true)
        .neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)')
      .order('nome', { ascending: true });

      query = applyFilters(query, filters);

      const { data, error } = await query;
      
      // Fallback: se erro de schema, tenta sem o join de cônjuge
      if (error?.code === 'PGRST200') {
        console.warn('Schema cache error, retrying without conjuge join');
        let fallbackQuery = supabase
          .from('clientes')
          .select(`
            *,
            corretor:corretores(id, nome_completo),
            imobiliaria:imobiliarias(id, nome),
            gestor:profiles(id, full_name),
            empreendimento:empreendimentos(id, nome)
          `)
          .eq('is_active', true)
          .neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)')
          .order('nome', { ascending: true });

        fallbackQuery = applyFilters(fallbackQuery, filters);
        const fallback = await fallbackQuery;
        if (fallback.error) throw fallback.error;
        return (fallback.data || []).map((item: any) => ({
          ...item,
          conjuge: null
        })) as unknown as Cliente[];
      }
      
      if (error) throw error;
      
      // Supabase retorna array para self-referencing FK, normalizamos para objeto único
      const normalized = (data || []).map((item: any) => ({
        ...item,
        conjuge: Array.isArray(item.conjuge) ? item.conjuge[0] || null : item.conjuge
      }));
      return normalized as unknown as Cliente[];
    }
  });
}

// Versão paginada do hook
export function useClientesPaginated(filters?: ClienteFilters & { page?: number; pageSize?: number }) {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;

  return useQuery({
    queryKey: ['clientes-paginated', filters],
    queryFn: async () => {
      // Count total
      let countQuery = supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)');

      if (filters?.search) {
        countQuery = countQuery.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`);
      }
      if (filters?.fase) countQuery = countQuery.eq('fase', filters.fase);
      
      if (filters?.corretor_id) countQuery = countQuery.eq('corretor_id', filters.corretor_id);
      if (filters?.imobiliaria_id) countQuery = countQuery.eq('imobiliaria_id', filters.imobiliaria_id);
      if (filters?.origem) countQuery = countQuery.eq('origem', filters.origem);

      const { count } = await countQuery;

      // Paginated data
      let query = supabase
        .from('clientes')
        .select(`
          *,
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          gestor:profiles(id, full_name),
          empreendimento:empreendimentos(id, nome),
          conjuge:clientes!clientes_conjuge_id_fkey(id, nome)
        `)
        .eq('is_active', true)
        .neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)')
      .order('nome', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

      query = applyFilters(query, filters);

      const { data, error } = await query;
      
      // Fallback: se erro de schema, tenta sem o join de cônjuge
      if (error?.code === 'PGRST200') {
        console.warn('Schema cache error, retrying without conjuge join (paginated)');
        let fallbackQuery = supabase
          .from('clientes')
          .select(`
            *,
            corretor:corretores(id, nome_completo),
            imobiliaria:imobiliarias(id, nome),
            gestor:profiles(id, full_name),
            empreendimento:empreendimentos(id, nome)
          `)
          .eq('is_active', true)
          .neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)')
          .order('nome', { ascending: true })
          .range((page - 1) * pageSize, page * pageSize - 1);

        fallbackQuery = applyFilters(fallbackQuery, filters);
        const fallback = await fallbackQuery;
        if (fallback.error) throw fallback.error;
        
        return {
          clientes: (fallback.data || []).map((item: any) => ({
            ...item,
            conjuge: null
          })) as unknown as Cliente[],
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        };
      }
      
      if (error) throw error;
      
      // Normalizar conjuge de array para objeto
      const normalized = (data || []).map((item: any) => ({
        ...item,
        conjuge: Array.isArray(item.conjuge) ? item.conjuge[0] || null : item.conjuge
      }));
      
      return {
        clientes: normalized as unknown as Cliente[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    }
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      if (!id) return null;

      const perfKey = `cliente:detail:${id}`;
      perf.start(perfKey, { id });

      // Tenta com join de cônjuge
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          *,
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          gestor:profiles(id, full_name),
          conjuge:clientes!clientes_conjuge_id_fkey(id, nome)
        `)
        .eq('id', id)
        .maybeSingle();

      // Fallback: se erro de schema, tenta sem o join de cônjuge
      if (error?.code === 'PGRST200') {
        console.warn('Schema cache error, retrying without conjuge join (single)');
        perf.start(`${perfKey}:fallback`, { id });
        const fallback = await supabase
          .from('clientes')
          .select(`
            *,
            corretor:corretores(id, nome_completo),
            imobiliaria:imobiliarias(id, nome),
            gestor:profiles(id, full_name)
          `)
          .eq('id', id)
          .maybeSingle();

        if (fallback.error) throw fallback.error;

        perf.end(`${perfKey}:fallback`, { id, ok: true });
        perf.end(perfKey, { id, ok: true, usedFallback: true });

        if (!fallback.data) return null;
        return { ...(fallback.data as any), conjuge: null } as unknown as Cliente;
      }

      if (error) throw error;

      // Normalizar conjuge de array para objeto
      if (data) {
        const normalized = {
          ...data,
          conjuge: Array.isArray((data as any).conjuge) ? (data as any).conjuge[0] || null : (data as any).conjuge,
        };

        perf.end(perfKey, { id, ok: true, usedFallback: false });
        return normalized as unknown as Cliente | null;
      }

      perf.end(perfKey, { id, ok: true, usedFallback: false });

      return null;
    },
    enabled: !!id,
  });
}

export function useClienteStats() {
  return useQuery({
    queryKey: ['clientes-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('fase')
        .eq('is_active', true)
        .neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        prospecto: 0,
        qualificado: 0,
        negociando: 0,
        comprador: 0,
        perdido: 0
      };

      data?.forEach(c => {
        const fase = c.fase as ClienteFase;
        if (fase && stats[fase] !== undefined) {
          stats[fase]++;
        }
      });

      return stats;
    }
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClienteFormData) => {
      const insertData = {
        ...normalizeClienteForSave(data),
        fase: data.fase || 'prospecto'
      };

      const { data: cliente, error } = await supabase
        .from('clientes')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-stats'] });
      invalidateDashboards(queryClient);
      toast.success('Cliente cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar cliente: ' + error.message);
    }
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClienteFormData> }) => {
      const updateData = normalizeClienteForSave(data);
      const { data: cliente, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return cliente;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
      invalidateDashboards(queryClient);
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar cliente: ' + error.message);
    }
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-stats'] });
      invalidateDashboards(queryClient);
      toast.success('Cliente removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover cliente: ' + error.message);
    }
  });
}

// Qualificar cliente (prospecto → qualificado)
export function useQualificarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('clientes')
        .update({ 
          fase: 'qualificado',
          data_qualificacao: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-stats'] });
      invalidateDashboards(queryClient);
      toast.success('Cliente qualificado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao qualificar cliente: ' + error.message);
    }
  });
}

// Marcar como perdido
export function useMarcarPerdido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update({ 
          fase: 'perdido',
          motivo_perda: motivo,
          data_perda: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-stats'] });
      invalidateDashboards(queryClient);
      toast.success('Cliente marcado como perdido');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar cliente: ' + error.message);
    }
  });
}

// Atualizar temperatura
export function useAtualizarTemperatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, temperatura }: { id: string; temperatura: string }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update({ temperatura })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-paginated'] });
      invalidateDashboards(queryClient);
      toast.success('Temperatura atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar temperatura: ' + error.message);
    }
  });
}

// Reativar cliente perdido
export function useReativarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('clientes')
        .update({ 
          fase: 'prospecto',
          motivo_perda: null,
          data_perda: null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-stats'] });
      invalidateDashboards(queryClient);
      toast.success('Cliente reativado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao reativar cliente: ' + error.message);
    }
  });
}

// Atualização em lote de clientes
export function useUpdateClientesEmLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: ClienteUpdateEmLoteData }) => {
      if (ids.length === 0) {
        throw new Error('Nenhum cliente selecionado');
      }

      // Build update object only with provided fields
      const updateData: Record<string, any> = {};
      
      if ('gestor_id' in data) {
        updateData.gestor_id = data.gestor_id;
      }
      if ('fase' in data) {
        updateData.fase = data.fase;
      }
      if ('temperatura' in data) {
        updateData.temperatura = data.temperatura;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      const { error } = await supabase
        .from('clientes')
        .update(updateData)
        .in('id', ids);

      if (error) throw error;

      return { updated: ids.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-stats'] });
      invalidateDashboards(queryClient);
      toast.success(`${result.updated} cliente(s) atualizado(s) com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar clientes: ' + error.message);
    }
  });
}
