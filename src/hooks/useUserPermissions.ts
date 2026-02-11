import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScopeType } from '@/types/auth.types';

export interface UserModulePermission {
  id: string;
  user_id: string;
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  scope: ScopeType;
  created_at: string;
  updated_at: string;
}

export interface ModuleWithPermission {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  route: string | null;
  category: string | null;
  is_active: boolean;
  // Permissão do role (base)
  role_permission?: {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    scope: ScopeType;
  };
  // Permissão customizada do usuário (override)
  user_permission?: {
    id: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    scope: ScopeType;
  };
  // Permissão efetiva (user > role)
  effective_permission: {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    scope: ScopeType;
    is_custom: boolean;
  };
}

export function useUserModulePermissions(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-module-permissions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data as UserModulePermission[];
    },
    enabled: !!userId
  });
}

export function useModulesWithPermissions(userId: string | undefined, userRole: string | null | undefined) {
  return useQuery({
    queryKey: ['modules-with-permissions', userId, userRole],
    queryFn: async (): Promise<ModuleWithPermission[]> => {
      if (!userId) return [];

      // Fetch all active modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (modulesError) throw modulesError;

      // Fetch role permissions if user has a role
      let rolePermissions: Record<string, any> = {};
      if (userRole) {
        // First get the role_id from the role name
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', userRole)
          .maybeSingle();

        if (roleData?.id) {
          const { data: rolePerms, error: roleError } = await supabase
            .from('role_permissions')
            .select('*')
            .eq('role_id', roleData.id);

          if (roleError) throw roleError;
          
          rolePermissions = (rolePerms || []).reduce((acc, perm) => {
            acc[perm.module_id] = perm;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Fetch user custom permissions
      const { data: userPerms, error: userError } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', userId);

      if (userError) throw userError;

      const userPermissions = (userPerms || []).reduce((acc, perm) => {
        acc[perm.module_id] = perm;
        return acc;
      }, {} as Record<string, any>);

      // Merge and return
      return (modules || []).map(module => {
        const rolePerm = rolePermissions[module.id];
        const userPerm = userPermissions[module.id];

        const rolePermission = rolePerm ? {
          can_view: rolePerm.can_view,
          can_create: rolePerm.can_create,
          can_edit: rolePerm.can_edit,
          can_delete: rolePerm.can_delete,
          scope: rolePerm.scope as ScopeType
        } : undefined;

        const userPermission = userPerm ? {
          id: userPerm.id,
          can_view: userPerm.can_view,
          can_create: userPerm.can_create,
          can_edit: userPerm.can_edit,
          can_delete: userPerm.can_delete,
          scope: userPerm.scope as ScopeType
        } : undefined;

        // Effective = user override > role
        const effective = userPermission || rolePermission || {
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
          scope: 'proprio' as ScopeType
        };

        return {
          id: module.id,
          name: module.name,
          display_name: module.display_name,
          description: module.description,
          icon: module.icon,
          route: module.route,
          category: (module as any).category || null,
          is_active: module.is_active,
          role_permission: rolePermission,
          user_permission: userPermission,
          effective_permission: {
            ...effective,
            is_custom: !!userPermission
          }
        };
      });
    },
    enabled: !!userId
  });
}

interface SetPermissionParams {
  userId: string;
  moduleId: string;
  permissions: {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    scope: ScopeType;
  };
}

export function useSetUserModulePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, moduleId, permissions }: SetPermissionParams) => {
      // Check if permission already exists
      const { data: existing } = await supabase
        .from('user_module_permissions')
        .select('id')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('user_module_permissions')
          .update({
            ...permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('user_module_permissions')
          .insert({
            user_id: userId,
            module_id: moduleId,
            ...permissions
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-module-permissions', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-permissions', variables.userId] });
      toast.success('Permissão atualizada');
    },
    onError: (error) => {
      console.error('Error setting permission:', error);
      toast.error('Erro ao atualizar permissão');
    }
  });
}

export function useRemoveUserModulePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      const { error } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-module-permissions', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-permissions', variables.userId] });
      toast.success('Permissão removida - usando padrão do perfil');
    },
    onError: (error) => {
      console.error('Error removing permission:', error);
      toast.error('Erro ao remover permissão');
    }
  });
}

export function useResetUserPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['user-module-permissions', userId] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-permissions', userId] });
      toast.success('Permissões restauradas para o padrão do perfil');
    },
    onError: (error) => {
      console.error('Error resetting permissions:', error);
      toast.error('Erro ao restaurar permissões');
    }
  });
}
