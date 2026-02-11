import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GestorProduto {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  percentual_comissao?: number | null;
}

type QueryOptions = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

export function useGestoresProduto(options: QueryOptions = {}) {
  // Uso principal: selects/listas (mudam pouco) -> cache mais agressivo.
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000,
    gcTime = 60 * 60 * 1000,
  } = options;
  return useQuery({
    queryKey: ['gestores-produto'],
    queryFn: async () => {
      // Buscar role_id do gestor_produto via tabela roles (compatível com roles dinâmicos)
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'gestor_produto')
        .maybeSingle();

      if (roleError || !roleData) {
        console.warn('Não foi possível encontrar o role gestor_produto');
        return [];
      }

      // Buscar user_ids com esse role_id
      const { data: userRoles, error: urError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_id', roleData.id);

      if (urError || !userRoles?.length) {
        return [];
      }

      const userIds = userRoles.map(r => r.user_id);

      // Buscar perfis dos gestores
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, percentual_comissao')
        .in('id', userIds)
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      return (profiles || []) as GestorProduto[];
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
  });
}

// Hook para buscar todos os gestores com percentual de comissão
export function useGestoresComPercentual() {
  return useQuery({
    queryKey: ['gestores-percentual'],
    queryFn: async () => {
      // Buscar role_id do gestor_produto via tabela roles
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'gestor_produto')
        .maybeSingle();

      if (roleError || !roleData) {
        return [];
      }

      // Buscar user_ids com esse role_id
      const { data: userRoles, error: urError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_id', roleData.id);

      if (urError || !userRoles?.length) {
        return [];
      }

      const userIds = userRoles.map(r => r.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, percentual_comissao')
        .in('id', userIds)
        .order('full_name');

      if (profilesError) throw profilesError;

      return (profiles || []) as GestorProduto[];
    }
  });
}

// Hook para atualizar o percentual de comissão de um gestor
export function useUpdatePercentualGestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gestorId, percentual }: { gestorId: string; percentual: number }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ percentual_comissao: percentual })
        .eq('id', gestorId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestores-produto'] });
      queryClient.invalidateQueries({ queryKey: ['gestores-percentual'] });
      toast.success('Percentual de comissão atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar percentual: ${error.message}`);
    },
  });
}
