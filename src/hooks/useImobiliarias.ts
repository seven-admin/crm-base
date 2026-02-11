import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Imobiliaria, ImobiliariaFormData } from '@/types/mercado.types';
import { useToast } from '@/hooks/use-toast';
import { dispararWebhook } from '@/lib/webhookUtils';

type QueryOptions = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

export function useImobiliarias(options: QueryOptions = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    enabled = true,
    staleTime = 10 * 60 * 1000,
    gcTime = 60 * 60 * 1000,
  } = options;

  const { data: imobiliarias = [], isLoading, error } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: async (): Promise<Imobiliaria[]> => {
      const { data, error } = await supabase
        .from('imobiliarias')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      
      // Get corretores count for each imobiliaria
      const { data: corretores } = await supabase
        .from('corretores')
        .select('imobiliaria_id');
      
      const counts: Record<string, number> = {};
      corretores?.forEach(c => {
        if (c.imobiliaria_id) {
          counts[c.imobiliaria_id] = (counts[c.imobiliaria_id] || 0) + 1;
        }
      });
      
      return (data || []).map(imob => ({
        ...imob,
        corretores_count: counts[imob.id] || 0
      }));
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: ImobiliariaFormData) => {
      const { data, error } = await supabase
        .from('imobiliarias')
        .insert(formData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      queryClient.invalidateQueries({ queryKey: ['imobiliarias-paginated'] });
      toast({ title: 'Imobiliária criada com sucesso!' });
      dispararWebhook('imobiliaria_cadastrada', {
        id: data.id,
        nome: data.nome,
        cnpj: data.cnpj,
        site: data.site,
        telefone: data.telefone,
        whatsapp: data.whatsapp,
        email: data.email,
        gestor_nome: data.gestor_nome,
        gestor_telefone: data.gestor_telefone,
        gestor_email: data.gestor_email,
        endereco_logradouro: data.endereco_logradouro,
        endereco_numero: data.endereco_numero,
        endereco_complemento: data.endereco_complemento,
        endereco_bairro: data.endereco_bairro,
        endereco_cidade: data.endereco_cidade,
        endereco_uf: data.endereco_uf,
        endereco_cep: data.endereco_cep,
        is_active: data.is_active,
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao criar imobiliária', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: ImobiliariaFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('imobiliarias')
        .update(formData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      queryClient.invalidateQueries({ queryKey: ['imobiliarias-paginated'] });
      toast({ title: 'Imobiliária atualizada com sucesso!' });
      dispararWebhook('imobiliaria_atualizada', {
        id: data.id,
        nome: data.nome,
        cnpj: data.cnpj,
        site: data.site,
        telefone: data.telefone,
        whatsapp: data.whatsapp,
        email: data.email,
        gestor_nome: data.gestor_nome,
        gestor_telefone: data.gestor_telefone,
        gestor_email: data.gestor_email,
        endereco_logradouro: data.endereco_logradouro,
        endereco_numero: data.endereco_numero,
        endereco_complemento: data.endereco_complemento,
        endereco_bairro: data.endereco_bairro,
        endereco_cidade: data.endereco_cidade,
        endereco_uf: data.endereco_uf,
        endereco_cep: data.endereco_cep,
        is_active: data.is_active,
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao atualizar imobiliária', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('delete-imobiliaria', {
        body: { imobiliaria_id: id },
      });

      if (error) throw error;

      // Edge functions may return { error } in the JSON body with 200 depending on handler.
      if ((data as any)?.error) {
        throw new Error((data as any).error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      queryClient.invalidateQueries({ queryKey: ['imobiliarias-paginated'] });
      toast({ title: 'Imobiliária excluída com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao excluir imobiliária', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  return {
    imobiliarias,
    isLoading,
    error,
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

// Standalone hook to fetch a single imobiliaria
export function useImobiliaria(id: string | undefined) {
  return useQuery({
    queryKey: ['imobiliaria', id],
    queryFn: async (): Promise<Imobiliaria | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('imobiliarias')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });
}

// Paginated hook for imobiliarias
export function useImobiliariasPaginated(page = 1, pageSize = 20, search?: string) {
  return useQuery({
    queryKey: ['imobiliarias-paginated', page, pageSize, search],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('imobiliarias')
        .select('*', { count: 'exact' })
        .order('nome')
        .range(from, to);

      if (search) {
        query = query.or(`nome.ilike.%${search}%,cnpj.ilike.%${search}%,endereco_cidade.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Get corretores count for each imobiliaria
      const { data: corretores } = await supabase
        .from('corretores')
        .select('imobiliaria_id');

      const counts: Record<string, number> = {};
      corretores?.forEach(c => {
        if (c.imobiliaria_id) {
          counts[c.imobiliaria_id] = (counts[c.imobiliaria_id] || 0) + 1;
        }
      });

      const imobiliarias = (data || []).map(imob => ({
        ...imob,
        corretores_count: counts[imob.id] || 0
      }));

      return {
        imobiliarias,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    }
  });
}
