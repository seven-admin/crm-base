import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Corretor, CorretorFormData } from '@/types/mercado.types';
import { useToast } from '@/hooks/use-toast';

type QueryOptions = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

export function useCorretores(_unusedImobiliariaId?: string, options: QueryOptions = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    enabled = true,
    staleTime = 10 * 60 * 1000,
    gcTime = 60 * 60 * 1000,
  } = options;

  const { data: corretores = [], isLoading, error } = useQuery({
    queryKey: ['corretores'],
    queryFn: async (): Promise<Corretor[]> => {
      const { data, error } = await supabase
        .from('seven_corretores')
        .select('*')
        .order('nome_completo');

      if (error) throw error;

      const corretoresData = data || [];
      const userIds = corretoresData
        .filter(c => c.user_id)
        .map(c => c.user_id as string);

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return corretoresData.map(c => ({
          ...c,
          user: c.user_id ? profileMap.get(c.user_id) || null : null,
        })) as Corretor[];
      }

      return corretoresData as Corretor[];
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
  });

  const useCorretorQuery = (id: string | undefined) => useQuery({
    queryKey: ['corretor', id],
    queryFn: async (): Promise<Corretor | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('seven_corretores')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', data.user_id)
          .maybeSingle();
        return { ...data, user: profile || null } as Corretor;
      }
      return data as Corretor;
    },
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: CorretorFormData) => {
      const { imobiliaria_id: _drop, ...rest } = formData as any;
      const insertData = { ...rest, imobiliaria_id: null };
      const { data, error } = await supabase
        .from('seven_corretores')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
      queryClient.invalidateQueries({ queryKey: ['corretores-paginated'] });
      toast({ title: 'Corretor criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar corretor', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: CorretorFormData & { id: string }) => {
      const { imobiliaria_id: _drop, ...rest } = formData as any;
      const { data, error } = await supabase
        .from('seven_corretores')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
      queryClient.invalidateQueries({ queryKey: ['corretores-paginated'] });
      toast({ title: 'Corretor atualizado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar corretor', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seven_corretores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
      queryClient.invalidateQueries({ queryKey: ['corretores-paginated'] });
      toast({ title: 'Corretor excluído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir corretor', description: error.message, variant: 'destructive' });
    },
  });

  return {
    corretores,
    isLoading,
    error,
    useCorretorQuery,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useCorretor(id: string | undefined) {
  return useQuery({
    queryKey: ['corretor', id],
    queryFn: async (): Promise<Corretor | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('seven_corretores')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', data.user_id)
          .maybeSingle();
        return { ...data, user: profile || null } as Corretor;
      }
      return data as Corretor;
    },
    enabled: !!id,
  });
}

export function useCorretoresPaginated(page = 1, pageSize = 20, search?: string, _unusedImobiliariaId?: string, cidade?: string) {
  return useQuery({
    queryKey: ['corretores-paginated', page, pageSize, search, cidade],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('seven_corretores')
        .select('*', { count: 'exact' })
        .order('nome_completo')
        .range(from, to);

      if (search) {
        query = query.or(`nome_completo.ilike.%${search}%,cpf.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (cidade) {
        query = query.eq('cidade', cidade);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const corretoresData = data || [];
      const userIds = corretoresData.filter(c => c.user_id).map(c => c.user_id as string);

      let corretoresWithUsers = corretoresData;
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        corretoresWithUsers = corretoresData.map(c => ({
          ...c,
          user: c.user_id ? profileMap.get(c.user_id) || null : null,
        }));
      }

      return {
        corretores: corretoresWithUsers as Corretor[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
}
