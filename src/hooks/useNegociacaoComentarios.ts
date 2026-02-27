import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { dispararWebhook, getUsuarioLogado } from '@/lib/webhookUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface NegociacaoComentario {
  id: string;
  negociacao_id: string;
  user_id: string | null;
  comentario: string;
  created_at: string;
  user?: { full_name: string };
}

export function useNegociacaoComentarios(negociacaoId: string | undefined) {
  return useQuery({
    queryKey: ['negociacao-comentarios', negociacaoId],
    enabled: !!negociacaoId,
    queryFn: async () => {
      const { data, error } = await db
        .from('negociacao_comentarios')
        .select('*, user:profiles!user_id(full_name)')
        .eq('negociacao_id', negociacaoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as NegociacaoComentario[];
    },
  });
}

export function useAddNegociacaoComentario() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ negociacaoId, comentario }: { negociacaoId: string; comentario: string }) => {
      const { error } = await db
        .from('negociacao_comentarios')
        .insert({
          negociacao_id: negociacaoId,
          user_id: user?.id,
          comentario,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['negociacao-comentarios', variables.negociacaoId] });
      toast.success('Comentário adicionado');

      // Fire-and-forget webhook
      getUsuarioLogado().then((autor) => {
        dispararWebhook('comentario_proposta', {
          negociacao_id: variables.negociacaoId,
          comentario: variables.comentario,
          autor: autor ? { id: autor.id, nome: autor.nome } : null,
          origem: user?.user_metadata?.role === 'incorporador' ? 'portal_incorporador' : 'sistema_interno',
        });
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar comentário: ' + error.message);
    },
  });
}
