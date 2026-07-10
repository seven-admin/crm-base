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

export function useProfilesByEmpresa(empresa: string) {
  return useQuery({
    queryKey: ['profiles-by-empresa', empresa],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, tipo_vinculo')
        .eq('empresa', empresa as any)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return (data || []) as FuncionarioSeven[];
    }
  });
}

export function useProfilesByRoles(roleNames: string[]) {
  return useQuery({
    queryKey: ['profiles-by-roles', roleNames.slice().sort().join(',')],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from('roles')
        .select('id')
        .in('name', roleNames)
        .eq('is_active', true);
      if (rolesErr) throw rolesErr;
      const roleIds = (roles || []).map((r: any) => r.id);
      if (roleIds.length === 0) return [] as FuncionarioSeven[];

      const { data: urs, error: ursErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role_id', roleIds);
      if (ursErr) throw ursErr;
      const userIds = Array.from(new Set((urs || []).map((u: any) => u.user_id)));
      if (userIds.length === 0) return [] as FuncionarioSeven[];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, tipo_vinculo')
        .in('id', userIds)
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return (data || []) as FuncionarioSeven[];
    },
    enabled: roleNames.length > 0,
  });
}
