import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notificacao {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  referencia_id: string | null;
  referencia_tipo: string | null;
  lida: boolean;
  created_at: string;
}

export function useNotificacoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ['notificacoes', user?.id],
    queryFn: async (): Promise<Notificacao[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as Notificacao[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll every 30s
  });

  const naoLidas = notificacoes.filter(n => !n.lida);

  const marcarComoLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });

  const marcarTodasComoLidas = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });

  const criarNotificacao = useMutation({
    mutationFn: async (data: {
      user_id: string;
      tipo: string;
      titulo: string;
      mensagem: string;
      referencia_id?: string;
      referencia_tipo?: string;
    }) => {
      const { error } = await supabase
        .from('notificacoes')
        .insert(data);
      if (error) throw error;
    },
  });

  return {
    notificacoes,
    naoLidas,
    isLoading,
    marcarComoLida,
    marcarTodasComoLidas,
    criarNotificacao,
  };
}
