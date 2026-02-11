import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Role, RolePermission, Module } from '@/types/auth.types';

// Fetch all roles
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async (): Promise<Role[]> => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch all roles including inactive (admin view)
export function useAllRoles() {
  return useQuery({
    queryKey: ['roles-all'],
    queryFn: async (): Promise<Role[]> => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch modules with category
export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, display_name, category, is_active')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return (data || []) as Array<{ id: string; name: string; display_name: string; category: string | null; is_active: boolean }>;
    },
  });
}

// Fetch modules grouped by category
export function useModulesGrouped() {
  const { data: modules, isLoading } = useModules();
  
  const grouped = modules?.reduce((acc, module) => {
    const category = module.category || 'outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(module);
    return acc;
  }, {} as Record<string, typeof modules>) || {};
  
  return { data: grouped, isLoading };
}

// Fetch role permissions by role_id
export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: async (): Promise<RolePermission[]> => {
      if (!roleId) return [];

      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          id,
          role_id,
          module_id,
          can_view,
          can_create,
          can_edit,
          can_delete,
          scope,
          module:modules(id, name, display_name)
        `)
        .eq('role_id', roleId);

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        module: Array.isArray(item.module) ? item.module[0] : item.module
      })) as RolePermission[];
    },
    enabled: !!roleId,
  });
}

// Create role
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; display_name: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from('roles')
        .insert({
          name: data.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: data.display_name,
          description: data.description,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles-all'] });
      toast.success('Perfil criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar perfil:', error);
      toast.error('Erro ao criar perfil');
    },
  });
}

// Clone role with permissions
export function useCloneRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceRoleId, newDisplayName }: { sourceRoleId: string; newDisplayName: string }) => {
      // Get source role
      const { data: sourceRole, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', sourceRoleId)
        .single();

      if (roleError) throw roleError;

      // Create new role
      const newName = newDisplayName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      const { data: newRole, error: createError } = await supabase
        .from('roles')
        .insert({
          name: newName,
          display_name: newDisplayName,
          description: `Clone de ${sourceRole.display_name}`,
          is_system: false,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Get source permissions
      const { data: sourcePerms, error: permsError } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', sourceRoleId);

      if (permsError) throw permsError;

      // Copy permissions to new role
      if (sourcePerms && sourcePerms.length > 0) {
        const newPerms = sourcePerms.map(perm => ({
          role_id: newRole.id,
          module_id: perm.module_id,
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete,
          scope: perm.scope,
        }));

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(newPerms as any);

        if (insertError) throw insertError;
      }

      return newRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles-all'] });
      toast.success('Perfil clonado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao clonar perfil:', error);
      toast.error('Erro ao clonar perfil');
    },
  });
}

// Update role
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; display_name?: string; description?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('roles')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles-all'] });
      toast.success('Perfil atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    },
  });
}

// Delete (deactivate) role
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First check if any users have this role
      const { data: usersWithRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_id', id)
        .limit(1);

      if (usersWithRole && usersWithRole.length > 0) {
        // Get the "sem_acesso" role or create fallback
        const { data: noAccessRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'cliente_externo')
          .single();

        if (noAccessRole) {
          // Move users to cliente_externo role
          await supabase
            .from('user_roles')
            .update({ role_id: noAccessRole.id })
            .eq('role_id', id);
        }
      }

      // Deactivate the role
      const { error } = await supabase
        .from('roles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles-all'] });
      toast.success('Perfil removido!');
    },
    onError: (error) => {
      console.error('Erro ao remover perfil:', error);
      toast.error('Erro ao remover perfil');
    },
  });
}

// Update role permission
export function useUpdateRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      roleId, 
      moduleId, 
      permission 
    }: { 
      roleId: string; 
      moduleId: string; 
      permission: Partial<{
        can_view: boolean;
        can_create: boolean;
        can_edit: boolean;
        can_delete: boolean;
        scope: string;
      }>;
    }) => {
      const { data: existing } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('role_id', roleId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('role_permissions')
          .update(permission)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role_id: roleId,
            module_id: moduleId,
            can_view: permission.can_view ?? false,
            can_create: permission.can_create ?? false,
            can_edit: permission.can_edit ?? false,
            can_delete: permission.can_delete ?? false,
            scope: permission.scope ?? 'proprio',
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', roleId] });
      toast.success('Permissão atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar permissão:', error);
      toast.error('Erro ao atualizar permissão');
    },
  });
}

// Legacy enum roles for backward compatibility
const LEGACY_ENUM_ROLES = [
  'admin', 'super_admin', 'gestor_produto', 'corretor', 
  'incorporador', 'cliente_externo', 'equipe_marketing',
  'supervisor_relacionamento', 'supervisor_render', 
  'supervisor_criacao', 'supervisor_video'
];

// Bulk update role permissions
export function useBulkUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      roleId, 
      permissions 
    }: { 
      roleId: string; 
      permissions: Array<{
        moduleId: string;
        can_view: boolean;
        can_create: boolean;
        can_edit: boolean;
        can_delete: boolean;
        scope: string;
      }>;
    }) => {
      // Get role info to determine if it exists in legacy enum
      const { data: roleInfo } = await supabase
        .from('roles')
        .select('name')
        .eq('id', roleId)
        .single();

      // Check if role exists in legacy enum
      const legacyRole = roleInfo && LEGACY_ENUM_ROLES.includes(roleInfo.name) 
        ? roleInfo.name 
        : null;

      for (const perm of permissions) {
        const { data: existing } = await supabase
          .from('role_permissions')
          .select('id')
          .eq('role_id', roleId)
          .eq('module_id', perm.moduleId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('role_permissions')
            .update({
              can_view: perm.can_view,
              can_create: perm.can_create,
              can_edit: perm.can_edit,
              can_delete: perm.can_delete,
              scope: perm.scope,
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('role_permissions')
            .insert({
              role_id: roleId,
              role: legacyRole, // NULL for dynamic roles, value for legacy roles
              module_id: perm.moduleId,
              can_view: perm.can_view,
              can_create: perm.can_create,
              can_edit: perm.can_edit,
              can_delete: perm.can_delete,
              scope: perm.scope,
            } as any);
        }
      }
    },
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', roleId] });
      toast.success('Permissões do perfil atualizadas!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar permissões:', error);
      toast.error('Erro ao atualizar permissões');
    },
  });
}
