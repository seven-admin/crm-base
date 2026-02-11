import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FuncionarioSeven {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  tipo_vinculo: string;
}

export function useFuncionariosSeven() {
  return useQuery({
    queryKey: ['funcionarios-seven'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, tipo_vinculo')
        .eq('tipo_vinculo', 'funcionario_seven')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return (data || []) as FuncionarioSeven[];
    }
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, tipo_vinculo')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return (data || []) as FuncionarioSeven[];
    }
  });
}
