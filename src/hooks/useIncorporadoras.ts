import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Incorporadora, IncorporadoraFormData } from '@/types/mercado.types';
import { useToast } from '@/hooks/use-toast';

export function useIncorporadoras() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: incorporadoras = [], isLoading, error } = useQuery({
    queryKey: ['incorporadoras'],
    queryFn: async (): Promise<Incorporadora[]> => {
      const { data, error } = await supabase
        .from('incorporadoras' as any)
        .select('*')
        .eq('is_active', true)
        .order('nome');
      
      if (error) throw error;
      return (data || []) as unknown as Incorporadora[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (formData: IncorporadoraFormData) => {
      const { data, error } = await supabase
        .from('incorporadoras' as any)
        .insert(formData)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as Incorporadora;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incorporadoras'] });
      queryClient.invalidateQueries({ queryKey: ['incorporadoras-paginated'] });
      toast({ title: 'Incorporadora criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao criar incorporadora', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: IncorporadoraFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('incorporadoras' as any)
        .update(formData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as Incorporadora;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incorporadoras'] });
      queryClient.invalidateQueries({ queryKey: ['incorporadoras-paginated'] });
      toast({ title: 'Incorporadora atualizada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao atualizar incorporadora', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('incorporadoras' as any)
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incorporadoras'] });
      queryClient.invalidateQueries({ queryKey: ['incorporadoras-paginated'] });
      toast({ title: 'Incorporadora excluída com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao excluir incorporadora', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  return {
    incorporadoras,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

// Standalone hook to fetch a single incorporadora
export function useIncorporadora(id: string | undefined) {
  return useQuery({
    queryKey: ['incorporadora', id],
    queryFn: async (): Promise<Incorporadora | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('incorporadoras' as any)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as Incorporadora | null;
    },
    enabled: !!id
  });
}

// Paginated hook for incorporadoras
export function useIncorporadorasPaginated(page = 1, pageSize = 20, search?: string) {
  return useQuery({
    queryKey: ['incorporadoras-paginated', page, pageSize, search],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('incorporadoras' as any)
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('nome')
        .range(from, to);

      if (search) {
        query = query.or(`nome.ilike.%${search}%,cnpj.ilike.%${search}%,razao_social.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        incorporadoras: (data || []) as unknown as Incorporadora[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    }
  });
}
