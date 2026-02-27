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

      // Fire-and-forget: enrich payload with full negotiation data
      (async () => {
        try {
          const origem = user?.user_metadata?.role === 'incorporador' ? 'portal_incorporador' : 'sistema_interno';

          const [autor, negResult] = await Promise.all([
            getUsuarioLogado(),
            db.from('negociacoes')
              .select(`
                id, codigo, numero_proposta, status_proposta, valor_tabela, valor_proposta, desconto_percentual,
                cliente:clientes!cliente_id(id, nome, cpf, email, telefone),
                empreendimento:empreendimentos!empreendimento_id(id, nome),
                corretor:corretores!corretor_id(id, nome_completo),
                unidades:negociacao_unidades(valor_tabela, valor_proposta,
                  unidade:unidades!unidade_id(numero, codigo, bloco:blocos!bloco_id(nome)))
              `)
              .eq('id', variables.negociacaoId)
              .maybeSingle(),
          ]);

          const neg = negResult?.data;

          dispararWebhook('comentario_proposta', {
            negociacao_id: variables.negociacaoId,
            codigo: neg?.codigo ?? null,
            numero_proposta: neg?.numero_proposta ?? null,
            status_proposta: neg?.status_proposta ?? null,
            comentario: variables.comentario,
            autor: autor ? { id: autor.id, nome: autor.nome, telefone: autor.telefone } : null,
            origem,
            cliente: neg?.cliente ?? null,
            empreendimento: neg?.empreendimento ?? null,
            corretor: neg?.corretor ?? null,
            unidades: neg?.unidades?.map((u: any) => ({
              numero: u.unidade?.numero,
              codigo: u.unidade?.codigo,
              bloco: u.unidade?.bloco?.nome,
              valor_tabela: u.valor_tabela,
              valor_proposta: u.valor_proposta,
            })) ?? [],
            valores: {
              valor_tabela: neg?.valor_tabela ?? null,
              valor_proposta: neg?.valor_proposta ?? null,
              desconto_percentual: neg?.desconto_percentual ?? null,
            },
            link: `${window.location.origin}/negociacoes?id=${variables.negociacaoId}`,
          });
        } catch (err) {
          // Fallback: send minimal payload
          dispararWebhook('comentario_proposta', {
            negociacao_id: variables.negociacaoId,
            comentario: variables.comentario,
            origem: user?.user_metadata?.role === 'incorporador' ? 'portal_incorporador' : 'sistema_interno',
          });
        }
      })();
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar comentário: ' + error.message);
    },
  });
}
