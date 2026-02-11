import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CorretorUsuario {
  // profile data
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  
  // corretor data
  corretor_id: string | null;
  cpf: string | null;
  creci: string | null;
  cidade: string | null;
  uf: string | null;
  whatsapp: string | null;
  imobiliaria_id: string | null;
  imobiliaria_nome: string | null;
}

export function useCorretoresUsuarios() {
  return useQuery({
    queryKey: ['corretores-usuarios'],
    queryFn: async (): Promise<CorretorUsuario[]> => {
      // 1. Buscar user_roles com role corretor (via join com roles table)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role_id, roles!inner(name)')
        .eq('roles.name', 'corretor');

      if (rolesError) throw rolesError;

      const userIds = (userRoles || []).map(ur => ur.user_id);
      if (userIds.length === 0) return [];

      // 2. Buscar profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // 3. Buscar corretores com user_id
      const { data: corretores, error: corretoresError } = await supabase
        .from('corretores')
        .select('*, imobiliaria:imobiliarias(id, nome)')
        .in('user_id', userIds);

      if (corretoresError) throw corretoresError;

      // 4. Merge data
      const corretoresMap = new Map(
        (corretores || []).map(c => [c.user_id, c])
      );

      return (profiles || []).map(profile => {
        const corretor = corretoresMap.get(profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone || null,
          avatar_url: profile.avatar_url || null,
          is_active: profile.is_active,
          created_at: profile.created_at,
        corretor_id: corretor?.id || null,
        cpf: corretor?.cpf || null,
        creci: corretor?.creci || null,
        cidade: (corretor as any)?.cidade || null,
        uf: (corretor as any)?.uf || null,
        whatsapp: corretor?.telefone || null,
        imobiliaria_id: corretor?.imobiliaria_id || null,
        imobiliaria_nome: (corretor?.imobiliaria as any)?.nome || null
        };
      });
    }
  });
}

// Mutation para atualizar dados do corretor
export function useUpdateCorretorUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      corretorId: string | null;
      fullName: string;
      phone: string | null;
      isActive: boolean;
      cpf?: string;
      creci?: string;
      cidade?: string;
      uf?: string;
    }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone,
          is_active: data.isActive
        })
        .eq('id', data.userId);

      if (profileError) throw profileError;

      // Update corretor if exists
      if (data.corretorId) {
        const { error: corretorError } = await supabase
          .from('corretores')
          .update({
            nome_completo: data.fullName,
            cpf: data.cpf?.replace(/\D/g, '') || null,
            creci: data.creci || null,
            cidade: data.cidade || null,
            uf: data.uf || null
          })
          .eq('id', data.corretorId);

        if (corretorError) throw corretorError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Corretor atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating corretor:', error);
      toast.error('Erro ao atualizar corretor');
    }
  });
}

// Mutation para excluir corretor (usa edge function)
export function useDeleteCorretorUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao excluir usuário');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Corretor excluído com sucesso');
    },
    onError: (error: Error) => {
      console.error('Error deleting corretor:', error);
      toast.error(error.message || 'Erro ao excluir corretor');
    }
  });
}

// Mutation para criar vínculo de corretor (quando falta registro na tabela corretores)
export function useCreateCorretorVinculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      userId: string; 
      email: string; 
      nome: string;
      cpf?: string;
      creci?: string;
      imobiliaria_id?: string;
    }) => {
      const { data: insertedData, error } = await supabase
        .from('corretores')
        .insert({
          user_id: data.userId,
          email: data.email,
          nome_completo: data.nome,
          cpf: data.cpf?.replace(/\D/g, '') || null,
          creci: data.creci || null,
          imobiliaria_id: data.imobiliaria_id || '00000000-0000-0000-0000-000000000001',
          is_active: true
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return insertedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['meu-corretor'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Vínculo de corretor criado com sucesso');
    },
    onError: (error: Error) => {
      console.error('Error creating corretor vinculo:', error);
      toast.error('Erro ao criar vínculo: ' + error.message);
    }
  });
}
