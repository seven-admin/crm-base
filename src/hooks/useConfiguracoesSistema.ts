import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ConfiguracaoSistema {
  id: string;
  chave: string;
  valor: string;
  categoria: string;
  created_at: string;
  updated_at: string;
}

export function useConfiguracoesSistema(categoria?: string) {
  return useQuery({
    queryKey: ['configuracoes-sistema', categoria],
    queryFn: async () => {
      let query = supabase
        .from('configuracoes_sistema')
        .select('*');
      
      if (categoria) {
        query = query.eq('categoria', categoria);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ConfiguracaoSistema[];
    },
  });
}

export function useConfiguracao(chave: string) {
  return useQuery({
    queryKey: ['configuracao-sistema', chave],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .eq('chave', chave)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as ConfiguracaoSistema;
    },
  });
}

export function useUpdateConfiguracao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .update({ valor })
        .eq('chave', chave)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-sistema'] });
      queryClient.invalidateQueries({ queryKey: ['configuracao-sistema'] });
    },
  });
}

export function useUpdateConfiguracoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configs: { chave: string; valor: string }[]) => {
      const promises = configs.map(({ chave, valor }) =>
        supabase
          .from('configuracoes_sistema')
          .update({ valor })
          .eq('chave', chave)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error('Erro ao atualizar configurações');
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-sistema'] });
      queryClient.invalidateQueries({ queryKey: ['configuracao-sistema'] });
    },
  });
}
