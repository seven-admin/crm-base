import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para buscar empreendimentos vinculados ao usuário logado (gestor de produto).
 * Retorna a lista de empreendimentos do gestor e auto-seleciona se houver apenas 1.
 */
export function useGestorEmpreendimentos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gestor-empreendimentos', user?.id],
    queryFn: async () => {
      if (!user?.id) return { empreendimentos: [], autoSelectedId: null };

      // Buscar empreendimentos vinculados ao usuário
      const { data: links, error: linksError } = await supabase
        .from('user_empreendimentos')
        .select('empreendimento_id')
        .eq('user_id', user.id);

      if (linksError) {
        console.error('Erro ao buscar empreendimentos do gestor:', linksError);
        return { empreendimentos: [], autoSelectedId: null };
      }

      if (!links || links.length === 0) {
        return { empreendimentos: [], autoSelectedId: null };
      }

      const empIds = links.map(l => l.empreendimento_id);

      // Buscar dados dos empreendimentos
      const { data: empreendimentos, error } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .in('id', empIds)
        .eq('is_active', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar dados dos empreendimentos:', error);
        return { empreendimentos: [], autoSelectedId: null };
      }

      // Se houver apenas 1 empreendimento, auto-selecionar
      const autoSelectedId = empreendimentos.length === 1 ? empreendimentos[0].id : null;

      return {
        empreendimentos: empreendimentos || [],
        autoSelectedId,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
