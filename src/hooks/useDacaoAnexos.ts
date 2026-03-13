import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DacaoAnexo {
  id: string;
  negociacao_id: string;
  tipo_dacao: string;
  descricao: string | null;
  arquivo_url: string;
  arquivo_nome: string | null;
  created_at: string | null;
  created_by: string | null;
}

export function useDacaoAnexos(negociacaoId?: string) {
  return useQuery({
    queryKey: ['dacao-anexos', negociacaoId],
    enabled: !!negociacaoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('negociacao_dacao_anexos')
        .select('*')
        .eq('negociacao_id', negociacaoId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DacaoAnexo[];
    },
  });
}

export function useUploadDacaoAnexo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      negociacaoId,
      file,
      tipoDacao,
      descricao,
    }: {
      negociacaoId: string;
      file: File;
      tipoDacao: string;
      descricao?: string;
    }) => {
      const ext = file.name.split('.').pop();
      const path = `${negociacaoId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('negociacao-dacao')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('negociacao-dacao')
        .getPublicUrl(path);

      const { data: user } = await supabase.auth.getUser();

      const { error: insertError } = await (supabase as any)
        .from('negociacao_dacao_anexos')
        .insert({
          negociacao_id: negociacaoId,
          tipo_dacao: tipoDacao,
          descricao: descricao || null,
          arquivo_url: urlData.publicUrl,
          arquivo_nome: file.name,
          created_by: user.user?.id,
        });
      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dacao-anexos', variables.negociacaoId] });
      toast.success('Imagem enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao enviar imagem:', error);
      toast.error('Erro ao enviar imagem');
    },
  });
}

export function useDeleteDacaoAnexo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, negociacaoId, arquivoUrl }: { id: string; negociacaoId: string; arquivoUrl: string }) => {
      // Extract path from URL
      const url = new URL(arquivoUrl);
      const pathMatch = url.pathname.match(/negociacao-dacao\/(.+)/);
      if (pathMatch) {
        await supabase.storage.from('negociacao-dacao').remove([pathMatch[1]]);
      }

      const { error } = await supabase
        .from('negociacao_dacao_anexos' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return negociacaoId;
    },
    onSuccess: (negociacaoId) => {
      queryClient.invalidateQueries({ queryKey: ['dacao-anexos', negociacaoId] });
      toast.success('Imagem removida');
    },
    onError: () => toast.error('Erro ao remover imagem'),
  });
}
