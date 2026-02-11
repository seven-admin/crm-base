import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Empreendimento {
  id: string;
  nome: string;
  status: string;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
}

interface UseIncorporadorEmpreendimentosResult {
  empreendimentoIds: string[];
  empreendimentos: Empreendimento[];
  isLoading: boolean;
  isIncorporador: boolean;
}

export function useIncorporadorEmpreendimentos(): UseIncorporadorEmpreendimentosResult {
  const { user, role } = useAuth();
  const isIncorporador = role === 'incorporador';

  const query = useQuery({
    queryKey: ['incorporador-empreendimentos', user?.id],
    queryFn: async () => {
      if (!user?.id) return { ids: [], empreendimentos: [] };

      const { data, error } = await supabase
        .from('user_empreendimentos')
        .select(`
          empreendimento_id,
          empreendimento:empreendimentos(id, nome, status, endereco_cidade, endereco_uf)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const empreendimentos = (data || [])
        .map(d => d.empreendimento as unknown as Empreendimento)
        .filter(Boolean);

      return {
        ids: empreendimentos.map(e => e.id),
        empreendimentos,
      };
    },
    enabled: !!user && isIncorporador,
  });

  return {
    empreendimentoIds: query.data?.ids || [],
    empreendimentos: query.data?.empreendimentos || [],
    isLoading: query.isLoading,
    isIncorporador,
  };
}
