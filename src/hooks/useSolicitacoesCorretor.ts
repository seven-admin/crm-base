import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Type assertion helper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface SolicitacaoCorretor {
  id: string;
  codigo: string;
  status_aprovacao: 'pendente' | 'aprovada' | 'rejeitada';
  solicitada_em?: string;
  aprovada_em?: string;
  rejeitada_em?: string;
  motivo_rejeicao?: string;
  observacoes?: string;
  valor_negociacao?: number;
  posicao_fila?: number;
  cliente?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  empreendimento?: {
    id: string;
    nome: string;
  };
  unidades?: {
    id: string;
    unidade_id: string;
    unidade?: {
      id: string;
      codigo: string;
      numero: string;
      bloco?: {
        nome: string;
      };
    };
  }[];
}

export function useSolicitacoesDoCorretor() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['solicitacoes-corretor', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !profile?.email) {
        return [];
      }

      // First, find the corretor record linked to this profile's email
      const { data: corretor, error: corretorError } = await db
        .from('corretores')
        .select('id')
        .eq('email', profile.email)
        .maybeSingle();

      if (corretorError) throw corretorError;

      // Build query - if user is a corretor, filter by corretor_id
      // Otherwise, this hook shouldn't return data (but we keep it flexible)
      let query = db
        .from('negociacoes')
        .select(`
          id,
          codigo,
          status_aprovacao,
          solicitada_em,
          aprovada_em,
          rejeitada_em,
          motivo_rejeicao,
          observacoes,
          valor_negociacao,
          cliente:clientes(id, nome, email, telefone),
          empreendimento:empreendimentos(id, nome),
          unidades:negociacao_unidades(
            id,
            unidade_id,
            unidade:unidades(id, codigo, numero, bloco:blocos(nome))
          )
        `)
        .eq('is_active', true)
        .order('solicitada_em', { ascending: false });

      // Filter by corretor if found
      if (corretor?.id) {
        query = query.eq('corretor_id', corretor.id);
      } else {
        // If no corretor record found, return empty (user is not a corretor in the system)
        return [];
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate queue position for pending items
      const pendentes = (data || []).filter(
        (s: SolicitacaoCorretor) => s.status_aprovacao === 'pendente'
      );
      
      // Get global pending count for position
      const { data: allPendentes } = await db
        .from('negociacoes')
        .select('id, solicitada_em')
        .eq('is_active', true)
        .eq('status_aprovacao', 'pendente')
        .order('solicitada_em', { ascending: true });

      const solicitacoesComPosicao: SolicitacaoCorretor[] = (data || []).map(
        (sol: SolicitacaoCorretor) => {
          if (sol.status_aprovacao === 'pendente' && allPendentes) {
            const posicao = allPendentes.findIndex((p: { id: string }) => p.id === sol.id) + 1;
            return { ...sol, posicao_fila: posicao > 0 ? posicao : undefined };
          }
          return sol;
        }
      );

      return solicitacoesComPosicao;
    },
    enabled: !!profile?.id
  });
}
