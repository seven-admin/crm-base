import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserImobiliaria } from './useUserImobiliaria';
import { toast } from 'sonner';

export interface CorretorGestao {
  id: string;
  nome_completo: string;
  email: string | null;
  cpf: string | null;
  creci: string | null;
  telefone: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string | null;
}

export function useGestorCorretores() {
  const { imobiliariaId, isLoading: imobLoading } = useUserImobiliaria();
  const queryClient = useQueryClient();

  const { data: corretores = [], isLoading } = useQuery({
    queryKey: ['gestor-corretores', imobiliariaId],
    queryFn: async (): Promise<CorretorGestao[]> => {
      if (!imobiliariaId) return [];

      const { data, error } = await supabase
        .from('corretores')
        .select('id, nome_completo, email, cpf, creci, telefone, is_active, created_at, user_id')
        .eq('imobiliaria_id', imobiliariaId)
        .order('nome_completo');

      if (error) throw error;
      return (data || []) as CorretorGestao[];
    },
    enabled: !!imobiliariaId,
  });

  const createCorretor = useMutation({
    mutationFn: async (dados: { nome: string; email: string; cpf: string; creci?: string; telefone?: string; password?: string }) => {
      const { nome, password, ...rest } = dados;
      const { data, error } = await supabase.functions.invoke('create-corretor', {
        body: {
          ...rest,
          nome_completo: nome,
          imobiliaria_id: imobiliariaId,
          ...(password ? { password } : {}),
        },
      });

      if (error) {
        let msg = error.message;
        try {
          const ctx = await (error as any).context?.json();
          if (ctx?.error) msg = ctx.error;
        } catch {}
        throw new Error(msg);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Corretor cadastrado com sucesso! Senha de acesso: Seven@1234', { duration: 10000 });
      queryClient.invalidateQueries({ queryKey: ['gestor-corretores'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao cadastrar corretor');
    },
  });

  const updateCorretor = useMutation({
    mutationFn: async ({ id, ...dados }: { id: string; nome?: string; telefone?: string; creci?: string }) => {
      const { error } = await supabase
        .from('corretores')
        .update(dados)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Corretor atualizado!');
      queryClient.invalidateQueries({ queryKey: ['gestor-corretores'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar corretor');
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('corretores')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.is_active ? 'Corretor ativado!' : 'Corretor desativado!');
      queryClient.invalidateQueries({ queryKey: ['gestor-corretores'] });
    },
    onError: () => {
      toast.error('Erro ao alterar status');
    },
  });

  return {
    corretores,
    isLoading: isLoading || imobLoading,
    imobiliariaId,
    createCorretor,
    updateCorretor,
    toggleStatus,
  };
}
