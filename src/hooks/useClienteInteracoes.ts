import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClienteInteracao, ClienteInteracaoFormData } from '@/types/clientes.types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useClienteInteracoes(clienteId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: interacoes = [], isLoading, error } = useQuery({
    queryKey: ['cliente-interacoes', clienteId],
    queryFn: async (): Promise<ClienteInteracao[]> => {
      if (!clienteId) return [];
      
      const { data, error } = await supabase
        .from('cliente_interacoes')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar dados do usuário separadamente se necessário
      const interacoesWithUser = await Promise.all(
        (data || []).map(async (interacao) => {
          if (interacao.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', interacao.user_id)
              .maybeSingle();
            return { ...interacao, user: profile };
          }
          return { ...interacao, user: null };
        })
      );
      
      return interacoesWithUser as ClienteInteracao[];
    },
    enabled: !!clienteId
  });

  const createMutation = useMutation({
    mutationFn: async (formData: ClienteInteracaoFormData) => {
      const { data, error } = await supabase
        .from('cliente_interacoes')
        .insert({
          ...formData,
          user_id: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-interacoes'] });
      toast({ title: 'Interação registrada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao registrar interação', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  return {
    interacoes,
    isLoading,
    error,
    create: createMutation.mutate,
    isCreating: createMutation.isPending
  };
}
