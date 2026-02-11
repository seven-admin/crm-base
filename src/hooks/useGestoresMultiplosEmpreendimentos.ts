import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GestorEmpreendimentoMap {
  [empreendimentoId: string]: {
    id: string;
    nome: string;
  };
}

/**
 * Hook para buscar gestores de produto de múltiplos empreendimentos de uma vez.
 * Evita N+1 queries ao buscar todos em uma única operação.
 */
export function useGestoresMultiplosEmpreendimentos(empreendimentoIds: string[]) {
  return useQuery({
    queryKey: ['gestores-multiplos-empreendimentos', empreendimentoIds],
    queryFn: async (): Promise<GestorEmpreendimentoMap> => {
      if (empreendimentoIds.length === 0) return {};

      // Buscar role_id do gestor_produto
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'gestor_produto')
        .maybeSingle();

      if (roleError || !roleData) {
        console.warn('Não foi possível encontrar o role gestor_produto:', roleError);
        return {};
      }

      // Buscar user_ids que são gestores de produto
      const { data: userRoles, error: urError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_id', roleData.id);

      if (urError || !userRoles?.length) {
        return {};
      }

      const gestorUserIds = userRoles.map(r => r.user_id);

      // Buscar vínculos de empreendimento dos gestores
      const { data: links, error: linksError } = await supabase
        .from('user_empreendimentos')
        .select('empreendimento_id, user_id')
        .in('empreendimento_id', empreendimentoIds)
        .in('user_id', gestorUserIds);

      if (linksError || !links?.length) {
        return {};
      }

      // Buscar nomes dos gestores
      const linkedUserIds = [...new Set(links.map(l => l.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', linkedUserIds);

      if (profilesError) {
        console.warn('Erro ao buscar profiles dos gestores:', profilesError);
        return {};
      }

      // Criar mapa de userId -> nome
      const userNameMap: Record<string, string> = {};
      profiles?.forEach(p => {
        userNameMap[p.id] = p.full_name || 'Sem nome';
      });

      // Criar mapa de empreendimento -> gestor
      const gestorMap: GestorEmpreendimentoMap = {};
      links.forEach(link => {
        if (!gestorMap[link.empreendimento_id] && userNameMap[link.user_id]) {
          gestorMap[link.empreendimento_id] = {
            id: link.user_id,
            nome: userNameMap[link.user_id],
          };
        }
      });

      return gestorMap;
    },
    enabled: empreendimentoIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
