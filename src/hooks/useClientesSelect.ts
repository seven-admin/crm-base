import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClienteSelect {
  id: string;
  nome: string;
  cpf: string | null;
}

/**
 * Hook otimizado para seleção de clientes em comboboxes/selects.
 * Busca apenas id, nome e cpf para melhor performance.
 */
export function useClientesSelect(excludeId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['clientes-select', excludeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, cpf')
        .eq('is_active', true)
        .not('nome', 'ilike', 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      
      // Filtrar excluindo o ID se fornecido
      const result = data || [];
      return excludeId 
        ? result.filter((c) => c.id !== excludeId) 
        : result;
    },
    staleTime: 30000, // 30 segundos
    enabled, // Só executa quando enabled=true (lazy loading)
  });
}
